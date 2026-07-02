# 03 — Contrato de API (borrador)

Base: `/api/v1`. JSON. Errores con forma `{ "error": { "code": string, "message": string } }`.

## Subida

### `POST /uploads`
Crea un track y devuelve una URL firmada para subir el archivo directo al storage S3.

```json
// request
{ "filename": "song.mp3", "contentType": "audio/mpeg", "sizeBytes": 8123456 }
// response 201
{ "trackId": "uuid", "uploadUrl": "https://...", "expiresIn": 900 }
```

Validaciones: tipo permitido, `sizeBytes <= MAX_UPLOAD_MB`.

## Trabajos

### `POST /tracks/:trackId/jobs`
Confirma que la subida terminó y encola la separación.

```json
// response 202
{ "jobId": "uuid", "status": "queued" }
```

### `GET /jobs/:jobId`
```json
{ "jobId": "uuid", "trackId": "uuid", "status": "queued|processing|completed|failed", "progress": 42, "error": null }
```

### `GET /jobs/:jobId/events` (SSE)
Eventos: `progress` `{ "progress": 42, "stage": "separating" }`, `completed`, `failed` `{ "code", "message" }`.

Etapas (`stage`): `downloading`, `normalizing`, `separating`, `uploading`.

## Tracks

### `GET /tracks`
Historial paginado (`?cursor=&limit=20`).

### `GET /tracks/:trackId`
```json
{
  "trackId": "uuid",
  "title": "song",
  "durationSeconds": 241,
  "status": "completed",
  "createdAt": "2026-10-27T15:00:00Z",
  "stems": [
    { "name": "vocals", "url": "https://... (presigned GET)", "sizeBytes": 42000000 }
  ]
}
```

### `GET /tracks/:trackId/download.zip`
ZIP en streaming con todos los stems.

### `DELETE /tracks/:trackId`
Borra track, stems y archivos.

## Salud

### `GET /health`
Estado de Postgres, Redis y storage S3.

## Mensajes de la cola `separation`

Definidos en `packages/contracts/src/messages/separation.ts` (zod). El worker usa modelos pydantic generados desde el JSON Schema.

Job `separation.requested.v1` (data):
```json
{ "messageId": "uuid", "jobId": "uuid", "trackId": "uuid", "inputKey": "tracks/{trackId}/original.mp3", "outputPrefix": "tracks/{trackId}/stems", "model": "htdemucs_6s" }
```

Opciones del productor: `jobId` = `jobId` del mensaje (idempotencia), `attempts: 3`, `backoff: exponential 5 s`.

Progreso (`job.progress`):
```json
{ "stage": "separating", "progress": 42 }
```

Resultado (`job.returnvalue`, `SeparationCompletedV1`):
```json
{ "jobId": "uuid", "trackId": "uuid", "durationSeconds": 297.27,
  "stems": [{ "name": "piano", "key": "tracks/{trackId}/stems/piano.flac", "sizeBytes": 9808880, "format": "flac", "silent": true }] }
```

Fallo (`job.failedReason`, JSON `SeparationFailureV1`):
```json
{ "code": "DURATION_EXCEEDED", "message": "Track lasts 720 s; the limit is 600 s.", "retryable": false }
```

Códigos: `INVALID_MESSAGE`, `INPUT_NOT_FOUND`, `INVALID_MEDIA`, `DURATION_EXCEEDED` (no reintentables); `SEPARATION_ERROR`, `STORAGE_ERROR` (reintentables).
