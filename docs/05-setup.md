# 05 — Setup local

Entorno de referencia: Windows + WSL2 (Ubuntu), Node 24 vía nvm, Python 3.

## Prerrequisitos

| Herramienta | Uso | Instalación |
|-------------|-----|-------------|
| Docker | Infra local | Docker Desktop con integración WSL activada, o `sudo apt install docker.io docker-compose-v2` |
| ffmpeg | Extraer/normalizar audio | `sudo apt install ffmpeg` |
| pnpm | Monorepo JS | `corepack enable && corepack prepare pnpm@latest --activate` |
| uv | Entorno Python del worker | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |

Verificar:

```bash
docker --version && docker compose version
ffmpeg -version | head -1
pnpm --version
uv --version
```

## Levantar infraestructura

```bash
cp .env.example .env
docker compose up -d postgres redis minio minio-init
docker compose ps
```

- Postgres: `localhost:5432`
- Redis: `localhost:6379`
- MinIO API: http://localhost:9000
- MinIO consola: http://localhost:9001 (usuario y clave de `.env`)

## Recursos

Demucs en CPU usa varios GB de RAM. Si WSL se queda corto, ajustar `%UserProfile%\.wslconfig`:

```ini
[wsl2]
memory=8GB
processors=4
```
