# 0026 — Per-user demo song, garbage cleanup and browser e2e

- **Status:** Accepted
- **Date:** 2026-10-27

## Context

Phase 6 asks for a preloaded demo song, automatic cleanup of old files, Playwright e2e tests and a recorded demo for the client. Libraries are private per user ([ADR 0025](0025-sessions-and-ownership.md)).

## Decision

- **Song:** "La" by Shane Ivers, licensed under CC BY 4.0 (`assets/demo/`). It covers all six stems. The credit the license requires is stored in `tracks.credit`, and the UI shows it next to a "Demo" badge.
- **One copy per user, shared files.** `pnpm --filter @unmix/api demo:seed` separates the song once on the running stack, copies its files to `demo/` and writes `demo/manifest.json`. Every new user gets a completed `Track` row (`Track.fromDemo`) pointing at those files, through Better Auth's `user.create.after` hook. The ~100 MB are not copied per user. Deleting the demo only removes `tracks/<id>/`, never `demo/`. The script also gives it to users who already existed.
- **Cleanup of garbage only.** Every hour, and on startup, `CollectGarbage` deletes uploads left unfinished for more than 24 h and `tracks/<uuid>/` folders in S3 with no row in the database. User songs never expire.
- **Browser e2e.** `@playwright/test` against the Docker stack, on desktop and mobile. Users are created with `apps/api/scripts/test-user.ts` (a session written to Postgres, without Google) and deleted at the end. The real Demucs test is tagged `@slow` and only runs on desktop. It does not run in CI because it needs the full stack.
- **Recorded demo.** `pnpm --filter @unmix/web demo:record` walks through the flow with Playwright and records it. ffmpeg trims the separation wait and leaves a silent MP4 in `apps/web/demo-recording/`.

## Consequences

- A fresh environment needs `demo:seed` once. Without it, users start with an empty library (the hook does not fail).
- The files under `demo/` have no owner, and the cleanup leaves them alone.
- The video has no audio, because Playwright does not record it. A presentation with sound needs a manual screen recording.
