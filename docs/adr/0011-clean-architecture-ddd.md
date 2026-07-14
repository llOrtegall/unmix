# 0011 — Clean Architecture + tactical DDD

- **Status:** Accepted, amended by [0028](0028-clean-architecture-skills.md)
- **Date:** 2026-10-27

## Context

The project will span many sessions and must stay maintainable: high cohesion and low coupling in the web, the API and the worker. The separation engine, the queue, the storage and the browser audio library are all likely to change.

## Decision

Apply Clean Architecture (hexagonal style, ports & adapters) in all three services, with tactical DDD in the contexts that have real rules (Separation and Library). Layers: `domain` → `application` → `infrastructure` / `interface`. Dependencies only point toward the domain. Details in [06-domain.md](../06-domain.md) and [07-code-structure.md](../07-code-structure.md).

## Consequences

- Every external technology (Fastify, Drizzle, BullMQ, Demucs, ffmpeg, MinIO, wavesurfer) sits behind a port and can be replaced.
- Domain and use cases are testable without infrastructure.
- More files and more mapping between layers. Identity stays a direct Better Auth integration, with no DDD modeling.
