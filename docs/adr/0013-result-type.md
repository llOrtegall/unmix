# 0013 — Errores de negocio con Result type

- **Estado:** Aceptada
- **Fecha:** 2026-10-27

## Contexto

Los errores de negocio (archivo demasiado largo, transición de estado inválida) son esperados y deben ser visibles en las firmas, no escondidos en excepciones.

## Decisión

Dominio y application devuelven `Result<T, E>`: `neverthrow` en TypeScript y un `Result` propio mínimo en Python. Los errores de negocio son tipos discriminados. Las excepciones quedan para fallos inesperados (red caída, bug). La capa `interface` traduce cada error a HTTP o a un evento `failed`.

## Consecuencias

- El compilador obliga a manejar cada error de negocio.
- Algo más verboso que lanzar excepciones.
- Un único mapa error → código HTTP por módulo.
