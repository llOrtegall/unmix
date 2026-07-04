# 03 — Contrato de API (borrador)

Base: `/api/v1`. JSON. Schemas en `packages/contracts/src/http/api.ts` (zod). Errores con forma `{ "error": { "code": string, "message": string } }`.

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
Comprueba que el archivo está en el storage y encola la separación. `409 UPLOAD_MISSING` si aún no se subió; `409 TRACK_BUSY` si ya se está separando.

```json
// response 202 (JobResponse)
{ "jobId": "uuid", "trackId": "uuid", "status": "queued", "stage": null, "progress": 0, "error": null }
```

### `GET /jobs/:jobId`
```json
{ "jobId": "uuid", "trackId": "uuid", "status": "queued|processing|completed|failed", "stage": "separating", "progress": 42, "error": null }
```

### `GET /jobs/:jobId/events` (SSE)
Eventos: `snapshot` (estado actual al conectar), `progress`, `completed`, `failed`. El `data` de todos es un `JobResponse`. Comentario `: ping` cada 15 s. La conexión se cierra al terminar el job.

Etapas (`stage`): `downloading`, `normalizing`, `separating`, `uploading`.

## Tracks

### `GET /tracks`
Historial paginado, más nuevo primero (`?cursor=<createdAt ISO>&limit=20`). Respuesta `{ items, nextCursor }`.

### `GET /tracks/:trackId`
```json
{
  "trackId": "uuid",
  "title": "song",
  "durationSeconds": 241,
  "status": "awaiting_upload|uploaded|separating|completed|failed",
  "createdAt": "2026-10-27T15:00:00Z",
  "latestJobId": "uuid",
  "stems": [
    { "name": "vocals", "url": "https://... (presigned GET, 1 h)", "sizeBytes": 21890660, "silent": false }
  ]
}
```

### `GET /tracks/:trackId/download.zip`
ZIP en streaming con los stems FLAC (sin recomprimir). `409 INVALID_STATE` si el track no está `completed`.

### `DELETE /tracks/:trackId`
Borra track, stems y archivos. `409 TRACK_BUSY` mientras se separa.

## Salud

### `GET /health` (sin prefijo)
Estado de Postgres, Redis y storage S3. `200` o `503`.

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
