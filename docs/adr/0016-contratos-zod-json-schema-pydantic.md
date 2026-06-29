# 0016 — Contratos: zod → JSON Schema → pydantic

- **Estado:** Aceptada
- **Fecha:** 2026-10-27

## Contexto

Web, API y worker intercambian mensajes en dos lenguajes. Mantener schemas a mano en TS y Python lleva a desincronización.

## Decisión

`packages/contracts` contiene los schemas zod (HTTP y mensajes de cola). Un script genera JSON Schema y, con `datamodel-code-generator`, modelos pydantic para el worker. CI falla si los archivos generados no están al día. Los mensajes tienen versión en el nombre (`separation.requested.v1`).

## Consecuencias

- Un único lugar para cambiar un contrato.
- Los contratos actúan como capa anticorrupción: ningún servicio expone sus modelos internos.
- Paso de generación en el build.
