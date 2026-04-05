# Railway Setup

Deploy each app as a separate Railway service, all pointing at the same repo and branch.

## 1. Service strategy

- **API** uses the repository root `Dockerfile` and root `railway.json`.
- **Website**, **Agent**, and **Widget** should use the build/start commands below from the repository root.
- Keep the repo root as the Railway **Root Directory** so workspace installs can resolve correctly.

## 2. Build and start commands

Paste these into each service's **Settings → Build** and **Settings → Start** fields.

### API

| Field | Command |
|-------|---------|
| Build | `npm run install:ci && npm run build:api` |
| Start | `npm run migrate:api && npm run start:api` |

### Website

| Field | Command |
|-------|---------|
| Build | `npm run install:ci && npm run build:website` |
| Start | `npm run start:website` |

### Agent

| Field | Command |
|-------|---------|
| Build | `npm run install:ci && npm run build:agent` |
| Start | `npm run start:agent` |

### Widget

| Field | Command |
|-------|---------|
| Build | `npm run install:ci && npm run build:widget` |
| Start | `npm run start:widget` |

`install:ci` enables pnpm in CI mode and runs a frozen workspace install with dev dependencies, which the Prisma/Vite/TypeScript build steps need.

## 3. Required environment variables

### API service

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SUPABASE_DB_URL` | Supabase Postgres connection string for `db:sync` / SQL migrations |
| `JWT_SECRET` | Secret used for internal widget visitor tokens |
| `OPENAI_API_KEY` | Default AI provider key |
| `CORS_ORIGINS` | Allowed app origins, comma-separated |
| `SIP_ENCRYPTION_KEY` | Required in production for SIP credential encryption |
| `TRUST_PROXY` | Set to `true` on Railway so rate limiting and HTTPS detection use the client IP correctly |
| `PORT` | Set automatically by Railway |

### Website service

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Public API URL |
| `VITE_WS_BASE_URL` | Public WebSocket URL |
| `VITE_AUTH_PROVIDER` | `keycloak`, `supabase`, or `firebase` |
| `VITE_SUPABASE_URL` | Required when `VITE_AUTH_PROVIDER=supabase` |
| `VITE_SUPABASE_ANON_KEY` | Required when `VITE_AUTH_PROVIDER=supabase` |
| `PORT` | Set automatically by Railway |

### Agent service

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Public API URL |
| `VITE_WS_BASE_URL` | Public WebSocket URL |
| `VITE_SOCKET_TOKEN` | Optional pre-shared token for non-dev socket auth |
| `PORT` | Set automatically by Railway |

### Widget service

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Public API URL |
| `VITE_WS_BASE_URL` | Public WebSocket URL |
| `VITE_SOCKET_TOKEN` | Optional pre-shared token for runtime smoke checks |
| `PORT` | Set automatically by Railway |

See [env.md](env.md) for the full variable reference.

## 4. Health checks

- The root `railway.json` points API health checks at `/health/ready`.
- Frontend services should use `/` as their health check path if you configure one manually in the dashboard.

## 5. One-time release tasks

After the first successful API deployment:

```bash
npm run seed:api
```

Before or after a release, verify both database tracks are aligned:

```bash
pnpm run db:sync:status
pnpm run db:sync
```

`db:sync` requires both `DATABASE_URL` and `SUPABASE_DB_URL` in the API service environment.

## 6. Notes

1. `.nvmrc` pins the project to Node 20.
2. `migrate:api` should run once per deployment, not concurrently across multiple API instances.
3. The website build intentionally fails when required auth variables are missing, so missing production auth config is caught before release.
