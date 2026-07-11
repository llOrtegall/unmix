# 07 — Code structure and dependency rules

One rule for all three services: **dependencies point toward the domain.**

```
interface / presentation  ─┐
                           ├──▶  application  ──▶  domain
infrastructure  ───────────┘
```

| Layer | Contains | May import |
|-------|----------|------------|
| `domain` | Entities, value objects, events, business errors | Nothing external (only `shared/kernel`) |
| `application` | Use cases, ports (interfaces), internal DTOs | `domain` |
| `infrastructure` | Adapters that implement ports | `application`, `domain`, libraries |
| `interface` / `presentation` | HTTP, SSE, queue consumers, UI | `application`, `contracts` |

Each process's composition root is the only place that knows every layer ([ADR 0015](adr/0015-manual-composition-root.md)).

## API (`apps/api`) — modular monolith

```
src/
  main.ts                      composition root + Fastify startup + background jobs
  app.ts                       Fastify app (routes, auth guard, errors, /health)
  shared/
    kernel/                    Result, DomainEvent, AggregateRoot, Clock, IdGenerator
    infrastructure/            config, db (Drizzle), outbox relay
    interface/                 zod parsing, error → HTTP mapping
  modules/
    separation/
      domain/                  SeparationJob, events, errors
      application/
        use-cases/             RequestSeparation, JobLifecycle, GetJob, ReconcileJobs
        ports/                 JobRepository, TrackCatalog, QueueInspector, JobUpdates
      infrastructure/          DrizzleJobRepository, BullMQ adapters, LibraryTrackCatalog
      interface/               routes, SSE
      index.ts                 the module's public API
    library/
      domain/                  Track, Stem, MediaType
      application/             RegisterUpload, GetTrack, ListTracks, DeleteTrack, DownloadStems,
                               AddDemoTrack, CollectGarbage
      infrastructure/          DrizzleTrackRepository, S3Storage, S3DemoLibrary
      interface/               routes
      index.ts
    identity/                  Better Auth (no DDD layers)
scripts/                       demo seed, test users
```

## Worker (`services/worker`) — hexagonal

```
src/unmix_worker/
  main.py                      composition root
  domain/                      SeparationTask, Stem, errors
  application/
    separate_track.py          use case
    ports.py                   StemSeparator, MediaNormalizer, ObjectStorage, ProgressReporter
  adapters/
    demucs_separator.py
    ffmpeg_normalizer.py
    s3_storage.py
    bullmq_consumer.py         interface: turns a message into a use case call
    bullmq_progress.py
  contracts/                   generated pydantic models (do not edit)
tests/
  unit/                        domain + use case with fakes
  integration/                 real adapters (testcontainers)
```

## Web (`apps/web`) — Clean Architecture

```
src/
  main.tsx                     React startup
  container.ts                 composition root
  domain/
    track.ts, stem.ts, user.ts models
    mix.ts                     mixer rules (solo, mute, effective gain)
  application/
    use-cases/                 UploadTrack, LoadTrack, WatchJob, RetrySeparation
    ports/                     SessionGateway, TrackGateway, UploadGateway, JobEventsGateway, AudioEngine
  infrastructure/
    auth/                      BetterAuthSessionGateway
    http/                      HttpTrackGateway, FetchPeaksGateway
    sse/                       EventSourceJobEvents
    upload/                    XhrUploadGateway
    audio/                     HtmlAudioEngine
  presentation/
    session.tsx, services.tsx  context providers
    stores/                    Zustand (mixer)
    pages/, components/, i18n/
test/
  unit/                        vitest
  e2e/                         Playwright against the Docker stack
```

## Contracts (`packages/contracts`)

```
src/http/                      requests/responses
src/messages/                  separation.requested.v1, separation.progressed.v1, ...
generated/json-schema/
```

## Automatic checks ([ADR 0018](adr/0018-dependency-rules-in-ci.md))

- `dependency-cruiser` (api, web): forbids `domain → *`, `application → infrastructure|interface|presentation`, `modules/a/* → modules/b/<internal>`.
- `import-linter` (worker): a `layers` contract with `adapters > application > domain`.
- CI fails on any violation.

## Test strategy

| Level | What | Tool |
|-------|------|------|
| Unit | Domain and use cases with in-memory fakes | vitest, pytest |
| Integration | Adapters against real Postgres/Redis/S3 | testcontainers (pending) |
| Contract | Generated schemas up to date, valid messages | CI script |
| API e2e | Full HTTP flow on the Docker stack, two users | `apps/api/test/e2e.ts` |
| Browser e2e | User flows on desktop and mobile | Playwright |
