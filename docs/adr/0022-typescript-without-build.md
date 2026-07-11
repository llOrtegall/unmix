# 0022 — TypeScript API without a build step

- **Status:** Accepted
- **Date:** 2026-10-27

## Context

Node.js 24 runs `.ts` files by stripping their types (type stripping). TypeScript 7 (the native compiler) is the current version.

## Decision

- The API and `packages/contracts` run directly with `node src/main.ts`. Imports use the `.ts` extension.
- `tsconfig` with `erasableSyntaxOnly`: no `enum`, `namespace` or parameter properties (what Node cannot strip).
- TypeScript 7 only typechecks (`tsc --noEmit`).
- dependency-cruiser does not support the TS 7 compiler API yet; it parses the code with its swc parser.

## Consequences

- No `dist/`, no bundler and no source maps: stack traces point at the real file.
- A simpler API image (479 MB, without dev dependencies).
- Node does not strip types inside `node_modules`; `@unmix/contracts` works because pnpm links it from the workspace. If it is ever published as a package, it will need a build.
