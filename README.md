# unmix

Proof of concept: upload a song (audio or video) and split it into its instruments (stems) with open-source AI. Listen to each stem in a multitrack mixer and download them.

**Stems (Demucs `htdemucs_6s`):** vocals, drums, bass, guitar, piano and other.

## Status

Phases 0–6 are done: web, API and worker work end to end, with Google sign-in, private libraries, a demo song and browser e2e tests ([spike results](docs/spike-demucs.md)). See the [roadmap](docs/02-roadmap.md) for what is still open.

Demo song: "La" by Shane Ivers (https://www.silvermansound.com), licensed under CC BY 4.0 ([assets/demo](assets/demo/README.md)).

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + TypeScript, Tailwind v4, shadcn/ui, Zustand |
| API | Node.js + TypeScript, Fastify, Drizzle ORM, zod, Better Auth |
| Queue | Redis + BullMQ |
| Worker | Python, Demucs (PyTorch, CPU), ffmpeg |
| Data | PostgreSQL |
| Files | SeaweedFS (S3-compatible) |
| Infra | Docker Compose |

## Architecture

Clean Architecture + tactical DDD in all three services; the API is a modular monolith. See [06](docs/06-domain.md), [07](docs/07-code-structure.md) and ADRs 0011–0018.

## Layout

```
apps/web           React frontend
apps/api           Node API (Fastify)
services/worker    Python worker (Demucs)
packages/contracts Contracts between processes (zod → JSON Schema → pydantic)
assets/demo        Demo song (CC BY 4.0)
docs/              Vision, architecture, roadmap, ADRs
```

## Documentation

- [00 — Vision and scope](docs/00-vision.md)
- [01 — Architecture](docs/01-architecture.md)
- [02 — Roadmap](docs/02-roadmap.md)
- [03 — API contract](docs/03-api-contract.md)
- [04 — Data model](docs/04-data-model.md)
- [05 — Local setup](docs/05-setup.md)
- [06 — Domain (DDD)](docs/06-domain.md)
- [07 — Code structure](docs/07-code-structure.md)
- [Architecture decision records (ADR)](docs/adr/)

## Quickstart

```bash
cp .env.example .env          # add the Google OAuth client, see docs/05-setup.md
docker compose up -d          # postgres, redis, s3, worker, api, web
pnpm install && pnpm --filter @unmix/api demo:seed   # once: the demo song
open http://localhost:5173    # sign in and upload a song
```

More in [web](apps/web/README.md), [api](apps/api/README.md) and [worker](services/worker/README.md).
