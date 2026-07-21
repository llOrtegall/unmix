# 0030 — Identity and health modules, server bootstrap and final dependency rules

- **Status:** Accepted
- **Date:** 2026-10-29
- **Amends:** [0009](0009-auth-better-auth-google.md), [0018](0018-dependency-rules-in-ci.md)
- **Follows:** [0028](0028-clean-architecture-skills.md), [0029](0029-separation-jobs-and-outbox-modules.md)

## Context

Step 4 closes the API refactor. Three pieces still broke the rules: identity was a bare Better Auth integration called straight from the bootstrap, `/health` ran SQL and Redis calls from `main.ts`, and the library domain imported `Readable` from `node:stream`. The bootstrap also wired a cross-module reaction by hand: a callback that gave every new user the demo song.

## Decision

**Identity module.** `SessionRepository` finds the user behind the session cookies (`SessionCookies`) and handles every `/api/auth/*` request. Better Auth owns that protocol (OAuth redirect, callback, session, sign-out), so `handleAuthRequest` passes the request through. `findSessionUser` backs the `requireUser` middleware, which still answers `401 session.required`: a missing session is an entrypoint guard, not a domain error category. `BetterAuthSessionRepository` wraps an instance built by `createBetterAuth`. `identity/index.ts` only exports the `users` table, which other modules need for foreign keys.

**New users get the demo song through an event.** Better Auth's `user.create.after` hook publishes `UserRegistered` through `EventRepository`, and `libraryEventConsumer` reacts with `addDemoTrack`. As before, a failure is logged and never blocks the sign-in: the hook runs after Better Auth commits, and an error there would fail the request.

**Health module.** `checkHealth` pings the database, the queue and the storage through one `HealthRepository` each and returns a `HealthReport`. `routes/healthRoutes.ts` keeps the response (`200`/`503`, `{ status, checks: { database, redis, storage } }`).

**Server bootstrap.** `server.ts` replaces `main.ts`. It creates the shared resources (pool, transactions, event repository, queue), calls the module factories, builds the app and starts the consumers and jobs.

**No Node built-ins in the domain.** Byte streams in domain interfaces are `ReadableStream<Uint8Array>`, a platform global. The S3 and archiver repositories convert to and from Node streams.

**Final dependency rules.** `domain` imports only domain code, with no packages and no `node:` modules. `application` imports only domain code, except `factory.ts`. Entrypoints (`routes`, `middlewares`, `consumers`, `jobs`, `app.ts`) never import infrastructure. Modules never import entrypoints or the bootstrap, and reach each other only through `domain/`, `application/factory.ts` or `identity/index.ts`. Production code never imports tests; tests may reuse another module's Mothers.

## Consequences

- Every API module follows the skills; only `server.ts` and `scripts/` (dev tooling) touch infrastructure directly.
- Identity no longer knows the library: a new reaction to sign-up is one more subscription.
- The health check is a module of its own for three pings: more files, but no I/O outside infrastructure.
