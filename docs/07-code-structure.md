# 07 — Code structure and dependency rules

One rule for all three services: **dependencies point toward the domain.**

```
interface / presentation  ─┐
                           ├──▶  application  ──▶  domain
infrastructure  ───────────┘
```

| Layer | Contains | May import |
|-------|----------|------------|
| `domain` | Entities, value objects, events, business errors | Nothing external |
| `application` | Use cases, ports (interfaces), internal DTOs | `domain` |
| `infrastructure` | Adapters that implement ports | `application`, `domain`, libraries |
| `interface` / `presentation` | HTTP, SSE, queue consumers, UI | `application`, `contracts` |

Each process's composition root is the only place that knows every layer ([ADR 0015](adr/0015-manual-composition-root.md)).

## API (`apps/api`) — modular monolith

Follows the clean-architecture skills ([ADR 0028](adr/0028-clean-architecture-skills.md), [0029](adr/0029-separation-jobs-and-outbox-modules.md), [0030](adr/0030-identity-health-and-bootstrap.md)). Every module has `domain/`, `application/` and `infrastructure/`; entrypoints live outside `modules/`, and `server.ts` is the only file outside the modules that builds infrastructure.

```
src/
  config.ts                    zod-validated environment, the only reader of process.env
  server.ts                    bootstrap: shared resources (pool, transactions, event repository, queue),
                               module factories, app, consumers and jobs
  app.ts                       Fastify app: CORS, error handler, route plugins
  middlewares/                 errorHandler (one place maps DomainError categories to HTTP), requireUser (401 guard)
  routes/                      Fastify plugins that receive a module and call one use case per route:
                               health, identity (/api/auth/* to Better Auth), library, separation (SSE included)
  consumers/                   separationQueueConsumer (BullMQ queue events → separation use cases),
                               libraryEventConsumer (UserRegistered and separation events → library use cases)
  jobs/                        outboxRelayJob (every 500 ms), collectGarbageJob (hourly), reconcileJobsJob (on startup)
  modules/
    shared/
      domain/                  DomainError + ValidationError / NotFoundError / ConflictError / ForbiddenError,
                               UserId, JobId, ObjectKey, CreatedAt, DomainEvent, DomainEventList, EventId,
                               OccurredAt, EventRepository, TransactionRepository
      infrastructure/          Drizzle database, DrizzleTransactionRepository (AsyncLocalStorage),
                               OutboxEventRepository (outbox rows + in-process subscribers), outboxSchema.ts,
                               s3Client.ts
      test/                    Mothers, TestDatabase (Testcontainers Postgres with the real migrations)
    library/
      domain/                  Track entity, value objects (TrackTitle, MediaType, FileSize, Stem, ...),
                               lists (StemList, TrackList, ...), repository interfaces, errors/
      application/             one curried use case per file (registerUpload, findTrack, deleteTrack, ...),
                               factory.ts (libraryModule) — the only file that imports infrastructure
      infrastructure/          DrizzleTrackRepository, S3StorageRepository, S3DemoSongRepository,
                               ArchiverStemArchiveRepository, trackSchema.ts
    separation/
      domain/                  SeparationJob (immutable, records SeparationRequested / Completed / Failed),
                               JobStatus, Stage, Progress, JobFailure, ModelName, SeparationResult,
                               QueueJobState (applyTo decides the transition), SeparationJobList,
                               JobRepository, QueueRepository, JobUpdatesRepository, TrackCatalogRepository, errors/
      application/             requestSeparation, findJob, watchJob, recordJobProgress, syncJob, reconcileJobs
                               (inner: createJob, applyQueueState), factory.ts (separationModule)
      infrastructure/          DrizzleJobRepository (row lock for transitions), BullMqQueueRepository,
                               InMemoryJobUpdatesRepository (SSE fan-out), LibraryTrackCatalogRepository, jobSchema.ts
    outbox/
      domain/                  OutboxEvent (markAsPublished, recordFailure), OutboxEventList, value objects,
                               OutboxRepository, EventRouteRepository
      application/             relayPendingEvents (inner: deliverPendingEvents, deliverEvent), factory.ts
      infrastructure/          DrizzleOutboxRepository (FOR UPDATE SKIP LOCKED), BullMqEventRouteRepository
    identity/
      domain/                  SessionCookies, UserRegistered, SessionRepository
      application/             findSessionUser, handleAuthRequest, factory.ts (identityModule)
      infrastructure/          createBetterAuth (its user.create.after hook publishes UserRegistered),
                               BetterAuthSessionRepository, identitySchema.ts
      index.ts                 exports only the users table, for foreign keys
    health/
      domain/                  ServiceStatus, HealthReport, HealthRepository
      application/             checkHealth, factory.ts (healthModule)
      infrastructure/          DrizzleHealthRepository, BullMqHealthRepository, S3HealthRepository
    <module>/test/             domain/, application/, infrastructure/ (Testcontainers), helpers/ (Mothers)
scripts/                       demo seed, test users
```

Rules of the target layout:

- A value object, entity or list has a private constructor, `create` with `ensure*` guards, `fromPrimitive` / `toPrimitive` and `equals`, and never mutates: modifiers return a new instance.
- A use case takes its dependencies first and its input second (`registerUpload({ trackRepository, ... })(input)`), and throws typed domain errors.
- Every class that talks to the outside world is a `*Repository`; its interface lives in `domain/`.
- Entities record domain events; the use case saves the entity and then publishes `entity.getEvents()` through `EventRepository`, inside the same transaction ([ADR 0029](adr/0029-separation-jobs-and-outbox-modules.md)).
- Entrypoints (`routes/`, `middlewares/`, `consumers/`, `jobs/`) parse input, call one use case and serialize with `toPrimitive()`.
- Domain and application code import no packages and no `node:` modules; byte streams are `ReadableStream<Uint8Array>`.

## Worker (`services/worker`) — clean architecture ([ADR 0031](adr/0031-worker-separation-module.md))

```
src/unmix_worker/
  modules/
    shared/domain/             DomainError + ValidationError, NotFoundError, ConflictError, ForbiddenError
    separation/
      domain/                  SeparationTask (entity), JobId, TrackId, ObjectKey, ModelName, StemName, Stage,
                               Progress, RelativeLoudness, WaveformPeaks, FileSize, AudioDuration,
                               NormalizedAudio, ContentType, SeparatedStem(+List), Stem, StemList,
                               SeparationOutcome, errors.py; Protocols: StorageRepository, MediaRepository,
                               PreviewRepository, SeparatorRepository, TranscriberRepository, ProgressRepository
      application/             separate_track.py, publish_stem.py (closures), factory.py (SeparationModule, per job)
      infrastructure/          s3_storage_repository, ffmpeg_media_repository, ffmpeg_preview_repository,
                               demucs_separator_repository, basic_pitch_transcriber_repository,
                               bullmq_progress_repository, s3_client
  consumers/
    separation_consumer.py     pydantic message → separate_track → completed contract; maps errors to the queue
  contracts/                   generated pydantic models (do not edit)
  config.py                    pydantic-settings, the only reader of the environment
  main.py                      bootstrap: preloads Demucs and Basic Pitch, builds the S3 client, starts the Worker
tests/
  modules/separation/{domain,application,infrastructure,helpers}   Object Mothers, RepositoryMothers (Mock(spec=Protocol))
  consumers/                   the consumer with a fake module
```

The use cases are synchronous: separation is CPU-bound and runs in `asyncio.to_thread`. A `ValidationError` or `NotFoundError` becomes a BullMQ `UnrecoverableError` with the error's `separation.*` code; anything else is retried as `separation.failed`.

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

- `dependency-cruiser` (api): `domain` imports only domain code (no packages, no `node:` modules); `application` imports only its own folder and domain code, except `factory.ts`; modules never import entrypoints, `app.ts`, `server.ts` or `config.ts`; entrypoints and `app.ts` never import infrastructure; a module reaches another only through its `domain/`, its `application/factory.ts` or `identity/index.ts`; production code never imports tests, and tests may reuse another module's Mothers.
- `dependency-cruiser` (web): forbids `domain → *`, `application → infrastructure|presentation`, `presentation → infrastructure`.
- `import-linter` (worker): `infrastructure > application > domain` inside each module (only `application.factory` may import infrastructure); domain and application import no packages and not the generated contracts (except the factory); `consumers` never import infrastructure; modules never import `consumers`, `config` or `main`. `mypy --strict` runs in the same check.
- CI fails on any violation.

## Test strategy

| Level | What | Tool |
|-------|------|------|
| Unit | Domain (guards, behaviour, round-trips) and use cases with Object Mothers and RepositoryMothers (in-memory fakes where not migrated yet) | vitest, pytest |
| HTTP | Routes and middlewares through Fastify `inject` | vitest |
| Integration | API repositories against real Postgres and Redis (Drizzle, outbox, BullMQ); worker storage against SeaweedFS and media against a real ffmpeg | Testcontainers |
| Contract | Generated schemas up to date, valid messages | CI script |
| API e2e | Full HTTP flow on the Docker stack, two users | `apps/api/test/e2e.ts` |
| Browser e2e | User flows on desktop and mobile | Playwright |
