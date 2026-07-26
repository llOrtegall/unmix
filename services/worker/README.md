# worker

Python worker that consumes `separation.requested.v1` jobs from the BullMQ queue `separation`, splits the track into stems with Demucs (CPU) and uploads them as FLAC.

Architecture: clean architecture, one `separation` module ([docs/07](../../docs/07-code-structure.md), [ADR 0031](../../docs/adr/0031-worker-separation-module.md)). Layer rules are enforced by `import-linter`, types by `mypy --strict`.

```
src/unmix_worker/
  modules/shared/domain/          DomainError and its categories
  modules/separation/domain/      SeparationTask, Stem, StemList, Progress, AudioDuration, ... + repository Protocols, errors.py
  modules/separation/application/ separate_track, publish_stem, factory (SeparationModule, built per job)
  modules/separation/infrastructure/
                                  s3_storage, ffmpeg_media, ffmpeg_preview, demucs_separator,
                                  basic_pitch_transcriber, bullmq_progress (all *_repository)
  consumers/separation_consumer.py  BullMQ processor: validates the message, runs separate_track, maps errors
  contracts/                      pydantic models generated from packages/contracts (do not edit generated.py)
  config.py                       pydantic-settings
  main.py                         bootstrap
```

## Commands

```bash
uv sync                 # install (torch CPU wheels)
make check              # ruff + mypy + import-linter + pytest (coverage ≥ 80 % on modules)
make contracts          # regenerate pydantic models after changing packages/contracts
make run                # run locally (needs env vars, see below)
```

Tests live in `tests/modules/separation` (domain, use cases with Object Mothers and `Mock(spec=Protocol)` RepositoryMothers, infrastructure) and `tests/consumers`. The S3 test starts SeaweedFS with Testcontainers (needs Docker), and the ffmpeg tests need `ffmpeg` on the `PATH`. Demucs and Basic Pitch are covered by the end-to-end runs.

Run locally against the compose infra:

```bash
uv run --env-file ../../.env python -m unmix_worker.main
uv run --env-file ../../.env scripts/enqueue.py /path/to/song.mp3   # upload + enqueue + follow
```

Or in Docker: `docker compose up -d worker` (model weights are baked into the image).

The image is multi-stage: uv resolves the venv in a build stage (no package cache kept), and the runtime stage gets the venv, the model weights and a static `ffmpeg` binary. ffprobe is not needed: the normalized WAV's duration is read with `soundfile`. About 2.3 GB: PyTorch, plus the scipy/numba/onnxruntime stack Basic Pitch needs.

## Job lifecycle

| Stage | Progress |
|-------|----------|
| downloading | 0–5 |
| normalizing (ffmpeg → WAV 44.1 kHz) | 5–10 |
| separating (Demucs) | 10–90 |
| uploading (FLAC + MP3 preview + peaks JSON + MIDI per stem, all stems in parallel) | 90–100 |

- Success: return value `SeparationCompletedV1` (stems with key, size, `silent` flag and, for pitched stems with content, `midiKey`).
- MIDI: Basic Pitch through its ONNX model, no TensorFlow ([ADR 0027](../../docs/adr/0027-midi-transcription.md)). A transcription failure is logged and the stem ships without MIDI.
- Logs: each stage's duration (`job <id> separating took 79.8 s`) and the upload time on completion.
- Business failure (a domain `ValidationError` or `NotFoundError`, e.g. `separation.invalid_media`, `separation.duration_exceeded`, `separation.input_not_found`; or `separation.invalid_message` when the job data breaks the contract): `UnrecoverableError`, no retries. `failedReason` holds a JSON `SeparationFailureV1` with the error's code. Full list in [docs/03](../../docs/03-api-contract.md).
- Unexpected failure: `separation.failed`, retried by BullMQ according to the producer's `attempts`/`backoff`.
- Worker crash: the job lock expires (60 s) and BullMQ re-queues the stalled job. `maxStalledCount: 2`, so a job survives two crashes before it fails.

## Environment

`REDIS_URL`, `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `DEMUCS_MODEL` (default `htdemucs_6s`), `MAX_DURATION_SECONDS` (600), `TORCH_THREADS` (0 = torch default), `LOG_LEVEL`.
