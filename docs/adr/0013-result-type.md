# 0013 — Business errors with a Result type

- **Status:** Accepted
- **Date:** 2026-10-27

## Context

Business errors (file too long, invalid state transition) are expected and should be visible in signatures, not hidden in exceptions.

## Decision

Domain and application return `Result<T, E>`: `neverthrow` in TypeScript and a minimal in-house `Result` in Python. Business errors are discriminated types. Exceptions are reserved for unexpected failures (network down, bugs). The `interface` layer turns each error into HTTP or a `failed` event.

## Consequences

- The compiler forces every business error to be handled.
- Somewhat more verbose than throwing.
- One error → HTTP status map per module.
