# 0012 — Backend: modular monolith by bounded context

- **Status:** Accepted
- **Date:** 2026-10-27

## Context

There are several bounded contexts (Separation, Library, Identity). Microservices add deployment, networking and distributed consistency that a PoC does not need.

## Decision

The API is a single process with one module per bounded context in `apps/api/src/modules/`. Each module has its four layers. Modules talk only through domain events or the module's public API (`index.ts`), never by importing another module's internals.

## Consequences

- One deployment, local transactions.
- Extracting a module into its own service is cheap: its boundaries already exist.
- Requires discipline, enforced by rules in CI ([ADR 0018](0018-dependency-rules-in-ci.md)).
