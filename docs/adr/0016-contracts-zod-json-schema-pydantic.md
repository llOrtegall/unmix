# 0016 — Contracts: zod → JSON Schema → pydantic

- **Status:** Accepted, amended by [0031](0031-worker-separation-module.md)
- **Date:** 2026-10-27

## Context

The web, the API and the worker exchange messages in two languages. Keeping schemas by hand in TS and Python leads to drift.

## Decision

`packages/contracts` holds the zod schemas (HTTP and queue messages). A script generates JSON Schema and, with `datamodel-code-generator`, pydantic models for the worker. CI fails if the generated files are stale. Messages carry their version in the name (`separation.requested.v1`).

## Consequences

- A single place to change a contract.
- Contracts act as an anti-corruption layer: no service exposes its internal models.
- A generation step in the build.
