# unmix

Prueba de concepto: sube una canción (audio o video) y sepárala en sus instrumentos (stems) con IA de código abierto. Escucha cada stem en un mixer multitrack y descárgalos.

**Stems (Demucs `htdemucs_6s`):** voz, batería, bajo, guitarra, piano y otros.

## Estado

Fases 0–6 completadas: web + API + worker funcionan de punta a punta, con login de Google, bibliotecas privadas, una canción demo y tests e2e en el navegador ([resultados del spike](docs/spike-demucs.md)). Ver [roadmap](docs/02-roadmap.md) para lo que queda abierto.

Canción demo: "La" de Shane Ivers (https://www.silvermansound.com), con licencia CC BY 4.0 ([assets/demo](assets/demo/README.md)). 

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React + Vite + TypeScript, Tailwind v4, shadcn/ui, Zustand |
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
docker compose up -d          # postgres, redis, s3, worker, api, web
open http://localhost:5173    # sube una canción
```

Detalles en [web](apps/web/README.md), [api](apps/api/README.md) y [worker](services/worker/README.md).
