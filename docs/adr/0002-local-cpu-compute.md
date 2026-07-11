# 0002 — Compute: local CPU, swappable worker

- **Status:** Accepted
- **Date:** 2026-10-27

## Context

There is no GPU in the development environment (WSL2 without CUDA). Cloud GPU providers add cost and an external dependency to a PoC.

## Decision

Run Demucs on the local CPU. The worker depends only on the queue and S3, and is not coupled to the API.

## Consequences

- Zero cost.
- Slow processing (roughly 1x–3x the song's length). Live progress is mandatory.
- Moving to a GPU (local, or Modal/RunPod/Replicate) only means replacing the worker.
