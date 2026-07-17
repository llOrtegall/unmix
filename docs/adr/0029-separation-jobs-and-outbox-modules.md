# 0029 — Separation jobs and the outbox as clean-architecture modules

- **Status:** Accepted
- **Date:** 2026-10-29
- **Amends:** [0014](0014-transactional-outbox.md), [0021](0021-in-process-events-and-reconciliation.md)
- **Follows:** [0028](0028-clean-architecture-skills.md)

## Context

Step 3 of the refactor moves the `separation` module and the outbox to the shared clean-architecture rules. The old code had a mutable `SeparationJob` built on `AggregateRoot`, `Result` values, a `JobLifecycle` class with one method per queue event, and an outbox publisher and relay living in `shared/infrastructure`. Reconciliation used its own `switch` to decide which transition a queue state implies, so the live path and the startup path could drift apart.

## Decision

**Domain events.** `modules/shared/domain` gains an abstract `DomainEvent` (`EventId`, type, `OccurredAt`) and an immutable `DomainEventList`. Entities carry the list, and each modifier returns a new instance with the event added. `EventRepository` publishes a list and lets entrypoints subscribe to an event class. `OutboxEventRepository` implements it: it writes the events to the outbox and runs the in-process subscribers inside the same transaction, as ADR 0021 describes. `DomainEventList` has no `fromPrimitive`: events are never rehydrated as a list, and each event class has its own.

**Separation domain.** `SeparationJob` is immutable and every attribute is a Value Object (`JobStatus`, `Stage`, `Progress`, `JobFailure`, `ModelName`, `CreatedAt`, `FinishedAt`). `SeparationResult` reuses the library's `TrackDuration` and `StemList`, and `SeparationJob.request` takes the library's `Track`. The separation domain depends on the library domain, and never the other way round. `QueueJobState` is a Value Object with five variants (pending, active, completed, failed, missing), and `applyTo(job)` decides which transition each one implies. Late, repeated or out-of-order outcomes are no-ops; a contradictory one (completing a failed job) throws `job.invalid_transition`.

**One path for queue outcomes.** A `failed` queue event does not say whether retries are left, so the API has to ask the queue anyway. `completed` and `failed` events, and startup reconciliation, all go through `syncJob`: it reads the job's state in the queue and applies it. The worker's result is parsed in one place, `BullMqQueueRepository`. `progress` events carry their data and go through `recordJobProgress`. This costs one Redis read per finished job. There is no separate `completeJob` or `failJob`.

**Row lock for transitions.** Every transition loads the job with `findByIdForUpdate` (`SELECT … FOR UPDATE`) inside a transaction. Without it, a `progress` event handled at the same time as a `completed` one could overwrite the completed job and leave it processing.

**Outbox module.** `modules/outbox` owns the relay: `OutboxEvent` (`markAsPublished`, `recordFailure`), `OutboxRepository` and `EventRouteRepository`, which delivers an event to the external system that has a route for it, or does nothing. `relayPendingEvents` runs one batch in a transaction (`FOR UPDATE SKIP LOCKED`). A delivery failure is recorded on the event, and the batch carries on.

**Entrypoints.** `consumers/separationQueueConsumer.ts` turns BullMQ queue events into use cases, and `consumers/libraryEventConsumer.ts` subscribes the library's `startTrackSeparation`, `completeTrackSeparation` and `failTrackSeparation` to the separation events. `jobs/` holds the outbox relay, garbage collection and reconciliation. `routes/separationRoutes.ts` serves the job endpoints and the SSE stream.

**Behavior changes.**
- An event for an unknown job throws `job.not_found`, and the consumer logs it. It used to be ignored silently.
- A worker result that does not match the contract fails the job with `SEPARATION_ERROR`. It used to leave the job processing forever.
- Requesting a separation no longer notifies live listeners, since none can exist for a job that was just created.
- Job errors use the `{ code, message }` contract: `job.not_found` (404) and `job.invalid_transition` (409) replace `JOB_NOT_FOUND` and `INVALID_TRANSITION`.

## Consequences

- Live queue events and reconciliation apply the same domain rules.
- Each transition takes one extra transaction and a row lock, and each finished job costs one extra Redis read.
- `JobFailure` accepts only the failure codes the worker sends today. The worker step renames them to `separation.*`, so it needs a data migration for stored failures.
- `shared/kernel`, `shared/interface`, the `Clock` and `IdGenerator` adapters, `test/unit` and `neverthrow` become dead code, and are removed in this step instead of the next one.
