# api

Node.js 24 + TypeScript 7 API: Fastify, Drizzle (Postgres), BullMQ (Redis), S3 presigned URLs. Modular monolith with Clean Architecture ([docs/07](../../docs/07-code-structure.md)); layer and module rules are enforced by dependency-cruiser.

Node runs the `.ts` sources directly (type stripping), so there is no build step. `tsc` only typechecks ([ADR 0022](../../docs/adr/0022-typescript-sin-build.md)).

```
src/
  main.ts                 composition root: wiring, migrations, background processes
  app.ts                  Fastify app (routes, CORS, error handler, /health)
  shared/kernel/          Result, DomainEvent/AggregateRoot, ports (Clock, IdGenerator, TransactionManager, EventPublisher)
  shared/infrastructure/  config, Drizzle + AsyncLocalStorage transactions, outbox publisher/relay
  shared/interface/       zod parsing and error -> HTTP mapping
  modules/library/        Track aggregate: uploads, history, detail, ZIP, delete
  modules/separation/     SeparationJob aggregate: request, lifecycle, SSE, queue adapters, reconciliation
```

## Commands

```bash
pnpm dev                 # run with --watch against ../../.env
pnpm check               # typecheck + dependency rules + unit tests
pnpm db:generate         # new migration after editing a schema.ts (applied on startup)
pnpm e2e -- /path/to/song.mp3   # full flow against a running stack
```

Docker: `docker compose up -d api` (port 3000).

## How a separation flows

1. `POST /api/v1/uploads` creates a `Track` (`awaiting_upload`) and returns a presigned PUT URL.
2. The browser uploads straight to S3.
3. `POST /api/v1/tracks/:id/jobs` checks the upload exists, creates a `SeparationJob` and, in one transaction, writes `separation.requested` to the outbox. The library module's in-process handler moves the track to `separating`.
4. The outbox relay publishes `separation.requested.v1` to BullMQ (job id = separation job id, so re-publishing is harmless).
5. The worker's progress/completed/failed events arrive through `QueueEvents`. `JobLifecycle` applies them idempotently, and `separation.completed` attaches the stems to the track.
6. `GET /api/v1/jobs/:id/events` streams `snapshot`, `progress`, `completed` and `failed` over SSE.
7. On startup, `ReconcileJobs` checks unfinished jobs against the queue to catch up on events missed while the API was down.
