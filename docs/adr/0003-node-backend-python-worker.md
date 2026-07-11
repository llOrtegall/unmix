# 0003 — Backend: Node API + Python worker

- **Status:** Accepted
- **Date:** 2026-10-27

## Context

Demucs is PyTorch, so separation must run in Python. The team prefers TypeScript for the API and the frontend.

## Decision

API in Node.js + TypeScript with Fastify, Drizzle ORM and zod. A separate Python worker, managed with uv.

## Consequences

- Shared types in `packages/contracts`.
- Two languages: the job contract must stay in sync (zod in TS, pydantic in Python).
- The API and the worker scale independently.
