# Decisiones de arquitectura (ADR)

Formato MADR corto. Una decisión por archivo. Para cambiar una decisión, crear un ADR nuevo que la reemplace.

| # | Decisión |
|---|----------|
| [0001](0001-modelo-demucs-6s.md) | Modelo de separación: Demucs `htdemucs_6s` |
| [0002](0002-computo-cpu-local.md) | Cómputo: CPU local, worker intercambiable |
| [0003](0003-backend-node-worker-python.md) | Backend: API Node + worker Python |
| [0004](0004-cola-redis-bullmq.md) | Cola: Redis + BullMQ |
| [0005](0005-frontend-react-vite.md) | Frontend: React + Vite + TypeScript |
| [0006](0006-storage-postgres-minio.md) | Persistencia: Postgres + MinIO (storage reemplazado por 0019) |
| [0007](0007-infra-docker-compose.md) | Infra: Docker Compose |
| [0008](0008-limites-entrada.md) | Entrada: audio y video, máximo 10 minutos |
| [0009](0009-auth-better-auth-google.md) | Auth: Better Auth + Google (fase 5) |
| [0010](0010-progreso-sse.md) | Progreso en vivo: SSE |
| [0011](0011-clean-architecture-ddd.md) | Clean Architecture + DDD táctico |
| [0012](0012-monolito-modular.md) | Backend: monolito modular por bounded context |
| [0013](0013-result-type.md) | Errores de negocio con Result type |
| [0014](0014-transactional-outbox.md) | Transactional outbox |
| [0015](0015-composition-root-manual.md) | Inyección de dependencias manual |
| [0016](0016-contratos-zod-json-schema-pydantic.md) | Contratos: zod → JSON Schema → pydantic |
| [0017](0017-frontend-clean-zustand.md) | Frontend: Clean Architecture + Zustand |
| [0018](0018-reglas-dependencia-ci.md) | Reglas de dependencia en CI |
| [0019](0019-storage-seaweedfs.md) | Storage S3 local: SeaweedFS en lugar de MinIO |
| [0020](0020-stems-flac-y-silencio.md) | Stems en FLAC y detección de stems silenciosos |
| [0021](0021-eventos-en-proceso-y-reconciliacion.md) | Eventos de dominio en proceso, outbox y reconciliación |
| [0022](0022-typescript-sin-build.md) | API en TypeScript sin paso de build |
| [0023](0023-previsualizacion-y-picos.md) | Previsualización MP3, picos de onda y reproducción con `<audio>` |
| [0024](0024-frontend-ui-e-i18n.md) | Frontend: estudio oscuro, shadcn/ui, Tailwind v4 e i18n propio |
