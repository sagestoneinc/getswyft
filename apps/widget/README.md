# Getswyft Widget

React + TypeScript embeddable visitor widget, built with Vite.

The widget is embedded on real estate listing pages to allow site visitors to start conversations with agents. It connects to the Getswyft API and WebSocket server for real-time messaging.

## Tech stack

- React 19 + TypeScript
- Vite 7
- Socket.IO Client (real-time messaging)

## Development

```bash
# From the monorepo root
pnpm dev:widget
```

The dev server starts at `http://localhost:5174` (or the next available port).

## Build

```bash
pnpm -C apps/widget build
```

## Preview

```bash
pnpm -C apps/widget preview
```

Serves the production build on port `4173` (or `$PORT`).

## Linting

```bash
pnpm -C apps/widget lint
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API base URL |
| `VITE_WS_BASE_URL` | WebSocket base URL |
| `VITE_SOCKET_TOKEN` | Pre-shared token for socket authentication |
