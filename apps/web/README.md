# web

React 19 + Vite + TypeScript 7 SPA. Clean architecture with modules, hooks and components ([ADR 0032](../../docs/adr/0032-web-modules-hooks-and-components.md)), Tailwind v4 + shadcn/ui, Zustand, Spanish/English ([ADR 0024](../../docs/adr/0024-frontend-ui-and-i18n.md)).

```
src/
  modules/         track, separation, session, mixer (+ shared): domain, use cases, factory, repositories, tests
  hooks/           connect use cases to React state (useTracks, useTrack, useUpload, useJob, useSession, useMixer, usePlayhead)
  components/      containers (use hooks) and presenters (props only); ui/ = shadcn primitives
  pages/           LibraryPage, SignInPage, TrackPage
  i18n/            messages, useT, useErrorMessage (the only error-code → text map)
  App.tsx          routes and the signed-in / signed-out switch
  main.tsx         entry
```

Rules enforced by dependency-cruiser: the domain imports only domain code, use cases only their folder and the domain (except `factory.ts`), and hooks, components and pages never import infrastructure: they call each module's exported instance (`tracks`, `separation`, `session`, `mixer`).

## Commands

```bash
pnpm dev        # http://localhost:5173, proxies /api to localhost:3000
pnpm check      # typecheck + dependency rules + unit and component tests
pnpm test:coverage   # coverage of modules, hooks and components (threshold 80 %)
pnpm build      # static build in dist/
pnpm e2e        # Playwright against the Docker stack (desktop + mobile); add --grep-invert @slow to skip the real Demucs run
pnpm demo:record   # scripted walkthrough video -> demo-recording/unmix-demo.mp4
```

The e2e suite and the recording need the stack running with the demo seeded (`pnpm --filter @unmix/api demo:seed`). Test users are created and removed through `apps/api/scripts/test-user.ts`.

Docker: `docker compose up -d web` serves the build with nginx on port 5173 and proxies `/api` to the API. Stop `pnpm dev` first: both use 5173.

## Sign-in

`useSessionLifecycle` (in `App`) loads the session once and shows the Google sign-in page when there is none. A 401 from the API signs the UI out through `watchSessionExpiry`. Sessions live in a same-origin cookie set by Better Auth under `/api/auth` ([ADR 0025](../../docs/adr/0025-sessions-and-ownership.md)).

## Playback

Every stem streams its MP3 preview in its own `<audio>` element, kept in sync by `HtmlAudioPlaybackRepository`. Waveforms come from the worker's peaks JSON ([ADR 0023](../../docs/adr/0023-previews-and-peaks.md)). The `Mix` decides each channel's gain (solo wins over mute). Space toggles play/pause; Shift + click on Solo isolates one stem.
