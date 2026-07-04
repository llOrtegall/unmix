# 0022 — API en TypeScript sin paso de build

- **Estado:** Aceptada
- **Fecha:** 2026-10-27

## Contexto

Node.js 24 ejecuta archivos `.ts` eliminando los tipos (type stripping). TypeScript 7 (compilador nativo) es la versión actual.

## Decisión

- La API y `packages/contracts` se ejecutan directamente con `node src/main.ts`. Imports con extensión `.ts`.
- `tsconfig` con `erasableSyntaxOnly`: sin `enum`, `namespace` ni parameter properties (lo que Node no sabe eliminar).
- TypeScript 7 solo hace typecheck (`tsc --noEmit`).
- dependency-cruiser aún no soporta la API del compilador de TS 7; analiza el código con su parser swc.

## Consecuencias

- Sin `dist/`, sin bundler y sin source maps: el stack trace apunta al archivo real.
- Imagen de la API más simple (479 MB, sin dependencias de desarrollo).
- Node no elimina tipos dentro de `node_modules`; `@unmix/contracts` funciona porque pnpm lo enlaza desde el workspace. Si algún día se publica como paquete, necesitará build.
