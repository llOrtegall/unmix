# 02 — Roadmap

Cada fase termina con algo demostrable. No avanzar sin cumplir los criterios de aceptación.

## Fase 0 — Setup del entorno

- Instalar Docker (Docker Desktop con integración WSL o Docker Engine en WSL).
- Instalar ffmpeg, pnpm y uv.
- `docker compose up -d postgres redis minio` levanta todo sano.

**Aceptación:** los tres servicios en estado `healthy`; consola MinIO accesible en http://localhost:9001 con bucket `unmix` creado.

## Fase 1 — Spike de Demucs

- Script CLI en `services/worker/spike/` que separa una canción local en 6 stems.
- Medir tiempo total, RAM máxima y calidad percibida por stem.
- Documentar resultados en `docs/spike-demucs.md`.

**Aceptación:** canción de 4 minutos separada en menos de ~15 minutos en CPU. Si no se cumple, evaluar modelo `htdemucs` (4 stems) o `segment` más pequeño.

## Fase 2 — Worker

- Consume la cola `separation` con el paquete Python `bullmq`.
- Descarga el original desde MinIO, valida duración, normaliza con ffmpeg.
- Ejecuta Demucs y reporta progreso.
- Sube los stems a `tracks/{trackId}/stems/{stem}.wav`.
- Reintentos (3, backoff exponencial), timeout y errores tipados.
- Dockerfile.

**Aceptación:** encolando un job a mano (script), los stems aparecen en MinIO y el job queda `completed`. Matar el worker a mitad de un job y reiniciarlo: el job se reintenta.

## Fase 3 — API

- Fastify + TypeScript + Drizzle (migraciones) + zod.
- Endpoints de [03-api-contract.md](03-api-contract.md).
- SSE escuchando `QueueEvents` de BullMQ.
- Generación de ZIP en streaming.
- Logs estructurados (pino). Tests de integración (vitest).

**Aceptación:** flujo completo con `curl`: subir, crear job, ver eventos SSE, listar stems, descargar ZIP.

## Fase 4 — Frontend

- Drag and drop con validación previa (tipo, tamaño).
- Barra de subida y barra de procesamiento en vivo.
- Mixer: waveform por stem, mute, solo, volumen, play/pause/seek sincronizado.
- Biblioteca de canciones.
- Descarga por stem y ZIP.

**Aceptación:** un usuario no técnico completa el flujo sin ayuda.

## Fase 5 — Autenticación

- Better Auth con Google OAuth.
- Tracks asociados a usuario; historial privado.

**Aceptación:** dos cuentas de Google ven bibliotecas distintas.

## Fase 6 — Pulido para cliente

- Mensajes de error amigables, estados vacíos, skeletons.
- Diseño responsive.
- Canción demo precargada.
- Tests e2e con Playwright.
- Limpieza automática de archivos antiguos.

**Aceptación:** demo grabada de punta a punta lista para el cliente.

## Futuro

- Worker con GPU (local CUDA o Modal / RunPod / Replicate).
- Modelos RoFormer para voz de mayor calidad.
- Transcripción a MIDI (Basic Pitch).
- Cuotas y planes.
