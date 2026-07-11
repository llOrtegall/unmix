# 0010 — Live progress: SSE

- **Status:** Accepted
- **Date:** 2026-10-27

## Context

The user must see the progress of a process that takes several minutes. Communication is one-way (server to client).

## Decision

Server-Sent Events from the API. The API listens to BullMQ `QueueEvents` and forwards `progress`, `completed` and `failed`.

## Consequences

- Simpler than WebSocket; the browser reconnects automatically.
- When the client reconnects, it first calls `GET /jobs/:id` to recover the current state.
