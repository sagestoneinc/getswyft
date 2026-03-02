# Railway Setup

> **Shared monorepo** — do **NOT** set Root Directory to `apps/*`.
> Always deploy from the **repository root** so that every service can
> resolve workspace dependencies.

---

## 1. Project structure

```
apps/
  api/        – Express back-end (Prisma + PostgreSQL)
  agent/      – Vite SPA (agent dashboard)
  widget/     – Vite SPA (embeddable widget)
```

Each service is deployed as a separate Railway service inside the **same**
Railway project, all pointing at the **same** GitHub repo and branch.

---

## 2. Build & Start commands

Paste these into each service's **Settings → Build** and **Settings → Start**
fields in the Railway dashboard.

### API

| Field | Command |
|-------|---------|
| Build | `npm run install:ci && npm run build:api` |
| Start | `npm run migrate:api && npm run start:api` |

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

> `install:ci` enables corepack, activates the pinned pnpm version, and
> runs `pnpm install --frozen-lockfile --prod=false` (dev dependencies are
> needed for Prisma, TypeScript, and Vite builds).

---

## 3. Required environment variables

### API service

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Railway provides this when you add a Postgres plugin) |
| `JWT_SECRET` | Secret used to sign auth tokens |
| `CORS_ORIGINS` | Comma-separated allowed origins (e.g. `https://agent.example.com,https://widget.example.com`) |
| `PORT` | *(set automatically by Railway)* |

### Agent service

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Public URL of the API service (e.g. `https://api-production-xxxx.up.railway.app`) |
| `VITE_WS_URL` | WebSocket URL of the API service (e.g. `wss://api-production-xxxx.up.railway.app`) |
| `PORT` | *(set automatically by Railway)* |

### Widget service

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Public URL of the API service |
| `VITE_WS_URL` | WebSocket URL of the API service |
| `VITE_TENANT_ID` | Tenant identifier for the widget |
| `PORT` | *(set automatically by Railway)* |

### Suggested (all services)

| Variable | Description |
|----------|-------------|
| `NIXPACKS_NODE_VERSION` | Set to `20` to match `.nvmrc` |

---

## 4. One-time tasks

After the first successful API deployment, seed the database:

```bash
# In Railway's service shell or via `railway run`:
npm run seed:api
```

---

## 5. Nixpacks deployment (alternative)

The repository ships with `nixpacks.toml` files that fully configure each
service for the Nixpacks builder. If you prefer Nixpacks over the Dockerfile
approach, switch each Railway service's builder to **Nixpacks** and the
`nixpacks.toml` in each app handles setup, install, build, and start
automatically — no manual build/start commands are needed.

Each `nixpacks.toml` runs:

| Phase | What it does |
|-------|-------------|
| `setup` | Enables corepack and activates pnpm 9.15.4 |
| `install` | Runs `pnpm install --frozen-lockfile` |
| `build` | Runs `pnpm run build` (TypeScript + Vite for agent/widget, Prisma generate for API) |
| `start` | Runs `pnpm run preview` (agent/widget) or `pnpm run start` (API) |

> **Note:** `railway.json` is configured with `"builder": "DOCKERFILE"` by
> default, which only applies to the API service. The agent and widget services
> should use the Nixpacks builder or have their build/start commands set
> manually as described in section 2.

---

## 6. How it works

1. **`.nvmrc`** pins Node to version 20.
2. Root **`package.json`** exposes short `install:ci`, `build:*`, `migrate:*`,
   and `start:*` scripts so Railway build/start fields stay readable.
3. `migrate:api` runs Prisma migrations as a separate step — run it in the
   start command or as a one-off release command, but avoid running it from
   multiple concurrent instances.
4. Agent and Widget `vite preview` binds to `0.0.0.0` on `$PORT`
   (defaults to 4173 locally).
5. API listens on `process.env.PORT` (defaults to 3000 locally).
