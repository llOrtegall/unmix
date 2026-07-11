# 0024 — Frontend: dark studio theme, shadcn/ui, Tailwind v4 and in-house i18n

- **Status:** Accepted
- **Date:** 2026-10-27

## Context

The interface must be pleasant for a non-technical client, accessible, and available in Spanish and English, while keeping the bundle light.

## Decision

- Dark, studio-style theme. One accent color per stem (`--stem-*` in OKLCH), used for the waveform, the slider and solo.
- Tailwind CSS v4 with tokens in `presentation/styles.css`.
- shadcn/ui components copied into the project (`presentation/components/ui`), on top of the `radix-ui` package.
- Minimal in-house i18n: typed `es` and `en` dictionaries (`MessageKey`), a `useT` hook and the locale persisted with Zustand. The initial language follows the browser.
- `wouter` router (two routes: `/` and `/tracks/:id`).
- In Docker, nginx serves the build and proxies `/api` (unbuffered for SSE), so the browser needs no CORS for the API.

## Consequences

- No heavy i18n or router dependencies. Adding a language means one more dictionary; TypeScript forces every key to be translated.
- The UI components are our own code: they can be changed without depending on an external library.
- `pnpm dev` and the `web` container use the same port (5173) and origin; run one or the other.
