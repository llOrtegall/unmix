# 02 — Roadmap

Cada fase termina con algo demostrable. No avanzar sin cumplir los criterios de aceptación.

## Fase 0 — Setup del entorno

- Instalar Docker (Docker Desktop con integración WSL o Docker Engine en WSL). ✅
- Instalar ffmpeg, pnpm y uv. ✅
- `docker compose up -d postgres redis s3 s3-init` levanta todo sano.

**Aceptación:** los tres servicios en estado `healthy`; bucket `unmix` creado; subida y descarga con URL firmada funcionan.

## Fase 1 — Spike de Demucs

- Script CLI en `services/worker/spike/` que separa una canción local en 6 stems.
- Medir tiempo total, RAM máxima y calidad percibida por stem.
- Documentar resultados en `docs/spike-demucs.md`. ✅ 84 s para 4:57 (factor 0.28), 2.2 GB RAM.

**Aceptación:** canción de 4 minutos separada en menos de ~15 minutos en CPU. Si no se cumple, evaluar modelo `htdemucs` (4 stems) o `segment` más pequeño.

## Fase 2 — Worker

- `packages/contracts`: mensajes `separation.*.v1` en zod y generación de pydantic ([ADR 0016](adr/0016-contratos-zod-json-schema-pydantic.md)).
- Estructura hexagonal con `import-linter` ([07](07-code-structure.md)).
- Consume la cola `separation` con el paquete Python `bullmq`.
- Descarga el original desde el storage S3, valida duración, normaliza con ffmpeg.
- Ejecuta Demucs y reporta progreso.
- Sube los stems a `tracks/{trackId}/stems/{stem}.flac` ([ADR 0020](adr/0020-stems-flac-y-silencio.md)).
- Reintentos (3, backoff exponencial), timeout y errores tipados.
- Dockerfile.

**Aceptación:** encolando un job a mano (script), los stems aparecen en el storage S3 y el job queda `completed`. Matar el worker a mitad de un job y reiniciarlo: el job se reintenta.

**Estado:** ✅ completada (2026-10-27). Job de punta a punta en Docker: 83 s para 4:57. Archivo inválido: `INVALID_MEDIA` sin reintentos. `kill -9` a mitad del job: BullMQ lo recupera unos 60 s después y lo completa.

## Fase 3 — API

- Fastify + TypeScript + Drizzle (migraciones) + zod.
- Monolito modular (`separation`, `library`), Result type, outbox relay y `dependency-cruiser` ([ADRs 0012–0015, 0018](adr/)).
- Endpoints de [03-api-contract.md](03-api-contract.md).
- SSE escuchando `QueueEvents` de BullMQ.
- Generación de ZIP en streaming.
- Logs estructurados (pino). Tests de integración (vitest).

**Aceptación:** flujo completo con `curl`: subir, crear job, ver eventos SSE, listar stems, descargar ZIP.

**Estado:** ✅ completada (2026-10-27). `pnpm e2e` recorre el flujo en la pila Docker completa (84 s, ZIP de 93 MB). Reconciliación verificada con la API detenida durante un job. Tests de integración con testcontainers quedan pendientes; hoy cubren el e2e y los unit tests.

## Fase 4 — Frontend

- Clean Architecture + Zustand ([ADR 0017](adr/0017-frontend-clean-zustand.md)); dominio del mixer con tests unitarios.
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
