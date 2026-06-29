# 04 — Modelo de datos (borrador)

PostgreSQL con Drizzle ORM. Migraciones versionadas en `apps/api`.

```mermaid
erDiagram
  users ||--o{ tracks : owns
  tracks ||--o{ jobs : has
  tracks ||--o{ stems : produces

  users {
    uuid id PK
    text email
    text name
    timestamptz created_at
  }
  tracks {
    uuid id PK
    uuid user_id FK "nullable hasta fase 5"
    text title
    text original_filename
    text content_type
    bigint size_bytes
    int duration_seconds
    text input_key
    text status "uploading|queued|processing|completed|failed"
    timestamptz created_at
  }
  jobs {
    uuid id PK
    uuid track_id FK
    text model
    text status
    int progress
    text error_code
    text error_message
    int attempts
    timestamptz started_at
    timestamptz finished_at
  }
  stems {
    uuid id PK
    uuid track_id FK
    text name "vocals|drums|bass|guitar|piano|other"
    text object_key
    bigint size_bytes
  }
```

## Claves en MinIO

```
tracks/{trackId}/original.{ext}
tracks/{trackId}/stems/{name}.wav
```

## Notas

- `users` llega en fase 5; Better Auth genera sus propias tablas (`session`, `account`, `verification`).
- Un track puede tener varios jobs (reintentos manuales, cambio de modelo futuro).
