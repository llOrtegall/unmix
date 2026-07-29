# 0018 — Dependency rules in CI

- **Status:** Accepted, amended by [0028](0028-clean-architecture-skills.md), [0030](0030-identity-health-and-bootstrap.md), [0031](0031-worker-separation-module.md) and [0032](0032-web-modules-hooks-and-components.md)
- **Date:** 2026-10-27

## Context

Layers and module boundaries only work if they are always respected; conventions erode.

## Decision

`dependency-cruiser` in `apps/api` and `apps/web`, and `import-linter` in `services/worker`. Minimum rules: `domain` imports nothing external; `application` imports only `domain`; no module imports another module's internals. CI fails on any violation.

## Consequences

- The architecture is checked on every commit, not in reviews.
- Extra initial setup in phases 2–4.
