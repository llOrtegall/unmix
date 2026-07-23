# Build context: repository root (the API depends on packages/contracts).
FROM node:24-slim

RUN corepack enable
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/package.json packages/contracts/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --prod --filter @unmix/api...

COPY packages/contracts/src packages/contracts/src
COPY apps/api/src apps/api/src
COPY apps/api/drizzle apps/api/drizzle

# Node 24 runs the TypeScript sources directly (type stripping): no build step.
WORKDIR /repo/apps/api
USER node
EXPOSE 3000
CMD ["node", "src/server.ts"]
