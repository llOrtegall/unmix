# 0004 — Cola: Redis + BullMQ

- **Estado:** Aceptada
- **Fecha:** 2026-10-27

## Contexto

La separación tarda minutos. Necesitamos una cola con reintentos, progreso y eventos, usable desde Node y Python.

## Decisión

Redis + BullMQ. La API produce jobs con `bullmq` (npm). El worker los consume con el paquete oficial `bullmq` de Python.

## Consecuencias

- Reintentos, backoff, progreso y eventos incluidos.
- Redis es una pieza más de infraestructura (cubierta por Docker Compose).
- El soporte de Python en BullMQ es más reciente que el de Node. Validar en fase 2; alternativa: polling sobre tabla `jobs` en Postgres.
