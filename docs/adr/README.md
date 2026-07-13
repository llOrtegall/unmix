# Architecture decision records (ADR)

Short MADR format. One decision per file. To change a decision, write a new ADR that supersedes it.

| # | Decision |
|---|----------|
| [0001](0001-demucs-6s-model.md) | Separation model: Demucs `htdemucs_6s` |
| [0002](0002-local-cpu-compute.md) | Compute: local CPU, swappable worker |
| [0003](0003-node-backend-python-worker.md) | Backend: Node API + Python worker |
| [0004](0004-redis-bullmq-queue.md) | Queue: Redis + BullMQ |
| [0005](0005-frontend-react-vite.md) | Frontend: React + Vite + TypeScript |
| [0006](0006-storage-postgres-minio.md) | Persistence: Postgres + MinIO (storage superseded by 0019) |
| [0007](0007-infra-docker-compose.md) | Infra: Docker Compose |
| [0008](0008-input-limits.md) | Input: audio and video, 10 minutes max |
| [0009](0009-auth-better-auth-google.md) | Auth: Better Auth + Google (phase 5) |
| [0010](0010-sse-progress.md) | Live progress: SSE |
| [0011](0011-clean-architecture-ddd.md) | Clean Architecture + tactical DDD |
| [0012](0012-modular-monolith.md) | Backend: modular monolith by bounded context |
| [0013](0013-result-type.md) | Business errors with a Result type |
| [0014](0014-transactional-outbox.md) | Transactional outbox |
| [0015](0015-manual-composition-root.md) | Manual dependency injection |
| [0016](0016-contracts-zod-json-schema-pydantic.md) | Contracts: zod → JSON Schema → pydantic |
| [0017](0017-frontend-clean-zustand.md) | Frontend: Clean Architecture + Zustand |
| [0018](0018-dependency-rules-in-ci.md) | Dependency rules in CI |
| [0019](0019-storage-seaweedfs.md) | Local S3 storage: SeaweedFS instead of MinIO |
| [0020](0020-flac-stems-and-silence.md) | FLAC stems and silent-stem detection |
| [0021](0021-in-process-events-and-reconciliation.md) | In-process domain events, outbox and reconciliation |
| [0022](0022-typescript-without-build.md) | TypeScript API without a build step |
| [0023](0023-previews-and-peaks.md) | MP3 previews, waveform peaks and `<audio>` playback |
| [0024](0024-frontend-ui-and-i18n.md) | Frontend: dark studio theme, shadcn/ui, Tailwind v4 and in-house i18n |
| [0025](0025-sessions-and-ownership.md) | Same-origin sessions and track ownership |
| [0026](0026-demo-song-and-cleanup.md) | Per-user demo song, garbage cleanup and browser e2e |
| [0027](0027-midi-transcription.md) | MIDI transcription with Basic Pitch (ONNX) |
