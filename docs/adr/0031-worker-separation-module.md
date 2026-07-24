# 0031 — The worker as a clean-architecture module, and `separation.*` failure codes

- **Status:** Accepted
- **Date:** 2026-10-29
- **Amends:** [0013](0013-result-type.md) (worker side), [0016](0016-contracts-zod-json-schema-pydantic.md), [0018](0018-dependency-rules-in-ci.md)
- **Follows:** [0028](0028-clean-architecture-skills.md), [0029](0029-separation-jobs-and-outbox-modules.md)

## Context

Step 5 of the refactor moves the Python worker to the shared clean-architecture rules. The worker had a hexagonal layout (`domain/`, `application/ports.py`, `adapters/`), a `SeparateTrack` class, plain dataclasses with raw strings and floats, and business failures returned as `Result` values with codes such as `INVALID_MEDIA`. The API and the web read those codes, and the API stores them in `separation_jobs.failure`.

## Decision

**One module.** `modules/separation/{domain,application,infrastructure}` plus `modules/shared/domain/domain_error.py`. Entrypoints and bootstrap sit outside: `consumers/separation_consumer.py`, `config.py` (pydantic-settings, the only reader of the environment) and `main.py`.

**Domain.** Every Value Object, Entity and list is a frozen dataclass whose `__post_init__` runs the `_ensure_*` guards, with `create`, `from_primitive` and `to_primitive`. `SeparationTask` is the entity (id `JobId`) that knows its object keys and builds the `SeparationOutcome`. `Progress.at(stage, fraction)` holds the per-stage ranges, `RelativeLoudness.is_silent()` the silence threshold, `AudioDuration.ensure_within(limit)` the length limit, and `SeparatedStem.should_be_transcribed()` the MIDI rule. `SeparatedStemList` and `StemList` reject empty and duplicated stems.

**Synchronous repositories.** Separation is CPU-bound and runs in a thread (`asyncio.to_thread`), so the `Protocol`s and use cases are synchronous: `StorageRepository`, `MediaRepository`, `PreviewRepository`, `SeparatorRepository`, `TranscriberRepository` and `ProgressRepository`. Infrastructure translates vendor failures into domain errors: an S3 404 raises `InputNotFoundError`, and an ffmpeg failure or an empty track raises `InvalidMediaError`. A failed transcription returns no MIDI, because MIDI is optional ([ADR 0027](0027-midi-transcription.md)).

**Use cases.** `separate_track` is a closure that downloads, normalizes, checks the duration, separates, and publishes the stems in parallel. It builds `publish_stem` from its own dependencies. The factory is built **per job**, because progress goes to one BullMQ job. It receives the preloaded Demucs and Basic Pitch repositories and the shared S3 client, and creates the cheap repositories itself. `main.py` binds the shared resources with `functools.partial`, so the consumer never imports infrastructure.

**Errors.** Every rule has its own error class in `errors.py` with a `separation.*` code. The consumer is the only place that maps errors to the queue:
- `ValidationError` and `NotFoundError` raise `UnrecoverableError` with the error's code and `retryable: false`.
- Any other exception is retried by BullMQ with `separation.failed`.
- A message that fails pydantic validation is `separation.invalid_message`.

`failedReason` stays a JSON `SeparationFailureV1`.

**Failure codes in the contract.** `SeparationFailureCode` lists every code the worker can emit, so the stored failure says exactly what went wrong. A worker test checks that each error code is in the generated contract. An API infrastructure test checks that `JobFailure` accepts every contract code, because the API domain keeps its own list. `STORAGE_ERROR` is dropped, since nothing emitted it. The API uses `separation.failed` for a job lost from the queue and for an invalid worker result.

**Data migration.** `0005_separation_failure_codes` rewrites the old codes in `separation_jobs.failure`, and in the payload of `separation.failed` outbox events, to their `separation.*` names. `SEPARATION_ERROR` and `STORAGE_ERROR` become `separation.failed`. The migration only touches rows that still have an old code, so running it twice is safe.

**Dependency rules.** import-linter enforces the following:
- `infrastructure > application > domain`, with an exception only for `application.factory`.
- The domain and the application import no external packages and not the generated contracts. The factory is the exception for the application.
- `consumers` never imports infrastructure.
- `modules` never imports `consumers`, `config` or `main`.

`mypy --strict` runs in `make check`.

## Consequences

- The worker reads like the API: Value Objects, closures, one factory, one place that maps errors.
- `separation.no_stems` is no longer retried. It used to be `SEPARATION_ERROR`, and a retry cannot fix it.
- A job still waiting in Redis with an old `failedReason` fails the contract when the API reads it, and becomes `separation.failed`.
- The web keys move to `error.separation.*`. Codes without their own text fall back to the generic message.
- The S3 repository has an integration test against SeaweedFS (Testcontainers), and the ffmpeg repository one against a real ffmpeg, so CI installs ffmpeg for the worker job.
