# 02 — Roadmap

Each phase ends with something demonstrable. Do not move on until its acceptance criteria are met.

## Phase 0 — Environment setup

- Install Docker (Docker Desktop with WSL integration, or Docker Engine inside WSL). ✅
- Install ffmpeg, pnpm and uv. ✅
- `docker compose up -d postgres redis s3 s3-init` brings everything up healthy.

**Acceptance:** all three services `healthy`; `unmix` bucket created; upload and download with a presigned URL work.

## Phase 1 — Demucs spike

- CLI script in `services/worker/spike/` that splits a local song into 6 stems.
- Measure total time, peak RAM and perceived quality per stem.
- Document the results in `docs/spike-demucs.md`. ✅ 84 s for 4:57 (factor 0.28), 2.2 GB RAM.

**Acceptance:** a 4-minute song separated in under ~15 minutes on CPU. Otherwise, evaluate the `htdemucs` model (4 stems) or a smaller `segment`.

## Phase 2 — Worker

- `packages/contracts`: `separation.*.v1` messages in zod, with generated pydantic ([ADR 0016](adr/0016-contracts-zod-json-schema-pydantic.md)).
- Hexagonal structure checked by `import-linter` ([07](07-code-structure.md)).
- Consumes the `separation` queue with the Python `bullmq` package.
- Downloads the original from S3 storage, validates its duration, normalizes it with ffmpeg.
- Runs Demucs and reports progress.
- Uploads the stems to `tracks/{trackId}/stems/{stem}.flac` ([ADR 0020](adr/0020-flac-stems-and-silence.md)).
- Retries (3, exponential backoff), timeout and typed errors.
- Dockerfile.

**Acceptance:** after enqueuing a job by hand (script), the stems show up in S3 storage and the job ends `completed`. Killing the worker mid-job and restarting it retries the job.

**Status:** ✅ done (2026-10-27). End-to-end job in Docker: 83 s for 4:57. Invalid file: `INVALID_MEDIA` with no retries. `kill -9` mid-job: BullMQ recovers it about 60 s later and completes it.

## Phase 3 — API

- Fastify + TypeScript + Drizzle (migrations) + zod.
- Modular monolith (`separation`, `library`), Result type, outbox relay and `dependency-cruiser` ([ADRs 0012–0015, 0018](adr/)).
- Endpoints from [03-api-contract.md](03-api-contract.md).
- SSE fed by BullMQ `QueueEvents`.
- Streaming ZIP generation.
- Structured logs (pino). Integration tests (vitest).

**Acceptance:** full flow with `curl`: upload, create a job, watch SSE events, list stems, download the ZIP.

**Status:** ✅ done (2026-10-27). `pnpm e2e` walks the flow on the full Docker stack (84 s, 93 MB ZIP). Reconciliation verified with the API stopped during a job. Integration tests with testcontainers are still pending; today the e2e and unit tests cover it.

## Phase 4 — Frontend

- Clean Architecture + Zustand ([ADR 0017](adr/0017-frontend-clean-zustand.md)); mixer domain with unit tests.
- Drag and drop with upfront validation (type, size).
- Upload bar and live processing bar.
- Mixer: waveform per stem, mute, solo, volume, synchronized play/pause/seek.
- Song library.
- Per-stem and ZIP download.

**Acceptance:** a non-technical user completes the flow without help.

**Status:** ✅ done (2026-10-27). Verified with Playwright: invalid file rejected, upload, live progress, mixer in 102 s, language switch, mobile view, no console errors.

## Phase 5 — Authentication

- Better Auth with Google OAuth.
- Tracks belong to a user; private history.

**Acceptance:** two Google accounts see different libraries.

**Status:** ✅ done (2026-10-27), [ADR 0025](adr/0025-sessions-and-ownership.md). API e2e with two test users: 401 without a session, and the second user gets 404 on list, detail, job, SSE, ZIP and delete. UI verified with Playwright (sign-in, library, sign-out). Acceptance verified with two real Google accounts: each one sees only its own library.

## Phase 6 — Client polish

- Friendly error messages, empty states, skeletons.
- Responsive design.
- Preloaded demo song.
- Playwright e2e tests.
- Automatic cleanup of old files.

**Acceptance:** an end-to-end recorded demo, ready for the client.

**Status:** ✅ done (2026-10-27), [ADR 0026](adr/0026-demo-song-and-cleanup.md). Manually tested by the team.
- Demo song "La" (CC BY 4.0) separated once and given to every user, with visible credit.
- Hourly cleanup of abandoned uploads (>24 h) and orphan files.
- Error states with "Try again", messages for every error code, touch-screen wording in the dropzone, page titles.
- Playwright suite: 16 tests on desktop and mobile (~10 s) plus one `@slow` test with real Demucs (~1.2 min).
- Recorded demo with `demo:record` (50 s, silent).

## Open items

- Test with a real (non-technical) user.
- Integration tests with testcontainers.
- ~~Worker `maxStalledCount`: a second crash fails the job.~~ Now 2 (2026-10-27).
- ~~Worker image is 3.45 GB.~~ 1.62 GB: multi-stage build, no uv cache, static ffmpeg (2026-10-27); 2.31 GB with Basic Pitch.
- ~~MP3 previews add ~16 s per song.~~ Stems are encoded and uploaded in parallel (2026-10-27).
- The browser e2e suite does not run in CI (it needs the full stack).

## Done after phase 6

- MIDI transcription of pitched stems with Basic Pitch, downloadable per stem and in the ZIP ([ADR 0027](adr/0027-midi-transcription.md)).

## Refactor to the clean-architecture skills

Every service moves to the shared clean-architecture rules ([ADR 0028](adr/0028-clean-architecture-skills.md)), one step at a time, with the app working after each one.

- [x] Step 0 — ADR 0028, test tooling (faker, coverage, Testcontainers, Testing Library, pytest-cov).
- [x] Step 1 — API: `DomainError` categories, zod config, one error handler, `{ code, message }` error body.
- [x] Step 2 — API: library module (immutable domain, curried use cases, factory, routes as Fastify plugins, `track.*` codes).
- [x] Step 3 — API: separation module, outbox module, queue consumers and jobs, Testcontainers tests ([ADR 0029](adr/0029-separation-jobs-and-outbox-modules.md)); `Result` and `shared/kernel` removed.
- [x] Step 4 — API: identity and health modules, `server.ts` bootstrap, web streams in the domain, final dependency rules ([ADR 0030](adr/0030-identity-health-and-bootstrap.md)).
- [ ] Step 5 — Worker.
- [ ] Step 6 — Web.
- [ ] Step 7 — Docs and READMEs.

## Future

- GPU worker (local CUDA, or Modal / RunPod / Replicate).
- RoFormer models for higher-quality vocals.
- Piano roll view of the MIDI in the mixer.
- Quotas and plans.
