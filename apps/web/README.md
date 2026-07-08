# web

React 19 + Vite + TypeScript 7 SPA. Clean Architecture ([ADR 0017](../../docs/adr/0017-frontend-clean-zustand.md)), Tailwind v4 + shadcn/ui, Zustand, Spanish/English ([ADR 0024](../../docs/adr/0024-frontend-ui-e-i18n.md)).

```
src/
  domain/          Track, Job, Stem, User, mix rules (mute/solo/gain), upload policy
  application/     ports (SessionGateway, TrackGateway, UploadGateway, JobEventsGateway, PeaksGateway, AudioEngine) + use cases
  infrastructure/  Better Auth client, fetch + zod (contracts), XHR upload with progress, EventSource, <audio> engine
  presentation/    React: pages, components, shadcn ui, Zustand stores, i18n
  container.ts     composition root
  main.tsx         entry: provides the container through ServicesProvider
```

Rules enforced by dependency-cruiser: the domain is pure, application only sees the domain, and presentation never imports infrastructure (it receives services through context).

## Commands

```bash
pnpm dev        # http://localhost:5173, proxies /api to localhost:3000
pnpm check      # typecheck + dependency rules + unit tests
pnpm build      # static build in dist/
```

Docker: `docker compose up -d web` serves the build with nginx on port 5173 and proxies `/api` to the API. Stop `pnpm dev` first: both use 5173.

## Sign-in

`SessionProvider` loads the session once and shows the Google sign-in page when there is none. A 401 from the API signs the UI out. Sessions live in a same-origin cookie set by Better Auth under `/api/auth` ([ADR 0025](../../docs/adr/0025-sesiones-y-propiedad.md)).

## Playback

Every stem streams its MP3 preview in its own `<audio>` element, kept in sync by `HtmlAudioEngine`. Waveforms come from the worker's peaks JSON ([ADR 0023](../../docs/adr/0023-previsualizacion-y-picos.md)). Space toggles play/pause; Shift + click on Solo isolates one stem.
