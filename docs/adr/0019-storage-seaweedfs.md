# 0019 — Local S3 storage: SeaweedFS instead of MinIO

- **Status:** Accepted
- **Date:** 2026-10-27
- **Supersedes:** the storage engine in [0006](0006-storage-postgres-minio.md)

## Context

When bringing up the infrastructure (phase 0), the `minio/minio` and `minio/mc` images could no longer be pulled: Docker Hub answers `pull access denied` and quay.io `401 UNAUTHORIZED`. MinIO stopped distributing free images. Alternatives evaluated, all of them pullable: SeaweedFS (Apache-2.0, mature), RustFS (Apache-2.0, young, MinIO-like console) and Garage (AGPL-3.0, more complex setup).

## Decision

Use SeaweedFS (`chrislusf/seaweedfs`, pinned version) as the local S3-compatible storage. An `s3` service in Docker Compose, exposed on `localhost:9000`. Development credentials in `infra/seaweedfs/s3.json`. The bucket is created by `s3-init` with `aws-cli`.

## Consequences

- Apache-2.0 license, no restrictions for the client.
- No code changes: everything goes through the `ObjectStorage` port and the S3 protocol. Production can use AWS S3 or Cloudflare R2.
- There is no web console; the bucket is inspected with `aws-cli`.
- The credentials in the JSON must match `S3_ACCESS_KEY` and `S3_SECRET_KEY` in `.env`.
