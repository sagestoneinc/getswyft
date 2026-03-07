# Getswyft API

Express + Socket.IO backend with multi-tenant foundations, powered by Prisma and PostgreSQL.

## Modules

| Module | Mount point | Routes |
|--------|------------|--------|
| Auth | `/v1/auth` | `GET /me` — current user context |
| Tenants | `/v1/tenants` | `GET /current` — tenant info and feature flags |
| | | `GET /current/settings` — routing settings and fallback candidates |
| | | `PATCH /current/settings` — update routing mode, office hours, timezone |
| | | `GET /current/webhooks` — list webhook endpoints and delivery logs |
| | | `POST /current/webhooks` — create webhook endpoint |
| | | `PATCH /current/webhooks/:id` — update webhook endpoint |
| | | `DELETE /current/webhooks/:id` — delete webhook endpoint |
| | | `POST /current/webhooks/:id/test` — send test delivery |
| | | `GET /current/billing` — subscription and invoice history |
| Users | `/v1/users` | `GET /me/roles` — current user's roles and permissions |
| | | `GET /team/assignable` — teammates available for assignment |
| | | `GET /team` — team members and pending invitations |
| | | `POST /team/invitations` — send email invitation |
| | | `PATCH /team/members/:userId/role` — update member role |
| Messaging | `/v1` | `GET /conversations` — list with filtering and search |
| | | `GET /conversations/:id` — single conversation detail |
| | | `PATCH /conversations/:id` — assign, transfer, close, update notes |
| | | `GET /conversations/:id/messages` — message thread |
| | | `POST /conversations/:id/messages` — send message |
| | | `POST /conversations/:id/read` — mark as read |
| | | `POST /conversations/:id/call` — initiate outbound call |
| | | `POST /messages/:id/reactions` — toggle emoji reaction |
| Notifications | `/v1/notifications` | `GET /` — list user notifications |
| | | `POST /:id/read` — mark notification as read |
| | | `POST /devices` — register push device |
| | | `DELETE /devices` — disable push device |
| | | `POST /test` — send test notification |
| Storage | `/v1/storage` | `POST /presign-upload` — get S3 presigned URL |
| | | `PUT /upload` — upload file directly (local provider) |
| Analytics | `/v1/analytics` | `POST /events` — record analytics event |
| | | `GET /summary` — aggregated analytics |
| Audit | `/v1/audit-logs` | `GET /` — list audit logs with pagination |
| Presence | Socket.IO | `presence:update` — change user status |
| | | `presence:user_status_changed` — broadcast to tenant |

## Middleware

- **Auth** (`middleware/auth.js`) — OIDC/JWT verification with Keycloak, Supabase, and generic provider support
- **Tenant** (`middleware/tenant.js`) — resolves tenant from user membership; enforces tenant isolation
- **RBAC** (`middleware/rbac.js`) — permission-based route protection via `requirePermission()`

## Permissions

| Key | Used by |
|-----|---------|
| `tenant.manage` | Tenant settings, webhooks, billing, audit logs |
| `user.manage` | Team management, invitations, role changes |
| `conversation.read` | List and view conversations and messages |
| `conversation.write` | Send messages, assign, close, upload files, call |
| `moderation.manage` | Moderation reports (scaffolded) |
| `analytics.read` | Analytics summary, audit logs |
| `featureflag.manage` | Feature flag management |

## Development

```bash
# From the monorepo root
cp apps/api/.env.example apps/api/.env
pnpm -C apps/api prisma:generate
pnpm -C apps/api prisma:migrate:deploy
pnpm -C apps/api prisma:seed
pnpm dev:api
```

The server starts at `http://localhost:8080`.

Health check:

```bash
curl http://localhost:8080/health
```

## Testing

```bash
pnpm -C apps/api test        # run once
pnpm -C apps/api test:watch  # watch mode
```

## Database

Prisma manages the PostgreSQL schema. Key commands:

```bash
pnpm -C apps/api prisma:generate        # regenerate client after schema changes
pnpm -C apps/api prisma:migrate:deploy  # apply pending migrations
pnpm -C apps/api prisma:seed            # seed development data
```

## Environment variables

See [docs/env.md](../../docs/env.md) for the full reference.
