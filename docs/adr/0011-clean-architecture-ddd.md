# 0011 — Clean Architecture + DDD táctico

- **Estado:** Aceptada
- **Fecha:** 2026-10-27

## Contexto

El proyecto durará muchas sesiones y debe ser mantenible: alta cohesión y bajo acoplamiento en web, API y worker. El motor de separación, la cola, el storage y la librería de audio del navegador probablemente cambien.

## Decisión

Aplicar Clean Architecture (estilo hexagonal, ports & adapters) en los tres servicios, con DDD táctico en los contextos con reglas reales (Separation y Library). Capas: `domain` → `application` → `infrastructure` / `interface`. Las dependencias solo apuntan hacia el dominio. Detalle en [06-domain.md](../06-domain.md) y [07-code-structure.md](../07-code-structure.md).

## Consecuencias

- Cada tecnología externa (Fastify, Drizzle, BullMQ, Demucs, ffmpeg, MinIO, wavesurfer) queda detrás de un port y es reemplazable.
- Dominio y use cases testeables sin infraestructura.
- Más archivos y más mapeo entre capas. Identity se mantiene como integración directa con Better Auth, sin modelado DDD.
