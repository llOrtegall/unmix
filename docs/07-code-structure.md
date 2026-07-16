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

Being migrated to the clean-architecture skills ([ADR 0028](adr/0028-clean-architecture-skills.md)). `shared` and `library` already follow the target layout below; `separation` and `identity` still use `application/use-cases`, `application/ports`, `interface/` and the `Result` type from `shared/kernel` ([roadmap](02-roadmap.md#refactor-to-the-clean-architecture-skills)).

```
src/
  config.ts                    zod-validated environment, the only reader of process.env
  app.ts                       Fastify app: CORS, error handler, routes, /health
  main.ts                      wiring, migrations, background processes (becomes server.ts)
  middlewares/                 errorHandler (one place maps DomainError categories to HTTP), requireUser
  routes/                      Fastify plugins that receive a module and call one use case per route
  modules/
    shared/
      domain/                  DomainError + ValidationError / NotFoundError / ConflictError / ForbiddenError,
                               UserId, JobId, ObjectKey, TransactionRepository
      infrastructure/          Drizzle database, DrizzleTransactionRepository (AsyncLocalStorage), outbox
    library/
      domain/                  Track entity, value objects (TrackTitle, MediaType, FileSize, Stem, ...),
                               lists (StemList, TrackList, ...), repository interfaces, errors/
      application/             one curried use case per file (registerUpload, findTrack, deleteTrack, ...),
                               factory.ts (libraryModule) — the only file that imports infrastructure
      infrastructure/          DrizzleTrackRepository, S3StorageRepository, S3DemoSongRepository,
                               ArchiverStemArchiveRepository, trackSchema.ts
      test/                    domain/, application/, helpers/ (Object Mothers, RepositoryMothers)
    separation/                SeparationJob, events, BullMQ adapters (to be migrated)
    identity/                  Better Auth (to become a small module)
scripts/                       demo seed, test users
```

Rules of the target layout:

- A value object, entity or list has a private constructor, `create` with `ensure*` guards, `fromPrimitive` / `toPrimitive` and `equals`, and never mutates: modifiers return a new instance.
- A use case takes its dependencies first and its input second (`registerUpload({ trackRepository, ... })(input)`), and throws typed domain errors.
- Every class that talks to the outside world is a `*Repository`; its interface lives in `domain/`.
- Entrypoints (`routes/`, `middlewares/`, and later `consumers/` and `jobs/`) parse input, call one use case and serialize with `toPrimitive()`.

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

- `dependency-cruiser` (api): `domain` imports only domain code and Node built-ins; `application` imports no infrastructure except `factory.ts`; modules never import entrypoints; entrypoints never import infrastructure; a module reaches another only through its `domain/`, its `application/factory.ts` or its `index.ts`.
- `dependency-cruiser` (web): forbids `domain → *`, `application → infrastructure|presentation`, `presentation → infrastructure`.
- `import-linter` (worker): a `layers` contract with `adapters > application > domain`.
- CI fails on any violation.

## Test strategy

| Level | What | Tool |
|-------|------|------|
| Unit | Domain (guards, behaviour, round-trips) and use cases with Object Mothers and RepositoryMothers (in-memory fakes where not migrated yet) | vitest, pytest |
| HTTP | Routes and middlewares through Fastify `inject` | vitest |
| Integration | Adapters against real Postgres/Redis/S3 | testcontainers (pending) |
| Contract | Generated schemas up to date, valid messages | CI script |
| API e2e | Full HTTP flow on the Docker stack, two users | `apps/api/test/e2e.ts` |
| Browser e2e | User flows on desktop and mobile | Playwright |
