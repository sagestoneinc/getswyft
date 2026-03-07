# Getswyft Agent Console

React + TypeScript runtime shell for the agent-facing console, built with Vite.

The agent console connects to the Getswyft API and WebSocket server to provide real-time conversation management for support agents.

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
| `VITE_SOCKET_TOKEN` | Pre-shared token for socket authentication |
