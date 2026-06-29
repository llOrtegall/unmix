# 0012 — Backend: monolito modular por bounded context

- **Estado:** Aceptada
- **Fecha:** 2026-10-27

## Contexto

Hay varios bounded contexts (Separation, Library, Identity). Los microservicios añaden despliegue, red y consistencia distribuida que una PoC no necesita.

## Decisión

La API es un único proceso con un módulo por bounded context en `apps/api/src/modules/`. Cada módulo tiene sus cuatro capas. Los módulos se comunican solo por eventos de dominio o por la API pública del módulo (`index.ts`), nunca importando internos de otro módulo.

## Consecuencias

- Un solo despliegue, transacciones locales.
- Extraer un módulo a un servicio propio es barato: sus fronteras ya existen.
- Requiere disciplina, reforzada por reglas en CI ([ADR 0018](0018-reglas-dependencia-ci.md)).
