# 0014 — Transactional outbox

- **Status:** Accepted, amended by [0029](0029-separation-jobs-and-outbox-modules.md)
- **Date:** 2026-10-27

## Context

Creating a job means two writes: Postgres (state) and Redis (queue). If the process dies between them, jobs get lost or become ghosts.

## Decision

Use cases store the aggregate and its domain events in the `outbox` table, in the same transaction. A relay inside the API reads the outbox and publishes to BullMQ, marking each row as published. Consumers are idempotent (key = event id).

## Consequences

- At-least-once delivery without dual writes.
- One more table and one more relay process.
- Events coming back from the worker (progress, completion) arrive through BullMQ and are processed idempotently by the API.
