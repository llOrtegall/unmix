# 0021 — In-process domain events, outbox and reconciliation

- **Status:** Accepted, amended by [0029](0029-separation-jobs-and-outbox-modules.md)
- **Date:** 2026-10-27
- **Complements:** [0014](0014-transactional-outbox.md)

## Context

The `library` and `separation` modules must stay consistent (track and job state) without importing each other. Also, the API may be down while the worker finishes a job, and BullMQ's `QueueEvents` does not replay missed events.

## Decision

- **Implicit transactions:** `TransactionManager` uses `AsyncLocalStorage`; repositories pick up the active transaction without receiving it as a parameter.
- **Event publishing:** `EventPublisher.publish` writes each event to the `outbox` and runs the in-process handlers inside the same transaction. That way `separation.requested` / `completed` / `failed` update the `Track` atomically with the job.
- **Relay:** a process inside the API reads the outbox (`FOR UPDATE SKIP LOCKED`) and publishes to BullMQ only the events that have an external route (`separation.requested` → `separation.requested.v1`).
- **Idempotency:** the BullMQ job id is the separation job id, and `JobLifecycle` ignores duplicates, late events and unknown jobs.
- **Reconciliation:** on startup, `ReconcileJobs` compares every unfinished job with its state in the queue and applies the outcome.
- **Final failure:** on a `failed` event, the API confirms with the queue that the job ran out of retries before marking it as failed.

## Consequences

- Consistency across modules without direct dependencies; an error in a handler rolls back the whole operation.
- Verified: with the API stopped during a job, after a restart both the job and the track end up `completed`.
- SSE notifications are sent after the commit, per instance. Every API instance receives all queue events, so it scales horizontally.
