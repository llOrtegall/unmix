# 0004 — Queue: Redis + BullMQ

- **Status:** Accepted
- **Date:** 2026-10-27

## Context

Separation takes minutes. We need a queue with retries, progress and events, usable from both Node and Python.

## Decision

Redis + BullMQ. The API produces jobs with `bullmq` (npm). The worker consumes them with the official Python `bullmq` package.

## Consequences

- Retries, backoff, progress and events come built in.
- Redis is one more piece of infrastructure (covered by Docker Compose).
- BullMQ's Python support is younger than its Node support. Validate in phase 2; fallback: polling a `jobs` table in Postgres.
