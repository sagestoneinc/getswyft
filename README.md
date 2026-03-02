# getswyft

## Deploy

This monorepo has 3 deployable services:

- API (`apps/api`)
- Agent (`apps/agent`)
- Widget (`apps/widget`)

Run all install/build commands from the repository root.

### Required environment variables

- `DATABASE_URL` (PostgreSQL connection string)
- `JWT_SECRET` (used to sign auth tokens)
- `CORS_ORIGINS` (optional, comma-separated allowed origins)
- `PORT` (optional, defaults to `3000`)

### Railway deployment

Use this setup/build chain (copy exactly, including `&&`) to avoid `pnpm: not found` errors:

```bash
corepack enable && corepack prepare pnpm@9.15.4 --activate && corepack pnpm --version && corepack pnpm install --frozen-lockfile
```

#### API service (`apps/api`)

Deploy from the repository root. The included `Dockerfile` can be used directly, or set:

- Build command: `corepack enable && corepack prepare pnpm@9.15.4 --activate && corepack pnpm --version && corepack pnpm install --frozen-lockfile && corepack pnpm -C apps/api db:generate`
- Start command: `corepack pnpm -C apps/api start`

After creating the service, configure the required environment variables in Railway and run database migrations before (or during) deployment:

```bash
pnpm -C apps/api db:migrate:deploy
```

#### Agent service (`apps/agent`)

- Build command: `corepack enable && corepack prepare pnpm@9.15.4 --activate && corepack pnpm --version && corepack pnpm install --frozen-lockfile && corepack pnpm -C apps/agent build`
- Start command: `corepack pnpm -C apps/agent preview`

#### Widget service (`apps/widget`)

- Build command: `corepack enable && corepack prepare pnpm@9.15.4 --activate && corepack pnpm --version && corepack pnpm install --frozen-lockfile && corepack pnpm -C apps/widget build`
- Start command: `corepack pnpm -C apps/widget preview`
