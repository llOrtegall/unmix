# 0025 — Sessions, track ownership and migrating existing data

- **Status:** Accepted
- **Date:** 2026-10-27
- **Complements:** [0009](0009-auth-better-auth-google.md)

## Context

Phase 5 adds Google sign-in and private libraries. We need to decide where the session lives, how ownership of tracks and jobs is checked, and what happens to tracks created before sign-in existed (`user_id = null`).

## Decision

- **Same origin.** Better Auth is mounted in the API under `/api/auth`, and the browser reaches it through the web's proxy (Vite in dev, nginx in Docker). The session cookie is first-party and no CORS with credentials is needed. `BETTER_AUTH_URL` is the public origin (defaults to `WEB_ORIGIN`). The Google redirect URI is `<origin>/api/auth/callback/google`.
- **Sessions only.** A `preHandler` on `/api/v1/*` answers `401 UNAUTHORIZED` without a valid session and sets `req.userId` for the routes. There is no anonymous use.
- **UUID ids.** Better Auth's tables (`users`, `sessions`, `accounts`, `verifications`) use `uuid` with `gen_random_uuid()` (`advanced.database.generateId: "uuid"`). That makes `tracks.user_id` a foreign key to `users.id` (`on delete cascade`, `not null`).
- **Ownership in the domain.** `Track` has an `ownerId`. Library use cases receive the user and treat someone else's track as missing (`404 TRACK_NOT_FOUND`), so they never reveal which ids exist. A job belongs to its track's owner: separation asks through `TrackCatalog.isOwnedBy` (implemented by `CheckTrackOwnership`, part of library's public API). SSE uses the same check.
- **Existing data.** Tracks without an owner were deleted through the API before migrating (which also removes their files in S3). The `0002_auth` migration deletes any ownerless rows left, and their jobs, before setting `NOT NULL`.
- **Identity without DDD layers.** `modules/identity` exposes an `Identity` interface (`handler`, `currentUserId`) and the `users` table for foreign keys. The rest of the API knows nothing about Better Auth.
- **Web.** A `SessionGateway` port with an adapter over Better Auth's vanilla client. A 401 from the API signs the UI out.
- **E2E.** The API script creates test sessions by writing straight to Postgres and signing the cookie with `BETTER_AUTH_SECRET`, without going through Google. It checks that a second user gets 404 everywhere.

## Consequences

- Starting the API requires `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
- A Google app in *Testing* mode only lets in the test users registered in the console.
- Checking a job's ownership costs one extra query per request. Acceptable at this scale.
