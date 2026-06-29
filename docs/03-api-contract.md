# 03 — Contrato de API (borrador)

Base: `/api/v1`. JSON. Errores con forma `{ "error": { "code": string, "message": string } }`.

## Subida

### `POST /uploads`
Crea un track y devuelve una URL firmada para subir el archivo directo a MinIO.

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
Estado de Postgres, Redis y MinIO.

## Payload del job (cola `separation`)

Definido en `packages/shared` (zod) y replicado en el worker (pydantic).

```json
{ "jobId": "uuid", "trackId": "uuid", "inputKey": "tracks/{trackId}/original.mp3", "model": "htdemucs_6s" }
```

Resultado:
```json
{ "durationSeconds": 241, "stems": [{ "name": "vocals", "key": "tracks/{trackId}/stems/vocals.wav", "sizeBytes": 42000000 }] }
```
