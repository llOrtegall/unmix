# web

React 19 + Vite + TypeScript 7 SPA. Clean Architecture ([ADR 0017](../../docs/adr/0017-frontend-clean-zustand.md)), Tailwind v4 + shadcn/ui, Zustand, Spanish/English ([ADR 0024](../../docs/adr/0024-frontend-ui-e-i18n.md)).

```
src/
  domain/          Track, Job, Stem, mix rules (mute/solo/gain), upload policy
  application/     ports (TrackGateway, UploadGateway, JobEventsGateway, PeaksGateway, AudioEngine) + use cases
  infrastructure/  fetch + zod (contracts), XHR upload with progress, EventSource, <audio> engine
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

## Playback

Every stem streams its MP3 preview in its own `<audio>` element, kept in sync by `HtmlAudioEngine`. Waveforms come from the worker's peaks JSON ([ADR 0023](../../docs/adr/0023-previsualizacion-y-picos.md)). Space toggles play/pause; Shift + click on Solo isolates one stem.
