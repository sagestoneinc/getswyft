# getswyft

Monorepo with:

- `apps/api`: Express + Socket.IO API (Railway deployment target)
- `apps/agent`: React app
- `apps/widget`: React app

## Run locally

```bash
pnpm install
pnpm -C apps/api start
```

API health check:

```bash
curl http://localhost:8080/health
```

## Deploy to Railway

This repo includes a root `Dockerfile` and `railway.json` to deploy `apps/api`.

```bash
railway link # choose the correct project/service
railway up
```
