# 07 — Code structure and dependency rules

One rule for all three services: **dependencies point toward the domain.** All three follow the clean-architecture skills ([ADR 0028](adr/0028-clean-architecture-skills.md)), so the API, the worker and the web share one shape.

```
entrypoints (routes, consumers, jobs, hooks, components)  ──▶  module factory
                                                                    │
modules/<context>/   infrastructure  ──▶  application  ──▶  domain
```

| Layer | Contains | May import |
|-------|----------|------------|
| `domain` | Value Objects, Entities, `XList` collections, domain events, repository interfaces, typed errors | Domain code only (its own module, another module's domain, `shared`); no packages |
| `application` | One use case per file (dependencies first, input second) and `factory.ts` | Its own folder and domain code; only `factory.ts` imports infrastructure |
| `infrastructure` | `*Repository` implementations (Postgres, S3, BullMQ, HTTP, ffmpeg, Demucs, `<audio>`) | Domain, packages, generated contracts |
| entrypoints (outside `modules/`) | Routes, middlewares, queue consumers, jobs, hooks, components, pages | Module factories and domain objects; never infrastructure |

- Every Value Object, Entity and list has a private constructor (a frozen dataclass in Python), `create` with `ensure*` guards, `fromPrimitive` / `toPrimitive` and `equals`; modifiers return new instances.
- Every boundary to the outside world is a `*Repository`; its interface lives in `domain/`.
- Errors are typed `DomainError`s with a stable code (`track.not_found`), mapped in one place per service: the API's error handler, the worker's queue consumer, the web's `useErrorMessage`.
- Only the bootstrap (`server.ts`, `main.py`) and each module's `factory.ts` build infrastructure. There is no global composition root ([ADR 0015](adr/0015-manual-composition-root.md) is superseded).

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

## Web (`apps/web`) — clean architecture ([ADR 0032](adr/0032-web-modules-hooks-and-components.md))

```
src/
  modules/
    shared/domain/             DomainError + ValidationError, NotFoundError, ConflictError; RequestFailedError
                               (API code, request.failed, request.network), SessionExpiredError, Unsubscribe
    shared/infrastructure/     http.ts (httpGet / httpSend; 401 → SessionExpiredError + expiry listeners)
    track/                     TrackSummary, Track, TrackList, TrackPage, Stem, StemList (mixer order), Waveforms,
                               UploadCandidate, MediaType, UploadTicket, UploadProgress, ...; listTracks, findTrack,
                               deleteTrack, uploadTrack; HttpTrackRepository, XhrUploadRepository, HttpPeaksRepository
    separation/                Job, JobFailure (canBeRetried), JobStatus, Stage, Progress; watchJob, requestSeparation;
                               HttpJobRepository, EventSourceJobEventsRepository
    session/                   User, UserName, Email, AvatarUrl; findCurrentUser, signInWithGoogle, signOut,
                               watchSessionExpiry; BetterAuthSessionRepository, HttpSessionExpiryRepository
    mixer/                     Mix (solo wins over mute, gains), ChannelList, Channel, Volume, Playhead; loadMix,
                               togglePlayback, seekTo, findPlayhead, set/toggle channel use cases; HtmlAudioPlaybackRepository
    <m>/test/{domain,application,infrastructure,helpers}
  hooks/                       useSession (zustand), useTracks, useTrack, useUpload, useJob, useMixer (zustand), usePlayhead
  components/                  containers (TrackLibrary, Uploader, JobProgress, Mixer, AccountMenu) and presenters;
                               ui/ = vendored shadcn primitives
  pages/                       LibraryPage, SignInPage, TrackPage
  i18n/                        messages.ts, useT.ts (persisted locale), errorMessages.ts (useErrorMessage: code → text)
  lib/utils.ts, config.ts, App.tsx, main.tsx
```

Each `factory.ts` exports a module instance (`tracks`, `separation`, `session`, `mixer`) that hooks import; there is no service context. Containers use hooks and pass domain objects and callbacks to presenters, which only take props (plus `useT` for text). Every user-facing error text comes from `useErrorMessage`. Component and hook tests sit next to their file and mock the module instance.

## Contracts (`packages/contracts`)

```
src/http/                      requests/responses
src/messages/                  separation.requested.v1, separation.progressed.v1, ...
generated/json-schema/
```

## Automatic checks ([ADR 0018](adr/0018-dependency-rules-in-ci.md))

- `dependency-cruiser` (api): `domain` imports only domain code (no packages, no `node:` modules); `application` imports only its own folder and domain code, except `factory.ts`; modules never import entrypoints, `app.ts`, `server.ts` or `config.ts`; entrypoints and `app.ts` never import infrastructure; a module reaches another only through its `domain/`, its `application/factory.ts` or `identity/index.ts`; production code never imports tests, and tests may reuse another module's Mothers.
- `dependency-cruiser` (web): the same module rules as the API (`domain` imports only domain code and no packages; `application` only its own folder and domain code, except `factory.ts`; modules reach each other only through `domain/` or the factory); hooks, components, pages, `i18n`, `App.tsx` and `main.tsx` never import infrastructure; modules never import them; production code never imports tests.
- `import-linter` (worker): `infrastructure > application > domain` inside each module (only `application.factory` may import infrastructure); domain and application import no packages and not the generated contracts (except the factory); `consumers` never import infrastructure; modules never import `consumers`, `config` or `main`. `mypy --strict` runs in the same check.
- CI fails on any violation.

## Test strategy

| Level | What | Tool |
|-------|------|------|
| Unit | Domain (guards, behaviour, round-trips) and use cases with Object Mothers and RepositoryMothers | vitest, pytest |
| Components | Web containers through what the user sees, with the module instance mocked | vitest + Testing Library |
| HTTP | Routes and middlewares through Fastify `inject` | vitest |
| Integration | API repositories against real Postgres and Redis (Drizzle, outbox, BullMQ); worker storage against SeaweedFS and media against a real ffmpeg | Testcontainers |
| Contract | Generated schemas up to date, valid messages | CI script |
| API e2e | Full HTTP flow on the Docker stack, two users | `apps/api/test/e2e.ts` |
| Browser e2e | User flows on desktop and mobile | Playwright |
