# 0007 — Infra: Docker Compose

- **Status:** Accepted
- **Date:** 2026-10-27

## Context

The system has six services. We need a reproducible environment for development and for client demos.

## Decision

Docker Compose orchestrates postgres, redis, minio, api, worker and web.

## Consequences

- One command brings everything up.
- Requires installing Docker in WSL (phase 0).
- The worker image is heavy (PyTorch); use layer caching and preload the model at build time. A multi-stage build without the uv cache and with a static ffmpeg keeps it at ~1.6 GB.
