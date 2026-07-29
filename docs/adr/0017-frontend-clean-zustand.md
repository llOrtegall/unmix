# 0017 — Frontend: Clean Architecture + Zustand

- **Status:** Superseded by [0032](0032-web-modules-hooks-and-components.md) (amended earlier by [0028](0028-clean-architecture-skills.md))
- **Date:** 2026-10-27

## Context

The frontend has its own logic (mixer, stem synchronization, upload and progress states) and depends on libraries that may change (wavesurfer, HTTP/SSE transport). Complements [ADR 0005](0005-frontend-react-vite.md).

## Decision

Full Clean Architecture in `apps/web`: `domain` (models, mixer rules), `application` (use cases + ports: `TrackGateway`, `JobEventsGateway`, `AudioEngine`, `UploadGateway`), `infrastructure` (fetch, EventSource, wavesurfer/Web Audio, S3 presigned) and `presentation` (React). Client state with Zustand (a minimal library, ~1 KB). TanStack Query is optional for caching server data and lives only in `presentation`.

## Consequences

- React and Zustand stay at the edge; the domain is plain TypeScript, testable without a DOM.
- Replaces ADR 0005's mention of TanStack Query as a required piece.
- More boilerplate than a feature-based layout.
