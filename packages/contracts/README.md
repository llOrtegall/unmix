# contracts

Single source of truth for every message that crosses a process boundary: HTTP requests/responses (web ↔ api) and job payloads/results (api ↔ worker).

Pipeline ([ADR 0016](../../docs/adr/0016-contratos-zod-json-schema-pydantic.md)):

```
zod schemas (src/)  →  JSON Schema (generated/)  →  pydantic models (services/worker, generated)
```

Rules:
- Only schemas and inferred types live here. No business logic.
- Domain models never import from this package directly; adapters in the `interface`/`infrastructure` layers map contracts to domain objects.
- A breaking change requires a new version of the message (`separation.requested.v2`), never an in-place edit.
