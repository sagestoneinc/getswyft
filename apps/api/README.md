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
| Channels | `/v1/channels` | `GET /` — list channels with member counts |
| | | `POST /` — create channel |
| | | `GET /:channelId` — channel details with members |
| | | `PATCH /:channelId` — update channel (name, description, topic, archive) |
| | | `POST /:channelId/members` — add member |
| | | `DELETE /:channelId/members/:userId` — remove member |
| | | `GET /:channelId/messages` — list channel messages |
| | | `POST /:channelId/messages` — send channel message |
| | | `POST /:channelId/messages/:messageId/reactions` — toggle reaction |
| Calling | `/v1/calls` | `POST /sessions` — initiate call session |
| | | `GET /sessions` — list call sessions |
| | | `GET /sessions/:sessionId` — call session details |
| | | `PATCH /sessions/:sessionId` — update call status (answer, end) |
| | | `POST /sessions/:sessionId/participants` — add participant |
| | | `PATCH /sessions/:sessionId/participants/:userId` — mute, hold |
| | | `DELETE /sessions/:sessionId/participants/:userId` — remove participant |
| | | `GET /history` — completed call history |
| | | `POST /sessions/:sessionId/telemetry` — record telemetry event |
| Feed | `/v1/feed` | `GET /` — list posts |
| | | `POST /` — create post |
| | | `GET /:postId` — post with comments and reactions |
| | | `PATCH /:postId` — update post |
| | | `DELETE /:postId` — delete post |
| | | `POST /:postId/comments` — add comment |
| | | `DELETE /:postId/comments/:commentId` — delete comment |
| | | `POST /:postId/reactions` — toggle reaction |
| Moderation | `/v1/moderation` | `GET /` — list reports with status filter |
| | | `POST /` — create moderation report |
| | | `GET /:reportId` — report details |
| | | `PATCH /:reportId` — update report status |
| Compliance | `/v1/compliance` | `GET /exports` — list data exports |
| | | `POST /exports` — request data export |
| | | `GET /exports/:exportId` — export details |
| AI | `/v1/ai` | `GET /config` — list AI configurations |
| | | `PUT /config/:key` — create/update AI configuration |
| | | `DELETE /config/:key` — delete AI configuration |
| | | `POST /chat` — chatbot endpoint |
| | | `POST /summarize` — conversation/channel summarization |
| | | `POST /moderate` — content moderation AI |
| | | `POST /assist` — assistant orchestration |
| | | `GET /interactions` — list AI interactions |
| | | `POST /voice-bot` — voice bot extension point |
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
| | | `typing:start` — broadcast typing start |
| | | `typing:stop` — broadcast typing stop |
| | | `channel:join` — join channel room |
| | | `channel:leave` — leave channel room |
| | | `presence:user_status_changed` — broadcast to tenant |

## Middleware

- **Auth** (`middleware/auth.js`) — OIDC/JWT verification with Keycloak, Supabase, and generic provider support
- **Tenant** (`middleware/tenant.js`) — resolves tenant from user membership; enforces tenant isolation
- **RBAC** (`middleware/rbac.js`) — permission-based route protection via `requirePermission()`

## Permissions

| Key | Used by |
|-----|---------|
| `tenant.manage` | Tenant settings, webhooks, billing, audit logs, AI config, compliance exports |
| `user.manage` | Team management, invitations, role changes |
| `conversation.read` | List and view conversations, messages, channels, call sessions, posts, AI summarization |
| `conversation.write` | Send messages, assign, close, upload files, call, create channels/posts, chatbot, assistant |
| `moderation.manage` | Moderation reports, AI content moderation, delete others' posts |
| `analytics.read` | Analytics summary, audit logs, AI interaction history |
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

If your shell is already inside `apps/api` (for example `/app/apps/api` in Railway), do not use `--dir apps/api`.

```bash
# From inside apps/api
pnpm run prisma:generate
pnpm run prisma:migrate:deploy
pnpm run prisma:seed
pnpm run supabase:migrate
pnpm run supabase:migrate:status
```

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
# from monorepo root
pnpm -C apps/api prisma:generate        # regenerate client after schema changes
pnpm -C apps/api prisma:migrate:deploy  # apply pending migrations
pnpm -C apps/api prisma:seed            # seed development data
pnpm -C apps/api db:sync                # apply Prisma + Supabase migrations together
pnpm -C apps/api db:sync:status         # strict status check for both databases
pnpm -C apps/api supabase:migrate       # apply Supabase SQL migrations
pnpm -C apps/api supabase:migrate:status
```

Or use root convenience scripts:

```bash
pnpm run db:prisma:generate
pnpm run db:prisma:migrate:deploy
pnpm run db:prisma:seed
pnpm run db:sync
pnpm run db:sync:status
pnpm run db:supabase:migrate
pnpm run db:supabase:migrate:status
```

## Environment variables

See [docs/env.md](../../docs/env.md) for the full reference.
