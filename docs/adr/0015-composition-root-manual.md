# 0015 — Inyección de dependencias manual

- **Estado:** Aceptada
- **Fecha:** 2026-10-27

## Contexto

Los contenedores DI añaden decoradores, metadata y magia que pueden filtrarse al dominio.

## Decisión

Wiring explícito en un composition root por proceso: `apps/api/src/main.ts`, `apps/web/src/main.tsx` (vía un `container.ts`) y `services/worker/src/unmix_worker/main.py`. Las clases reciben sus dependencias por constructor.

## Consecuencias

- Dominio y application sin dependencia de ningún framework de DI.
- El grafo de dependencias se lee en un solo archivo.
- El wiring crece a mano; dividir por módulo (`modules/x/wiring.ts`) cuando haga falta.
