# getswyft

## Deploy

The production runtime is the API app (`apps/api`).

### Required environment variables

- `DATABASE_URL` (PostgreSQL connection string)
- `JWT_SECRET` (used to sign auth tokens)
- `CORS_ORIGINS` (optional, comma-separated allowed origins)
- `PORT` (optional, defaults to `3000`)

### Railway deployment

Deploy this repository to a Railway service from the repo root. The included `Dockerfile` is used for the build.

After creating the service, configure the required environment variables in Railway and run database migrations before (or during) deployment:

```bash
pnpm -C apps/api db:migrate:deploy
```
