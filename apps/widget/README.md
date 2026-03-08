# Getswyft Widget

React + TypeScript embeddable visitor widget, built with Vite.

The widget is embedded on real estate listing pages to allow site visitors to start conversations with agents. It connects to the Getswyft API for visitor session creation and to the WebSocket server for real-time messaging.

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
| `VITE_SOCKET_TOKEN` | Optional pre-shared token for non-visitor runtime checks |

## Marketing Site Embed

The marketing site should load the built loader script (`/embed.js`) and pass tenant context as data attributes:

```html
<script
  src="https://widget.getswyftup.com/embed.js"
  async
  data-swyft-widget-script="true"
  data-workspace-id="tenant_123"
  data-launcher="bubble"
  data-environment="production"
  data-position="bottom-right"
></script>
```

Required:

- `data-workspace-id`: SwyftUp tenant/workspace ID used for widget routing/auth context

Optional:

- `data-launcher`: `bubble` (default), `open`, or `expanded`
- `data-environment`: environment label passed through to widget runtime (for diagnostics)
- `data-position`: launcher placement, accepts `right` / `bottom-right` or `left` / `bottom-left`

Runtime API:

- `window.SwyftUpWidget.setPosition("left" | "right")`
- `window.SwyftUpWidget.getPosition()`
