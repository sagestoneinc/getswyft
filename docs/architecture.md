# Getswyft Architecture

## Overview

Getswyft is a multi-tenant SaaS communications platform for real estate professionals. The system is organized as a pnpm monorepo with four deployable applications and one shared package.

```
apps/
  api/        – Express + Socket.IO backend (Prisma + PostgreSQL)
  website/    – React + TypeScript dashboard (Vite)
  agent/      – Agent console runtime shell (Vite)
  widget/     – Embeddable visitor widget (Vite)
packages/
  shared/     – TypeScript contracts and permission constants
```

## Backend architecture

### Middleware pipeline

Every API request flows through a layered middleware stack:

1. **Request context** (`lib/request-context.js`) — attaches a unique request ID and structured logger to each request.
2. **Auth** (`middleware/auth.js`) — verifies the JWT/OIDC bearer token (Keycloak, Supabase, or generic provider). In development, `DEV_AUTH_BYPASS=true` allows header-based user simulation via `X-Dev-User-*` headers.
3. **Tenant** (`middleware/tenant.js`) — resolves the tenant from the authenticated user's membership and enforces tenant isolation.
4. **RBAC** (`middleware/rbac.js`) — checks the user's permissions against the required permission for the endpoint using `requirePermission()`.

### Route modules

Each domain is encapsulated in its own route module under `src/modules/`:

| Module | Mount point | Description |
|--------|------------|-------------|
| `auth` | `/v1/auth` | Returns the current user context (`/me`) |
| `tenants` | `/v1/tenants` | Tenant settings, branding, feature flags, routing config, webhooks, billing |
| `users` | `/v1/users` | Team management, invitations, role assignment, assignable members |
| `messaging` | `/v1` | Conversations, messages, reactions, read receipts, attachments, outbound calls |
| `notifications` | `/v1/notifications` | In-app notifications, push device registration, test notifications |
| `storage` | `/v1/storage` | S3 presigned uploads and local file uploads |
| `analytics` | `/v1/analytics` | Event ingestion and summary aggregation |
| `audit` | `/v1/audit-logs` | Audit log listing with pagination |
| `presence` | Socket.IO | Real-time user presence (online/away/busy/offline) |

### Library modules

Shared utilities live under `src/lib/`:

| Module | Purpose |
|--------|---------|
| `db.js` | Prisma client singleton |
| `redis.js` | ioredis client singleton |
| `auth-tokens.js` | OIDC token verification and JWKS resolution |
| `access-context.js` | Loads user roles, permissions, and tenant membership; auto-provisions new users |
| `email.js` | Resend integration with dev fallback logging |
| `push.js` | FCM push notifications with OAuth token caching |
| `telephony.js` | Telnyx outbound call initiation with dev fallback |
| `webhooks.js` | Webhook dispatch with HMAC signing, retries, and delivery tracking |
| `analytics.js` | Analytics event recording helper |
| `audit.js` | Audit log creation helper |
| `logger.js` | Structured JSON logger |
| `request-context.js` | AsyncLocalStorage-based request context |

### Real-time (Socket.IO)

`modules/presence/presence.socket.js` handles WebSocket connections:

- Authenticates socket connections using the same JWT/OIDC flow as HTTP.
- Tracks presence sessions in the database (`PresenceSession` model).
- Broadcasts `presence:user_status_changed` events to all users in the same tenant.
- Handles disconnection cleanup with `lastSeenAt` timestamps.

## Data model

The Prisma schema defines 28 models across these domains:

### Core entities
- **Tenant** — multi-tenant root with slug, status, and timestamps
- **TenantDomain** — custom domains per tenant with primary flag
- **TenantBranding** — primary color, logo URL, support email
- **TenantFeatureFlag** — per-tenant feature flags with JSON config
- **TenantRoutingSettings** — routing mode (manual/first-available/round-robin), office hours, timezone, fallback user

### Identity and access
- **User** — core user with external auth ID, email, display name, avatar
- **Profile** — extended profile (phone, timezone, locale, metadata)
- **Role** — system and custom roles with permission sets
- **Permission** — fine-grained permission definitions
- **RolePermission** — role-to-permission junction
- **UserRole** — user-to-role-in-tenant junction (unique per tenant+user+role)

### Conversations
- **Conversation** — lead conversations with contact info (name, email, phone), listing info (address, price, beds, baths, sqft, MLS), assignment, status, notes, after-hours flag
- **ConversationMessage** — messages with sender type (visitor/agent/system), threading via parentMessageId, metadata
- **MessageReaction** — emoji reactions (unique per message+user+emoji)
- **MessageReceipt** — delivery and read timestamps per user per message
- **MessageAttachment** — file attachments with storage key, content type, size

### Team management
- **TenantInvitation** — email invitations with token, status (pending/accepted/revoked/expired), expiry
- **PresenceSession** — real-time presence tracking with status and connection ID

### Integrations
- **WebhookEndpoint** — tenant webhook URLs with event type filters, status, signing secret
- **WebhookDelivery** — delivery logs with status code, response body, duration
- **Notification** — in-app notifications with type, title, body, payload, read status
- **NotificationDevice** — FCM device tokens per user per tenant

### Billing
- **BillingSubscription** — per-tenant subscription (provider, plan, interval, status, seat pricing)
- **BillingInvoice** — invoices with number, status, amounts, hosted URL

### Observability
- **AuditLog** — action, entity type/ID, metadata, IP address, user agent
- **AnalyticsEvent** — event name, category, value, metadata, timestamp

### Scaffolded
- **AIConfig** — per-tenant AI provider configuration (model exists, integration pending)
- **ModerationReport** — content moderation reports (model exists, handlers pending)

## Security

### Implemented
- JWT/OIDC token verification with JWKS endpoint support
- Multi-provider auth (Keycloak, Supabase, Firebase)
- Cross-tenant access prevention at the middleware level
- Role-based permission enforcement on every protected endpoint
- Audit logging of all sensitive operations
- Tenant-aware database queries (no cross-tenant data leaks)
- Webhook payload signing with HMAC secrets
- Zod validation on all request bodies
- Request tracing with structured logging
- Dev auth bypass gated behind `DEV_AUTH_BYPASS=true` (disabled in production)

### Not yet implemented
- Rate limiting (infrastructure present, enforcement pending)
- CSRF protection
- API key authentication for external integrations

## Frontend architecture

The website app (`apps/website`) is a React 19 + TypeScript single-page application built with Vite. Key architectural patterns:

- **Auth provider** — wraps the app with Keycloak, Supabase, or Firebase authentication based on `VITE_AUTH_PROVIDER`
- **Tenant context** — fetches and provides tenant details after authentication
- **Socket.IO provider** — manages the real-time WebSocket connection and presence subscriptions
- **API client** — centralized fetch wrapper with auth token injection
- **Radix UI** — headless component primitives for accessible UI (20+ component libraries)
- **Tailwind CSS 4** — utility-first styling
- **React Router 7** — client-side routing with layout nesting
- **React Hook Form** — form state management with Zod validation
- **Recharts** — analytics charts and data visualization

## Deployment

### Docker
The root `Dockerfile` supports multi-service builds. The target service is selected at runtime via `RAILWAY_SERVICE_NAME` (api, website, agent, widget).

### Railway
`railway.json` configures the Dockerfile builder. Each service is deployed as a separate Railway service within the same project, all pointing at the same repository and branch.

### Nixpacks
`nixpacks.toml` provides an alternative deployment path. Each app's `nixpacks.toml` handles setup (corepack + pnpm), install, build, and start phases.

See [RAILWAY_SETUP.md](RAILWAY_SETUP.md) for step-by-step deployment instructions.
