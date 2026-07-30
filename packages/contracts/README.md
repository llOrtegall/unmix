# contracts

Single source of truth for every message that crosses a process boundary: HTTP requests/responses (web ↔ api) and job payloads/results (api ↔ worker).

Pipeline ([ADR 0016](../../docs/adr/0016-contracts-zod-json-schema-pydantic.md)):

```
zod schemas (src/)  →  JSON Schema (generated/)  →  pydantic models (services/worker, generated)
```

Rules:
- Only schemas and inferred types live here. No business logic.
- Domain code never imports this package. Infrastructure repositories and entrypoints (routes, the worker's queue consumer) map contract payloads to Value Objects with `fromPrimitive` / `toPrimitive`; the web types its HTTP repositories with these schemas and lets `fromPrimitive` validate.
- A breaking change requires a new version of the message (`separation.requested.v2`), never an in-place edit.

After changing a schema, run `pnpm contracts:generate` from the repo root: it rebuilds the JSON Schema and the worker's pydantic models, and CI fails if they are stale. Separation failure codes (`SeparationFailureCode`) list every `separation.*` code the worker can emit ([ADR 0031](../../docs/adr/0031-worker-separation-module.md)).
