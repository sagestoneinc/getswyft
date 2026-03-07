# Getswyft

Multi-tenant communications platform for real estate professionals. Agents can track, manage, and respond to lead conversations with full tenant isolation, role-based access control, and real-time presence awareness.

## Monorepo structure

| Path | Description |
|------|-------------|
| `apps/api` | Express + Socket.IO backend API (Prisma, PostgreSQL, Redis) |
| `apps/website` | React + TypeScript dashboard for tenant management |
| `apps/agent` | Agent console runtime shell (React + Vite) |
| `apps/widget` | Embeddable visitor widget runtime shell (React + Vite) |
| `packages/shared` | Shared TypeScript contracts and permission constants |
| `docs/` | Architecture, environment variables, and deployment guides |

## What's implemented

### Backend (apps/api)

- **Authentication** — OIDC/JWT verification with Keycloak, Supabase, and Firebase support; dev auth bypass for local development
- **Multi-tenancy** — tenant resolution, membership enforcement, domain management, branding, and feature flags
- **RBAC** — role-based permission middleware (`tenant.manage`, `user.manage`, `conversation.read`, `conversation.write`, `moderation.manage`, `analytics.read`, `featureflag.manage`)
- **Conversations & messaging** — create, list, assign, reassign, close conversations; send messages with threading, emoji reactions, read receipts, and attachments; full-text search across leads, listings, and messages
- **Team management** — list members, invite via email (7-day expiry), resend/revoke invitations, role assignment
- **Presence** — real-time online/away/busy/offline status via Socket.IO
- **Notifications** — in-app notifications with FCM push delivery and device registration
- **Webhooks** — CRUD management of tenant webhook endpoints with HMAC signing, retry logic, delivery logs, and test delivery
- **File storage** — S3 presigned uploads with local filesystem fallback
- **Analytics** — event tracking and summary aggregation
- **Audit logging** — automatic audit trail for all data mutations with IP and user-agent tracking
- **Billing** — subscription and invoice models with seat-based pricing (processor integration scaffolded)
- **Telephony** — Telnyx outbound call initiation (scaffolded with fallback logging)
- **Email** — Resend integration for team invitation emails with dev fallback logging

### Frontend (apps/website)

- Login page with multi-provider auth (Keycloak, Supabase, Firebase)
- Inbox with conversation list, tab filtering (unassigned/mine/closed), and full-text search
- Conversation detail view with message thread, reactions, read receipts, and lead sidebar
- Routing settings page (office hours, timezone, routing mode, fallback user)
- Team management page with presence indicators, invitations, and role editing
- Webhooks management page with delivery logs and test delivery
- Analytics dashboard with charts (Recharts)
- Billing page with subscription and invoice history
- Profile and notification preferences
- Real-time updates via Socket.IO

### Shared (packages/shared)

- `permissions.ts` — permission key constants used by API middleware and frontend guards
- `contracts.ts` — TypeScript interfaces for API response shapes (`AuthMeResponse`, `TenantCurrentResponse`, `NotificationListResponse`, `RealtimePresenceEvent`)

## Tech stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 |
| API framework | Express 4 + Socket.IO 4 |
| Database | PostgreSQL + Prisma 6 |
| Cache | Redis (ioredis) |
| Auth | JWT / OIDC (jose) — Keycloak, Supabase, Firebase |
| Validation | Zod |
| Frontend | React 19 + TypeScript + Vite 7 |
| UI library | Radix UI + Tailwind CSS 4 |
| Charts | Recharts |
| Forms | React Hook Form |
| Email | Resend |
| Push | Firebase Cloud Messaging |
| Telephony | Telnyx |
| Storage | AWS S3 |
| Package manager | pnpm 9 |
| Deployment | Docker / Railway / Nixpacks |

## Run locally

```bash
pnpm install

# Copy environment files
cp apps/api/.env.example apps/api/.env
cp apps/website/.env.example apps/website/.env

# Set up the database
pnpm -C apps/api prisma:generate
pnpm -C apps/api prisma:migrate:deploy
pnpm -C apps/api prisma:seed

# Start the API (http://localhost:8080)
pnpm dev:api

# In a separate terminal — start the website (http://localhost:5173)
pnpm dev:website
```

Health check:

```bash
curl http://localhost:8080/health
```

## Testing

```bash
# API tests
pnpm -C apps/api test

# Website tests
pnpm -C apps/website test

# Website linting
pnpm -C apps/website lint
```

## Deploy to Railway

This repo includes a root `Dockerfile` and `railway.json`. Deploy each service by setting `RAILWAY_SERVICE_NAME`:

- `api` (or `getswyft`)
- `website`
- `agent`
- `widget`

```bash
railway link   # choose the correct project/service
railway up
```

See [docs/RAILWAY_SETUP.md](docs/RAILWAY_SETUP.md) for detailed deployment instructions.

## Documentation

- [Architecture overview](docs/architecture.md)
- [Environment variables](docs/env.md)
- [Railway deployment](docs/RAILWAY_SETUP.md)
