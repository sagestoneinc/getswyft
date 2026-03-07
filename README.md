# getswyft

Monorepo with:

- `apps/api`: Express + Socket.IO API with Phase 1 multi-tenant foundations
- `apps/website`: React + TypeScript website/dashboard
- `apps/agent`: Agent console runtime shell
- `apps/widget`: Widget runtime shell
- `packages/shared`: API contracts + permission constants

## Run locally

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/website/.env.example apps/website/.env
pnpm -C apps/api prisma:generate
pnpm -C apps/api prisma:migrate:deploy
pnpm -C apps/api prisma:seed
pnpm dev:api
```

API health check:

```bash
curl http://localhost:8080/health
```

Website dev server:

```bash
pnpm dev:website
```

## Deploy to Railway

This repo includes a root `Dockerfile` and `railway.json`. Deploy each service with `RAILWAY_SERVICE_NAME`:
- `api` (or `getswyft`)
- `website`
- `agent`
- `widget`

```bash
railway link # choose the correct project/service
railway up
```
