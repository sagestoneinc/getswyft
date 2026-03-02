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
| Start | `npm run start:api` |

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
> runs `pnpm install --frozen-lockfile`.

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

## 5. How it works

1. **nixpacks.toml** runs `corepack enable` + `corepack prepare pnpm@9.15.4`
   during the Nixpacks setup phase so pnpm is always available.
2. **`.nvmrc`** pins Node to version 20.
3. Root **`package.json`** exposes short `install:ci`, `build:*`, and
   `start:*` scripts so Railway build/start fields stay readable.
4. Agent and Widget `vite preview` binds to `0.0.0.0` on `$PORT`
   (defaults to 4173 locally).
5. API listens on `process.env.PORT` (defaults to 3000 locally).
