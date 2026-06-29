# 0018 — Reglas de dependencia en CI

- **Estado:** Aceptada
- **Fecha:** 2026-10-27

## Contexto

Las capas y fronteras de módulo solo funcionan si se respetan siempre; las convenciones se erosionan.

## Decisión

`dependency-cruiser` en `apps/api` y `apps/web`, e `import-linter` en `services/worker`. Reglas mínimas: `domain` no importa nada externo; `application` solo importa `domain`; ningún módulo importa internos de otro módulo. CI falla ante cualquier violación.

## Consecuencias

- La arquitectura se verifica en cada commit, no en revisiones.
- Configuración inicial adicional en las fases 2–4.
