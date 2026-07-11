# 0015 — Manual dependency injection

- **Status:** Accepted
- **Date:** 2026-10-27

## Context

DI containers add decorators, metadata and magic that can leak into the domain.

## Decision

Explicit wiring in one composition root per process: `apps/api/src/main.ts`, `apps/web/src/main.tsx` (through a `container.ts`) and `services/worker/src/unmix_worker/main.py`. Classes receive their dependencies through the constructor.

## Consequences

- Domain and application do not depend on any DI framework.
- The dependency graph can be read in a single file.
- The wiring grows by hand; split it per module (`modules/x/wiring.ts`) when needed.
