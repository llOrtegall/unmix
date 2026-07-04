# 0021 — Eventos de dominio en proceso, outbox y reconciliación

- **Estado:** Aceptada
- **Fecha:** 2026-10-27
- **Complementa:** [0014](0014-transactional-outbox.md)

## Contexto

Los módulos `library` y `separation` deben mantenerse consistentes (estado del track y del job) sin importarse entre sí. Además, la API puede estar caída mientras el worker termina un job, y `QueueEvents` de BullMQ no reenvía los eventos perdidos.

## Decisión

- **Transacciones implícitas:** `TransactionManager` usa `AsyncLocalStorage`; los repositorios toman la transacción activa sin recibirla por parámetro.
- **Publicación de eventos:** `EventPublisher.publish` escribe cada evento en `outbox` y ejecuta los handlers en proceso dentro de la misma transacción. Así, `separation.requested` / `completed` / `failed` actualizan el `Track` de forma atómica con el job.
- **Relay:** un proceso dentro de la API lee la outbox (`FOR UPDATE SKIP LOCKED`) y publica en BullMQ solo los eventos con ruta externa (`separation.requested` → `separation.requested.v1`).
- **Idempotencia:** el id del job en BullMQ es el id del job de separación, y `JobLifecycle` ignora duplicados, eventos tardíos y jobs desconocidos.
- **Reconciliación:** al arrancar, `ReconcileJobs` compara cada job sin terminar con su estado en la cola y aplica el resultado.
- **Fallo final:** ante un evento `failed`, la API confirma con la cola que el job agotó sus reintentos antes de marcarlo como fallido.

## Consecuencias

- Consistencia entre módulos sin dependencias directas; un error en un handler revierte toda la operación.
- Verificado: con la API detenida durante un job, al reiniciar el job y el track quedan `completed`.
- Las notificaciones SSE se emiten después del commit, por instancia. Cada instancia de la API recibe todos los eventos de la cola, así que escala horizontalmente.
