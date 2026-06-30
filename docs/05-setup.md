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
docker compose up -d postgres redis s3 s3-init
docker compose ps
```

- Postgres: `localhost:5432`
- Redis: `localhost:6379`
- S3 (SeaweedFS): http://localhost:9000 (credenciales en `.env` e `infra/seaweedfs/s3.json`)

SeaweedFS no tiene consola web. Para ver el bucket:

```bash
docker run --rm --network host -e AWS_ACCESS_KEY_ID=unmix -e AWS_SECRET_ACCESS_KEY=unmix-secret \
  -e AWS_DEFAULT_REGION=us-east-1 amazon/aws-cli --endpoint-url http://localhost:9000 s3 ls s3://unmix/ --recursive
```

## Recursos

Demucs en CPU usa varios GB de RAM. Si WSL se queda corto, ajustar `%UserProfile%\.wslconfig`:

```ini
[wsl2]
memory=8GB
processors=4
```
