# 0009 — Auth: Better Auth + Google (phase 5)

- **Status:** Accepted. Implementation details in [0025](0025-sessions-and-ownership.md)
- **Date:** 2026-10-27

## Context

The history must be private per user. We want a free solution with simple Google sign-in. The team knows Auth.js, but it is tightly tied to Next.js, and its maintenance moved to the Better Auth team.

## Decision

Defer authentication to phase 5. Use Better Auth (open source, free) with the Google provider, integrated in Fastify and the React client. Acceptable alternative: `@auth/express` if Auth.js is preferred.

## Consequences

- Phases 1–4 work without sign-in; `tracks.user_id` is nullable until then.
- Better Auth creates its own tables in Postgres.
- Requires OAuth credentials from the Google Cloud Console.
