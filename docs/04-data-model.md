# 04 — Data model

PostgreSQL with Drizzle ORM. Versioned migrations in `apps/api/drizzle`, applied when the API starts.

```mermaid
erDiagram
  users ||--o{ tracks : owns
  users ||--o{ sessions : has
  users ||--o{ accounts : has
  tracks ||--o{ separation_jobs : has
  tracks ||--o{ stems : produces

  users {
    uuid id PK
    text email
    text name
    text image
    timestamptz created_at
  }
  tracks {
    uuid id PK
    uuid user_id FK
    text title
    text original_filename
    text content_type
    bigint size_bytes
    double duration_seconds
    text input_key
    text status "awaiting_upload|uploaded|separating|completed|failed"
    uuid latest_job_id
    text credit "license attribution, demo song only"
    timestamptz created_at
  }
  separation_jobs {
    uuid id PK
    uuid track_id
    text model
    text status "queued|processing|completed|failed"
    text stage
    int progress
    jsonb failure "{ code: separation.*, message }"
    timestamptz created_at
    timestamptz finished_at
  }
  stems {
    uuid track_id PK
    text name PK "vocals|drums|bass|guitar|piano|other"
    text object_key
    bigint size_bytes
    boolean silent
    text preview_key
    text peaks_key
    text midi_key "null: drums, silent, older tracks"
  }
  outbox {
    uuid id PK
    text event_type "e.g. separation.requested"
    jsonb payload
    timestamptz occurred_at
    timestamptz published_at "null = pending"
    int attempts
    text last_error "last delivery failure"
  }
```

## S3 storage keys

```
tracks/{trackId}/original.{ext}
tracks/{trackId}/stems/{name}.flac
tracks/{trackId}/stems/{name}.preview.mp3
tracks/{trackId}/stems/{name}.peaks.json
tracks/{trackId}/stems/{name}.mid       Basic Pitch transcription (ADR 0027)
demo/manifest.json                     shared demo song (ADR 0026)
demo/original.mp3, demo/stems/...
```

## Notes

- `outbox` is written in the same transaction as the aggregate; a relay publishes the pending rows ([ADR 0014](adr/0014-transactional-outbox.md)). Only `separation.requested` has an external route (the BullMQ job `separation.requested.v1`); the other events are marked as published.
- `separation_jobs.failure` holds a `separation.*` code; migration `0005_separation_failure_codes` renamed the codes stored before [ADR 0031](adr/0031-worker-separation-module.md).
- Better Auth owns `users`, `sessions`, `accounts` and `verifications`, all with UUID ids. `tracks.user_id` references `users.id` and cascades on delete ([ADR 0025](adr/0025-sessions-and-ownership.md)).
- A track can have several jobs (manual retries, a different model in the future); `latest_job_id` points at the current one.
- Demo tracks point at the shared files under `demo/`; deleting one never touches them.
