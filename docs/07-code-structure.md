# 07 — Estructura de código y reglas de dependencia

Regla única para los tres servicios: **las dependencias apuntan hacia el dominio.**

```
interface / presentation  ─┐
                           ├──▶  application  ──▶  domain
infrastructure  ───────────┘
```

| Capa | Contiene | Puede importar |
|------|----------|----------------|
| `domain` | Entidades, value objects, eventos, errores de negocio | Nada externo (solo `shared/kernel`) |
| `application` | Use cases, ports (interfaces), DTOs internos | `domain` |
| `infrastructure` | Adapters que implementan ports | `application`, `domain`, librerías |
| `interface` / `presentation` | HTTP, SSE, consumidores de cola, UI | `application`, `contracts` |

El composition root de cada proceso es el único lugar que conoce todas las capas ([ADR 0015](adr/0015-composition-root-manual.md)).

## API (`apps/api`) — monolito modular

```
src/
  main.ts                      composition root + arranque Fastify
  shared/
    kernel/                    Result, DomainEvent, Entity, Clock, IdGenerator
    infrastructure/            db (Drizzle), outbox relay, logger, s3 client
  modules/
    separation/
      domain/                  SeparationJob, Progress, eventos, errores
      application/
        use-cases/             RequestSeparation, RecordProgress, CompleteSeparation
        ports/                 JobRepository, SeparationQueue
      infrastructure/          DrizzleJobRepository, BullMqSeparationQueue
      interface/               rutas, SSE, consumidor de eventos del worker
      index.ts                 API pública del módulo
      wiring.ts
    library/
      domain/                  Track, Stem, StemName, Duration
      application/             RegisterUpload, AttachStems, ListTracks, DeleteTrack
      infrastructure/          DrizzleTrackRepository
      interface/               rutas
      index.ts
      wiring.ts
    identity/                  Better Auth (sin capas DDD)
```

## Worker (`services/worker`) — hexagonal

```
src/unmix_worker/
  main.py                      composition root
  domain/                      SeparationTask, Stem, errores
  application/
    separate_track.py          use case
    ports.py                   StemSeparator, MediaNormalizer, ObjectStorage, ProgressReporter
  adapters/
    demucs_separator.py
    ffmpeg_normalizer.py
    s3_storage.py
    bullmq_consumer.py         interface: traduce mensaje → use case
    bullmq_progress.py
  contracts/                   modelos pydantic generados (no editar)
tests/
  unit/                        dominio + use case con fakes
  integration/                 adapters reales (testcontainers)
```

## Web (`apps/web`) — Clean Architecture

```
src/
  main.tsx                     arranque React
  container.ts                 composition root
  domain/
    track.ts, stem.ts          modelos
    mix.ts                     reglas del mixer (solo, mute, ganancia efectiva)
  application/
    use-cases/                 UploadTrack, WatchSeparation, LoadTrack, DownloadStems
    ports/                     TrackGateway, UploadGateway, JobEventsGateway, AudioEngine
  infrastructure/
    http/                      FetchTrackGateway
    sse/                       EventSourceJobEvents
    upload/                    PresignedUploadGateway
    audio/                     WebAudioEngine (wavesurfer para waveforms)
  presentation/
    stores/                    Zustand (mixer, upload)
    pages/, components/, hooks/
```

## Contratos (`packages/contracts`)

```
src/http/                      requests/responses
src/messages/                  separation.requested.v1, separation.progressed.v1, ...
generated/json-schema/
```

## Verificación automática ([ADR 0018](adr/0018-reglas-dependencia-ci.md))

- `dependency-cruiser` (api, web): prohibido `domain → *`, `application → infrastructure|interface|presentation`, `modules/a/* → modules/b/<interno>`.
- `import-linter` (worker): contrato `layers` con `adapters > application > domain`.
- CI falla ante cualquier violación.

## Estrategia de tests

| Nivel | Qué | Herramienta |
|-------|-----|-------------|
| Unit | Dominio y use cases con fakes en memoria | vitest, pytest |
| Integración | Adapters contra Postgres/Redis/S3 reales | testcontainers |
| Contrato | Schemas generados al día, mensajes válidos | script CI |
| E2E | Flujo de usuario completo | Playwright |
