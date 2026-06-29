# 0010 — Progreso en vivo: SSE

- **Estado:** Aceptada
- **Fecha:** 2026-10-27

## Contexto

El usuario debe ver el avance de un proceso de varios minutos. La comunicación es unidireccional (servidor hacia cliente).

## Decisión

Server-Sent Events desde la API. La API escucha `QueueEvents` de BullMQ y reenvía `progress`, `completed` y `failed`.

## Consecuencias

- Más simple que WebSocket; reconexión automática del navegador.
- Si el cliente se reconecta, primero consulta `GET /jobs/:id` para recuperar el estado actual.
