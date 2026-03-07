# Getswyft Website

React + TypeScript dashboard for tenant management, built with Vite.

## Features

- **Login** — multi-provider authentication (Keycloak, Supabase, Firebase) with dev bypass
- **Inbox** — conversation list with tab filtering (unassigned / mine / closed) and full-text search
- **Conversation detail** — message thread with send, emoji reactions, read receipts, and lead info sidebar
- **Routing settings** — office hours, timezone, routing mode (manual / first-available / round-robin), fallback user
- **Team management** — list members with presence indicators, send/resend/revoke invitations, assign roles
- **Webhooks** — create, edit, and delete webhook endpoints; view delivery logs; send test deliveries
- **Analytics** — summary statistics and charts
- **Billing** — subscription details, seat usage, invoice history
- **Profile** — user settings and notification preferences

## Tech stack

- React 19 + TypeScript
- Vite 7 (dev server and build)
- Radix UI (20+ accessible component primitives)
- Tailwind CSS 4
- React Router 7
- React Hook Form + Zod validation
- Recharts (data visualization)
- Socket.IO Client (real-time presence and messaging)
- Sonner (toast notifications)

## Development

```bash
# From the monorepo root
pnpm dev:website
```

The dev server starts at `http://localhost:5173`.

Copy `.env.example` to `.env` and configure the auth provider and API URL. See [docs/env.md](../../docs/env.md) for the full variable reference.
To embed the live SwyftUp widget on marketing pages, set `VITE_SWYFT_WIDGET_SCRIPT_URL`, `VITE_SWYFT_WIDGET_WORKSPACE_ID`, and optionally `VITE_SWYFT_WIDGET_POSITION` (`right` or `left`).

## Testing

```bash
pnpm -C apps/website test       # run once
pnpm -C apps/website test:watch # watch mode
```

## Linting

```bash
pnpm -C apps/website lint
```

## Build

```bash
pnpm -C apps/website build
```

Produces a static build in `dist/` with pre-rendered marketing pages.
The build step also emits `sitemap.xml` and `robots.txt` from the marketing route source-of-truth.
