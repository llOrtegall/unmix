# 03 — API contract

Base: `/api/v1`. JSON. Schemas in `packages/contracts/src/http/api.ts` (zod).

## Errors

Every error answers `{ "code": string, "message": string }` ([ADR 0028](adr/0028-clean-architecture-skills.md)). The `code` is stable and namespaced (`track.not_found`); the `message` is for logs, not for users. The status comes from the error's category:

| Status | When | Example codes |
|--------|------|---------------|
| 400 | The request does not match its schema | `request.invalid` |
| 401 | No session | `session.required` |
| 404 | Not found, or owned by someone else | `track.not_found`, `route.not_found` |
| 409 | Conflict with the current state | `track.busy`, `track.upload_missing`, `track.stems_not_ready` |
| 422 | A business rule rejects the input | `track.unsupported_media_type`, `track.file_too_large` |
| 500 | Unexpected failure | `internal` |

Separation jobs still answer `JOB_NOT_FOUND` (404) and `INVALID_TRANSITION` (409) until that module is migrated.

## Authentication

Every `/api/v1` route requires the Better Auth session cookie. Without it, routes answer `401 session.required` ([ADR 0025](adr/0025-sessions-and-ownership.md)). Each user only sees their own tracks and jobs. Someone else's answer `404`, the same as ones that do not exist.

Better Auth serves `/api/auth/*`. The web uses `POST /api/auth/sign-in/social` (`{ "provider": "google", "callbackURL": "/" }`), `GET /api/auth/get-session` and `POST /api/auth/sign-out`.

## Upload

### `POST /uploads`
Creates a track and returns a presigned URL to upload the file straight to S3 storage.

```json
// request
{ "filename": "song.mp3", "contentType": "audio/mpeg", "sizeBytes": 8123456 }
// response 201
{ "trackId": "uuid", "uploadUrl": "https://...", "expiresIn": 900 }
```

Validation: allowed type (`422 track.unsupported_media_type`), `sizeBytes <= MAX_UPLOAD_MB` (`422 track.file_too_large`).

## Jobs

### `POST /tracks/:trackId/jobs`
Checks that the file is in storage and enqueues the separation. `409 track.upload_missing` if it has not been uploaded yet; `409 track.busy` if it is already being separated.

```json
// response 202 (JobResponse)
{ "jobId": "uuid", "trackId": "uuid", "status": "queued", "stage": null, "progress": 0, "error": null }
```

### `GET /jobs/:jobId`
```json
{ "jobId": "uuid", "trackId": "uuid", "status": "queued|processing|completed|failed", "stage": "separating", "progress": 42, "error": null }
```

### `GET /jobs/:jobId/events` (SSE)
Events: `snapshot` (current state on connect), `progress`, `completed`, `failed`. The `data` of each one is a `JobResponse`. A `: ping` comment every 15 s. The connection closes when the job ends.

Stages (`stage`): `downloading`, `normalizing`, `separating`, `uploading`.

## Tracks

### `GET /tracks`
Paginated history, newest first (`?cursor=<createdAt ISO>&limit=20`). Response `{ items, nextCursor }`.

### `GET /tracks/:trackId`
```json
{
  "trackId": "uuid",
  "title": "song",
  "durationSeconds": 241,
  "status": "awaiting_upload|uploaded|separating|completed|failed",
  "credit": null,
  "createdAt": "2026-10-27T15:00:00Z",
  "latestJobId": "uuid",
  "stems": [
    { "name": "vocals", "url": "FLAC (presigned GET, 1 h)", "previewUrl": "MP3 128 kbps", "peaksUrl": "peaks JSON", "midiUrl": "MIDI or null", "sizeBytes": 21890660, "silent": false }
  ]
}
```

`midiUrl` is a Standard MIDI file transcribed with Basic Pitch; `null` for drums, silent stems and tracks separated before transcription existed ([ADR 0027](adr/0027-midi-transcription.md)).

`credit` holds the license attribution of the demo song and is `null` for uploads ([ADR 0026](adr/0026-demo-song-and-cleanup.md)).

### `GET /tracks/:trackId/download.zip`
Streaming ZIP with the FLAC stems (not recompressed) and, when present, `midi/<stem>.mid`. `409 track.stems_not_ready` if the track is not `completed`.

### `DELETE /tracks/:trackId`
Deletes the track, its stems and its files. `409 track.busy` while it is being separated.

## Health

### `GET /health` (no prefix)
Status of Postgres, Redis and S3 storage. `200` or `503`.

## `separation` queue messages

Defined in `packages/contracts/src/messages/separation.ts` (zod). The worker uses pydantic models generated from the JSON Schema.

Job `separation.requested.v1` (data):
```json
{ "messageId": "uuid", "jobId": "uuid", "trackId": "uuid", "inputKey": "tracks/{trackId}/original.mp3", "outputPrefix": "tracks/{trackId}/stems", "model": "htdemucs_6s" }
```

Producer options: `jobId` = the message's `jobId` (idempotency), `attempts: 3`, `backoff: exponential 5 s`.

Progress (`job.progress`):
```json
{ "stage": "separating", "progress": 42 }
```

Result (`job.returnvalue`, `SeparationCompletedV1`):
```json
{ "jobId": "uuid", "trackId": "uuid", "durationSeconds": 297.27,
  "stems": [{ "name": "piano", "key": "tracks/{trackId}/stems/piano.flac", "sizeBytes": 9808880, "format": "flac", "silent": true,
              "previewKey": "tracks/{trackId}/stems/piano.preview.mp3", "peaksKey": "tracks/{trackId}/stems/piano.peaks.json",
              "midiKey": null }] }
```

Failure (`job.failedReason`, `SeparationFailureV1` as JSON):
```json
{ "code": "DURATION_EXCEEDED", "message": "Track lasts 720 s; the limit is 600 s.", "retryable": false }
```

Codes: `INVALID_MESSAGE`, `INPUT_NOT_FOUND`, `INVALID_MEDIA`, `DURATION_EXCEEDED` (not retryable); `SEPARATION_ERROR`, `STORAGE_ERROR` (retryable).
