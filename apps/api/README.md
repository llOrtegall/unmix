# api

Node.js 24 + TypeScript 7 API: Fastify, Drizzle (Postgres), BullMQ (Redis), S3 presigned URLs. Modular monolith that follows the clean-architecture skills ([ADR 0028](../../docs/adr/0028-clean-architecture-skills.md), [docs/07](../../docs/07-code-structure.md)); layer and module rules are enforced by dependency-cruiser.

Node runs the `.ts` sources directly (type stripping), so there is no build step. `tsc` only typechecks ([ADR 0022](../../docs/adr/0022-typescript-without-build.md)).

The migration is in progress ([roadmap](../../docs/02-roadmap.md#refactor-to-the-clean-architecture-skills)): `shared` and `library` follow the new layout, while `separation` and `identity` still use the previous one.

```
src/
  config.ts               zod-validated environment (the only reader of process.env)
  app.ts                  Fastify app (routes, CORS, error handler, /health)
  main.ts                 wiring, migrations, background processes
  middlewares/            errorHandler (DomainError category -> HTTP, { code, message }), requireUser
  routes/                 Fastify plugins that receive a module and call one use case per route
  modules/shared/         DomainError categories, UserId, JobId, ObjectKey, TransactionRepository;
                          Drizzle database, AsyncLocalStorage transactions, outbox
  modules/library/        domain/ (Track and its value objects, repositories), application/ (use cases,
                          factory.ts), infrastructure/ (Drizzle, S3, demo manifest, ZIP), test/
  modules/separation/     SeparationJob aggregate: request, lifecycle, SSE, queue adapters, reconciliation
  modules/identity/       Better Auth (Google), /api/auth routes
  shared/kernel/          Result, DomainEvent/AggregateRoot and ports, still used by separation
```

Tests sit next to the code: `modules/<module>/test/{domain,application,helpers}` with Object Mothers and RepositoryMothers, and `routes/*.test.ts` / `middlewares/*.test.ts` with Fastify `inject`. `pnpm test:coverage` reports coverage.

## Commands

```bash
pnpm dev                 # run with --watch against ../../.env
pnpm check               # typecheck + dependency rules + unit tests
pnpm db:generate         # new migration after editing a schema.ts (applied on startup)
pnpm e2e -- /path/to/song.mp3   # full flow against a running stack, as two test users
pnpm demo:seed           # separate the demo song once and give it to every user
```

Dev scripts (`scripts/`): `seed-demo.ts`, and `test-user.ts` (`sign-in <email> [--demo]` / `delete <domain>`), which the browser suite uses to sign in without Google.

Docker: `docker compose up -d api` (port 3000).

## Auth

Better Auth with Google, mounted at `/api/auth` and reached by the browser through the web origin's proxy ([ADR 0025](../../docs/adr/0025-sessions-and-ownership.md)). Needs `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`. Every `/api/v1` route requires a session. A track that belongs to someone else answers 404, and so do its jobs.

## Demo song and cleanup

New users get a ready-to-play copy of the demo song: a `Track` row that points at the shared files under `demo/` ([ADR 0026](../../docs/adr/0026-demo-song-and-cleanup.md)). Every hour, the `collectGarbage` use case removes uploads abandoned for more than 24 h and storage folders with no track row.

## How a separation flows

1. `POST /api/v1/uploads` creates a `Track` (`awaiting_upload`) owned by the signed-in user and returns a presigned PUT URL.
2. The browser uploads straight to S3.
3. `POST /api/v1/tracks/:id/jobs` checks the upload exists, creates a `SeparationJob` and, in one transaction, writes `separation.requested` to the outbox. The library module's in-process handler moves the track to `separating`.
4. The outbox relay publishes `separation.requested.v1` to BullMQ (job id = separation job id, so re-publishing is harmless).
5. The worker's progress/completed/failed events arrive through `QueueEvents`. `JobLifecycle` applies them idempotently, and `separation.completed` attaches the stems to the track.
6. `GET /api/v1/jobs/:id/events` streams `snapshot`, `progress`, `completed` and `failed` over SSE.
7. On startup, `ReconcileJobs` checks unfinished jobs against the queue to catch up on events missed while the API was down.
