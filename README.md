# unmix

Prueba de concepto: sube una canción (audio o video) y sepárala en sus instrumentos (stems) con IA de código abierto. Escucha cada stem en un mixer multitrack y descárgalos.

**Stems (Demucs `htdemucs_6s`):** voz, batería, bajo, guitarra, piano y otros.

## Estado

Fase 0 — Setup. Ver [roadmap](docs/02-roadmap.md).

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React + Vite + TypeScript, wavesurfer.js, TanStack Query |
| API | Node.js + TypeScript, Fastify, Drizzle ORM, zod |
| Cola | Redis + BullMQ |
| Worker | Python, Demucs (PyTorch, CPU), ffmpeg |
| Datos | PostgreSQL |
| Archivos | MinIO (compatible con S3) |
| Infra | Docker Compose |

## Estructura

```
apps/web          Frontend React
apps/api          API Node (Fastify)
services/worker   Worker Python (Demucs)
packages/shared   Contratos y tipos compartidos (zod)
docs/             Visión, arquitectura, roadmap, ADRs
```

## Documentación

- [00 — Visión y alcance](docs/00-vision.md)
- [01 — Arquitectura](docs/01-architecture.md)
- [02 — Roadmap](docs/02-roadmap.md)
- [03 — Contrato de API](docs/03-api-contract.md)
- [04 — Modelo de datos](docs/04-data-model.md)
- [05 — Setup local](docs/05-setup.md)
- [Decisiones de arquitectura (ADR)](docs/adr/)

## Quickstart

```bash
cp .env.example .env
docker compose up -d postgres redis minio
```

Los servicios `api`, `worker` y `web` se activan a partir de las fases 2–4.
