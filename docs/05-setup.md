# 05 — Local setup

Reference environment: Windows + WSL2 (Ubuntu), Node 24 via nvm, Python 3.

## Prerequisites

| Tool | Used for | Install |
|------|----------|---------|
| Docker | Local infra | Docker Desktop with WSL integration enabled, or `sudo apt install docker.io docker-compose-v2` |
| ffmpeg | Extract/normalize audio, trim the demo video | `sudo apt install ffmpeg` |
| pnpm | JS monorepo | `corepack enable && corepack prepare pnpm@latest --activate` |
| uv | Worker Python environment | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |

Check:

```bash
docker --version && docker compose version
ffmpeg -version | head -1
pnpm --version
uv --version
```

## Start the infrastructure

```bash
cp .env.example .env
docker compose up -d postgres redis s3 s3-init
docker compose ps
```

- Postgres: `localhost:5432`
- Redis: `localhost:6379`
- S3 (SeaweedFS): http://localhost:9000 (credentials in `.env` and `infra/seaweedfs/s3.json`)

SeaweedFS has no web console. To look inside the bucket:

```bash
docker run --rm --network host -e AWS_ACCESS_KEY_ID=unmix -e AWS_SECRET_ACCESS_KEY=unmix-secret \
  -e AWS_DEFAULT_REGION=us-east-1 amazon/aws-cli --endpoint-url http://localhost:9000 s3 ls s3://unmix/ --recursive
```

## Google sign-in

The API needs a Google OAuth client ([ADR 0025](adr/0025-sessions-and-ownership.md)):

1. In the [Google Cloud console](https://console.cloud.google.com/), open **Google Auth Platform**. Fill in **Branding** (app name, support email), and in **Audience** keep the app in **Testing** and add your test users.
2. **Clients → Create client → Web application**:
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:5173/api/auth/callback/google`
3. Put the values in `.env`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and a `BETTER_AUTH_SECRET` from `openssl rand -base64 32`.

The browser always reaches the API through the web origin (Vite or nginx proxy `/api`), so the redirect URI uses port 5173, not 3000.

## Run everything

```bash
docker compose up -d                      # + worker, api (3000), web (5173)
pnpm install
pnpm --filter @unmix/api demo:seed        # once per fresh stack: the demo song
```

After recreating the `api` container, restart `web` too: nginx keeps the old API address and answers 502.

## Resources

Demucs on CPU uses several GB of RAM. If WSL runs short, tune `%UserProfile%\.wslconfig`:

```ini
[wsl2]
memory=8GB
processors=4
```
