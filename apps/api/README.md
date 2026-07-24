# api

Node.js 24 + TypeScript 7 API: Fastify, Drizzle (Postgres), BullMQ (Redis), S3 presigned URLs. Modular monolith that follows the clean-architecture skills ([ADR 0028](../../docs/adr/0028-clean-architecture-skills.md), [docs/07](../../docs/07-code-structure.md)); layer and module rules are enforced by dependency-cruiser.

Node runs the `.ts` sources directly (type stripping), so there is no build step. `tsc` only typechecks ([ADR 0022](../../docs/adr/0022-typescript-without-build.md)).

Every module follows that layout ([ADR 0029](../../docs/adr/0029-separation-jobs-and-outbox-modules.md), [ADR 0030](../../docs/adr/0030-identity-health-and-bootstrap.md)). Entrypoints live outside `modules/`, and `server.ts` is the only file outside the modules that builds infrastructure.

```
src/
  config.ts               zod-validated environment (the only reader of process.env)
  server.ts               bootstrap: shared resources, module factories, app, consumers and jobs
  app.ts                  Fastify app (CORS, error handler, route plugins)
  middlewares/            errorHandler (DomainError category -> HTTP, { code, message }), requireUser (401)
  routes/                 Fastify plugins that receive a module and call one use case per route:
                          health, identity (/api/auth/*), library, separation (SSE included)
  consumers/              BullMQ queue events -> separation use cases; UserRegistered and separation
                          events -> library use cases
  jobs/                   outbox relay, garbage collection, startup reconciliation
  modules/shared/         DomainError categories, UserId, JobId, ObjectKey, CreatedAt, DomainEvent(List),
                          EventRepository, TransactionRepository; Drizzle database, AsyncLocalStorage
                          transactions, OutboxEventRepository
  modules/library/        domain/ (Track and its value objects, repositories), application/ (use cases,
                          factory.ts), infrastructure/ (Drizzle, S3, demo manifest, ZIP), test/
  modules/separation/     domain/ (SeparationJob, QueueJobState, events), application/ (use cases, factory.ts),
                          infrastructure/ (Drizzle, BullMQ, in-memory SSE fan-out, library catalog), test/
  modules/outbox/         OutboxEvent and the relay use case; Drizzle and BullMQ repositories
  modules/identity/       session lookup and /api/auth over Better Auth (Google); UserRegistered on sign-up
  modules/health/         database, queue and storage pings for /health
```

Tests sit next to the code: `modules/<module>/test/{domain,application,infrastructure,helpers}` with Object Mothers and RepositoryMothers, and `routes/`, `middlewares/`, `consumers/` and `jobs/` tests beside each file (routes through Fastify `inject`). Repository tests start Postgres and Redis with Testcontainers, so `pnpm check` needs Docker. `pnpm test:coverage` reports coverage.

## Commands

```bash
pnpm dev                 # run with --watch against ../../.env
pnpm check               # typecheck + dependency rules + tests (Docker for Testcontainers)
pnpm db:generate         # new migration after editing a schema.ts (applied on startup)
pnpm e2e -- /path/to/song.mp3   # full flow against a running stack, as two test users
pnpm demo:seed           # separate the demo song once and give it to every user
```

Dev scripts (`scripts/`): `seed-demo.ts`, and `test-user.ts` (`sign-in <email> [--demo]` / `delete <domain>`), which the browser suite uses to sign in without Google.

Docker: `docker compose up -d api` (port 3000).

## Auth

Better Auth with Google, mounted at `/api/auth` and reached by the browser through the web origin's proxy ([ADR 0025](../../docs/adr/0025-sessions-and-ownership.md)). Needs `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`. Every `/api/v1` route requires a session (`requireUser` calls the identity module's `findSessionUser`). A track that belongs to someone else answers 404, and so do its jobs. When Better Auth creates a user, the identity module publishes `UserRegistered` and the library gives that user the demo song; a failure there is logged and never blocks the sign-in.

## Demo song and cleanup

New users get a ready-to-play copy of the demo song: a `Track` row that points at the shared files under `demo/` ([ADR 0026](../../docs/adr/0026-demo-song-and-cleanup.md)). Every hour, the `collectGarbage` use case removes uploads abandoned for more than 24 h and storage folders with no track row.

## How a separation flows

1. `POST /api/v1/uploads` creates a `Track` (`awaiting_upload`) owned by the signed-in user and returns a presigned PUT URL.
2. The browser uploads straight to S3.
3. `POST /api/v1/tracks/:id/jobs` checks the upload exists, creates a `SeparationJob` and, in one transaction, writes `separation.requested` to the outbox. `libraryEventConsumer` runs the library's `startTrackSeparation` in that transaction, which moves the track to `separating`.
4. `outboxRelayJob` runs `relayPendingEvents`, which publishes `separation.requested.v1` to BullMQ (job id = separation job id, so re-publishing is harmless).
5. The worker's events arrive through `QueueEvents` (`separationQueueConsumer`). `progress` runs `recordJobProgress`; `completed` and `failed` run `syncJob`, which reads the job's final state from the queue, since a failed attempt may still be retried. Each transition locks the job row, and `separation.completed` attaches the stems to the track ([ADR 0029](../../docs/adr/0029-separation-jobs-and-outbox-modules.md)).
6. `GET /api/v1/jobs/:id/events` streams `snapshot`, `progress`, `completed` and `failed` over SSE.
7. On startup, `reconcileJobs` runs `syncJob` for every unfinished job to catch up on events missed while the API was down.
