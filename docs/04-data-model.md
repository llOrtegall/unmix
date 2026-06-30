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
  outbox {
    uuid id PK
    text event_type "p. ej. separation.requested.v1"
    jsonb payload
    timestamptz occurred_at
    timestamptz published_at "null = pendiente"
    int attempts
  }
```

## Claves en el storage S3

```
tracks/{trackId}/original.{ext}
tracks/{trackId}/stems/{name}.wav
```

## Notas

- `outbox`: se escribe en la misma transacción que el agregado; un relay publica las filas pendientes ([ADR 0014](adr/0014-transactional-outbox.md)).

- `users` llega en fase 5; Better Auth genera sus propias tablas (`session`, `account`, `verification`).
- Un track puede tener varios jobs (reintentos manuales, cambio de modelo futuro).
