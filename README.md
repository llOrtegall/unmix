# unmix

Prueba de concepto: sube una canción (audio o video) y sepárala en sus instrumentos (stems) con IA de código abierto. Escucha cada stem en un mixer multitrack y descárgalos.

**Stems (Demucs `htdemucs_6s`):** voz, batería, bajo, guitarra, piano y otros.

## Estado

Fases 0–2 completadas: el worker separa canciones desde la cola ([resultados del spike](docs/spike-demucs.md)). Siguiente: fase 3 (API). Ver [roadmap](docs/02-roadmap.md).

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React + Vite + TypeScript, Zustand, wavesurfer.js |
| API | Node.js + TypeScript, Fastify, Drizzle ORM, zod |
| Cola | Redis + BullMQ |
| Worker | Python, Demucs (PyTorch, CPU), ffmpeg |
| Datos | PostgreSQL |
| Archivos | SeaweedFS (compatible con S3) |
| Infra | Docker Compose |

## Arquitectura

Clean Architecture + DDD táctico en los tres servicios; la API es un monolito modular. Ver [06](docs/06-domain.md), [07](docs/07-code-structure.md) y ADRs 0011–0018.

## Estructura

```
apps/web          Frontend React
apps/api          API Node (Fastify)
services/worker   Worker Python (Demucs)
packages/contracts Contratos entre procesos (zod → JSON Schema → pydantic)
docs/             Visión, arquitectura, roadmap, ADRs
```

## Documentación

- [00 — Visión y alcance](docs/00-vision.md)
- [01 — Arquitectura](docs/01-architecture.md)
- [02 — Roadmap](docs/02-roadmap.md)
- [03 — Contrato de API](docs/03-api-contract.md)
- [04 — Modelo de datos](docs/04-data-model.md)
- [05 — Setup local](docs/05-setup.md)
- [06 — Dominio (DDD)](docs/06-domain.md)
- [07 — Estructura de código](docs/07-code-structure.md)
- [Decisiones de arquitectura (ADR)](docs/adr/)

## Quickstart

```bash
cp .env.example .env
docker compose up -d postgres redis s3 s3-init
```

Worker: `docker compose up -d worker`. Probar con `services/worker/scripts/enqueue.py` (ver [worker](services/worker/README.md)). `api` y `web` llegan en las fases 3–4.
