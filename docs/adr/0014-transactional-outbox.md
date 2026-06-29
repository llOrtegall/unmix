# 0014 — Transactional outbox

- **Estado:** Aceptada
- **Fecha:** 2026-10-27

## Contexto

Crear un job implica dos escrituras: Postgres (estado) y Redis (cola). Si el proceso cae entre ambas, quedan jobs perdidos o fantasmas.

## Decisión

Los use cases guardan el agregado y sus eventos de dominio en la tabla `outbox`, dentro de la misma transacción. Un relay en la API lee la outbox y publica en BullMQ, marcando cada fila como publicada. Los consumidores son idempotentes (clave = id del evento).

## Consecuencias

- Garantía at-least-once sin dual-write.
- Una tabla y un proceso relay más.
- Los eventos de vuelta del worker (progreso, completado) llegan por BullMQ y se procesan de forma idempotente en la API.
