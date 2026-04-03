# Getswyft Agent Console

React + TypeScript standalone console for agent-facing inbox work.

The agent console now uses the same auth provider configuration as the main website and talks directly to the current `/v1` tenant-aware API and Socket.IO realtime layer.

## Tech stack

- React 19 + TypeScript
- Vite 7
- Socket.IO Client (real-time messaging and presence)

## Development

```bash
# From the monorepo root
pnpm dev:agent
```

The dev server starts at `http://localhost:5173` (or the next available port).

## Build

```bash
pnpm -C apps/agent build
```

## Preview

```bash
pnpm -C apps/agent preview
```

Serves the production build on port `4173` (or `$PORT`).

## Linting

```bash
pnpm -C apps/agent lint
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API base URL |
| `VITE_WS_BASE_URL` | WebSocket base URL |
| `VITE_AUTH_PROVIDER` | `supabase` or `keycloak` |
| `VITE_SUPABASE_URL` | Supabase project URL when using Supabase auth |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key when using Supabase auth |
| `VITE_KEYCLOAK_URL` | Keycloak server URL when using Keycloak |
| `VITE_KEYCLOAK_REALM` | Keycloak realm |
| `VITE_KEYCLOAK_CLIENT_ID` | Keycloak client ID |
| `VITE_DEV_AUTH_BYPASS` | Local-only auth bypass toggle |
| `VITE_DEV_USER_ID` | Local bypass user id |
| `VITE_DEV_USER_EMAIL` | Local bypass email |
| `VITE_DEV_USER_NAME` | Local bypass display name |
| `VITE_DEV_TENANT_SLUG` | Local bypass tenant slug |
