# worker

Python worker that consumes `separation.requested.v1` jobs from the BullMQ queue `separation`, splits the track into stems with Demucs (CPU) and uploads them as FLAC.

Architecture: hexagonal ([docs/07](../../docs/07-code-structure.md)). Layer rules are enforced by `import-linter`.

```
src/unmix_worker/
  domain/        SeparationTask, Stem, Stage, progress mapping, silence rule, failures, Result
  application/   SeparateTrack use case + ports (ObjectStorage, MediaNormalizer, StemSeparator, ProgressReporter)
  adapters/      s3_storage, ffmpeg_normalizer, demucs_separator, bullmq_consumer
  contracts/     pydantic models generated from packages/contracts (do not edit generated.py)
  main.py        composition root
```

## Commands

```bash
uv sync                 # install (torch CPU wheels)
make check              # ruff + import-linter + pytest
make contracts          # regenerate pydantic models after changing packages/contracts
make run                # run locally (needs env vars, see below)
```

Run locally against the compose infra:

```bash
uv run --env-file ../../.env python -m unmix_worker.main
uv run --env-file ../../.env scripts/enqueue.py /path/to/song.mp3   # upload + enqueue + follow
```

Or in Docker: `docker compose up -d worker` (model weights are baked into the image).

The image is multi-stage: uv resolves the venv in a build stage (no package cache kept), and the runtime stage gets the venv, the model weights and a static `ffmpeg` binary. ffprobe is not needed: the normalized WAV's duration is read with `soundfile`. About 1.6 GB, most of it PyTorch.

## Job lifecycle

| Stage | Progress |
|-------|----------|
| downloading | 0–5 |
| normalizing (ffmpeg → WAV 44.1 kHz) | 5–10 |
| separating (Demucs) | 10–90 |
| uploading (FLAC + MP3 preview + peaks JSON per stem, all stems in parallel) | 90–100 |

- Success: return value `SeparationCompletedV1` (stems with key, size, `silent` flag).
- Business failure (`INVALID_MESSAGE`, `INPUT_NOT_FOUND`, `INVALID_MEDIA`, `DURATION_EXCEEDED`): `UnrecoverableError`, no retries. `failedReason` holds a JSON `SeparationFailureV1`.
- Unexpected failure: regular error, retried by BullMQ according to the producer's `attempts`/`backoff`.
- Worker crash: the job lock expires (60 s) and BullMQ re-queues the stalled job. `maxStalledCount: 2`, so a job survives two crashes before it fails.

## Environment

`REDIS_URL`, `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `DEMUCS_MODEL` (default `htdemucs_6s`), `MAX_DURATION_SECONDS` (600), `TORCH_THREADS` (0 = torch default), `LOG_LEVEL`.
