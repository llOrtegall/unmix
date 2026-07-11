# 0006 — Persistence: Postgres + MinIO

- **Status:** Accepted. Storage engine superseded by [0019](0019-storage-seaweedfs.md)
- **Date:** 2026-10-27

## Context

We need to store metadata (tracks, jobs, stems) and large audio files (a 4-minute WAV stem takes ~40 MB).

## Decision

PostgreSQL for metadata. MinIO (S3-compatible) for files. The browser uploads and downloads with presigned URLs.

## Consequences

- Moving to AWS S3 or Cloudflare R2 only changes environment variables.
- The API never streams audio, except for the streaming ZIP.
- We need a cleanup policy for old files (phase 6).
