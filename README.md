# getswyft

## Deploy

The production runtime is the API app (`apps/api`).

### Required environment variables

- `DATABASE_URL` (PostgreSQL connection string)
- `JWT_SECRET` (used to sign auth tokens)
- `CORS_ORIGINS` (optional, comma-separated allowed origins)
- `PORT` (optional, defaults to `3000`)

### Docker deployment

```bash
docker build -t getswyft .
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/dbname" \
  -e JWT_SECRET="w9j1Qx4tR8mN2pV7sK6dF3hL0cB5yU1eA9zG2nJ4rT7vM8qP" \
  -e CORS_ORIGINS="https://your-app.example.com" \
  getswyft
```

Apply database migrations before (or during) deployment:

```bash
docker run --rm \
  -e DATABASE_URL="postgresql://user:password@host:5432/dbname" \
  getswyft pnpm -C apps/api db:migrate:deploy
```
