# Permissions Matrix

This document describes the Role-Based Access Control (RBAC) system used by the Getswyft platform. Every authenticated user is assigned a role, and each role grants a specific set of permissions that govern which features and API endpoints the user can access.

---

## Permission Keys

The platform defines seven permission keys. Each key maps to a dot-notation value used internally for authorization checks.

| Key | Value | Description |
|-----|-------|-------------|
| `tenantManage` | `tenant.manage` | Manage tenant-level settings including routing, billing, webhooks, compliance exports, and AI configuration. |
| `userManage` | `user.manage` | Manage team members, send invitations, and assign or update user roles. |
| `conversationRead` | `conversation.read` | View conversations, messages, channels, feed posts, call history, call sessions, and analytics summaries. |
| `conversationWrite` | `conversation.write` | Send messages, create or update conversations and channels, initiate calls, post to the feed, upload files, manage moderation reports, and use AI chat/assist/voice-bot features. |
| `moderationManage` | `moderation.manage` | List, view, and update moderation reports. Trigger AI-based moderation. |
| `analyticsRead` | `analytics.read` | View analytics summaries, AI interaction logs, and audit logs. |
| `featureFlagManage` | `featureflag.manage` | Create, update, and delete feature flags. |

---

## Roles

Each user is assigned one of the following roles. A role is a named bundle of permissions.

| Role | Internal Name | Permissions |
|------|---------------|-------------|
| **Tenant Admin** | `tenant_admin` | `tenant.manage`, `user.manage`, `conversation.read`, `conversation.write`, `moderation.manage`, `analytics.read`, `featureflag.manage` |
| **Agent** | `agent` | `conversation.read`, `conversation.write` |

> **Note:** Tenant Admins have all seven permissions and full access to every feature. Agents have access only to conversation-related features (reading and writing).

---

## Feature-to-Permission Matrix

The table below maps every platform feature and API endpoint to the permission required to access it. Features marked **(authenticated)** require only a valid authentication token — no specific permission is checked.

### Authentication & Profile

| Feature / Action | API Route | Method | Required Permission |
|---|---|---|---|
| View current user info | `/v1/auth/me` | GET | (authenticated) |
| View profile | `/v1/auth/profile` | GET | (authenticated) |
| Update profile | `/v1/auth/profile` | PATCH | (authenticated) |

### Tenant Management

| Feature / Action | API Route | Method | Required Permission |
|---|---|---|---|
| Get tenant details | `/v1/tenants/current` | GET | (authenticated) |
| Get routing settings | `/v1/tenants/current/settings` | GET | `tenant.manage` |
| Update routing settings | `/v1/tenants/current/settings` | PATCH | `tenant.manage` |
| List webhooks | `/v1/tenants/current/webhooks` | GET | `tenant.manage` |
| Create webhook | `/v1/tenants/current/webhooks` | POST | `tenant.manage` |
| Update webhook | `/v1/tenants/current/webhooks/:id` | PATCH | `tenant.manage` |
| Delete webhook | `/v1/tenants/current/webhooks/:id` | DELETE | `tenant.manage` |
| Test webhook | `/v1/tenants/current/webhooks/:id/test` | POST | `tenant.manage` |
| Get billing info | `/v1/tenants/current/billing` | GET | `tenant.manage` |

### User & Team Management

| Feature / Action | API Route | Method | Required Permission |
|---|---|---|---|
| Get user roles | `/v1/users/me/roles` | GET | (authenticated) |
| List assignable members | `/v1/users/team/assignable` | GET | `conversation.write` |
| List team members | `/v1/users/team` | GET | `user.manage` |
| Send invitation | `/v1/users/team/invitations` | POST | `user.manage` |
| Update member role | `/v1/users/team/members/:userId/role` | PATCH | `user.manage` |

### Conversations

| Feature / Action | API Route | Method | Required Permission |
|---|---|---|---|
| List conversations | `/v1/conversations` | GET | `conversation.read` |
| Get conversation | `/v1/conversations/:id` | GET | `conversation.read` |
| Update conversation | `/v1/conversations/:id` | PATCH | `conversation.write` |
| List messages | `/v1/conversations/:id/messages` | GET | `conversation.read` |
| Send message | `/v1/conversations/:id/messages` | POST | `conversation.write` |
| Mark conversation read | `/v1/conversations/:id/read` | POST | `conversation.read` |
| Initiate call from conversation | `/v1/conversations/:id/call` | POST | `conversation.write` |
| Toggle message reaction | `/v1/messages/:id/reactions` | POST | `conversation.write` |

### Channels

| Feature / Action | API Route | Method | Required Permission |
|---|---|---|---|
| List channels | `/v1/channels` | GET | `conversation.read` |
| Create channel | `/v1/channels` | POST | `conversation.write` |
| Get channel | `/v1/channels/:id` | GET | `conversation.read` |
| Update channel | `/v1/channels/:id` | PATCH | `conversation.write` |
| Add channel member | `/v1/channels/:channelId/members` | POST | `conversation.write` |
| Remove channel member | `/v1/channels/:channelId/members/:userId` | DELETE | `conversation.write` |
| List channel messages | `/v1/channels/:channelId/messages` | GET | `conversation.read` |
| Send channel message | `/v1/channels/:channelId/messages` | POST | `conversation.write` |
| Toggle channel message reaction | `/v1/channels/:channelId/messages/:messageId/reactions` | POST | `conversation.write` |

### Calling

| Feature / Action | API Route | Method | Required Permission |
|---|---|---|---|
| Create call session | `/v1/calls/sessions` | POST | `conversation.write` |
| List call sessions | `/v1/calls/sessions` | GET | `conversation.read` |
| Get call session | `/v1/calls/sessions/:id` | GET | `conversation.read` |
| Update call session | `/v1/calls/sessions/:id` | PATCH | `conversation.write` |
| Add call participant | `/v1/calls/sessions/:id/participants` | POST | `conversation.write` |
| Update call participant | `/v1/calls/sessions/:id/participants` | PATCH | `conversation.write` |
| Remove call participant | `/v1/calls/sessions/:id/participants` | DELETE | `conversation.write` |
| List call history | `/v1/calls/history` | GET | `conversation.read` |
| Submit call telemetry | `/v1/calls/sessions/:id/telemetry` | POST | `conversation.write` |

### Feed

| Feature / Action | API Route | Method | Required Permission |
|---|---|---|---|
| List feed posts | `/v1/feed` | GET | `conversation.read` |
| Create feed post | `/v1/feed` | POST | `conversation.write` |
| Get feed post | `/v1/feed/:id` | GET | `conversation.read` |
| Update feed post | `/v1/feed/:id` | PATCH | `conversation.write` |
| Delete feed post | `/v1/feed/:id` | DELETE | `conversation.write` |
| Add comment | `/v1/feed/:id/comments` | POST | `conversation.write` |
| Delete comment | `/v1/feed/:id/comments` | DELETE | `conversation.write` |
| Toggle reaction | `/v1/feed/:id/reactions` | POST | `conversation.write` |

### Moderation

| Feature / Action | API Route | Method | Required Permission |
|---|---|---|---|
| List moderation reports | `/v1/moderation` | GET | `moderation.manage` |
| Create moderation report | `/v1/moderation` | POST | `conversation.write` |
| Get moderation report | `/v1/moderation/:id` | GET | `moderation.manage` |
| Update moderation report | `/v1/moderation/:id` | PATCH | `moderation.manage` |

### Compliance

| Feature / Action | API Route | Method | Required Permission |
|---|---|---|---|
| List compliance exports | `/v1/compliance/exports` | GET | `tenant.manage` |
| Create compliance export | `/v1/compliance/exports` | POST | `tenant.manage` |
| Get compliance export | `/v1/compliance/exports/:id` | GET | `tenant.manage` |

### AI Features

| Feature / Action | API Route | Method | Required Permission |
|---|---|---|---|
| AI config — list/create/get/update/delete | `/v1/ai/config` | CRUD | `tenant.manage` |
| AI chatbot | `/v1/ai/chat` | POST | `conversation.write` |
| AI summarize | `/v1/ai/summarize` | POST | `conversation.read` |
| AI moderate | `/v1/ai/moderate` | POST | `moderation.manage` |
| AI assist | `/v1/ai/assist` | POST | `conversation.write` |
| AI interactions list | `/v1/ai/interactions` | GET | `analytics.read` |
| AI voice bot | `/v1/ai/voice-bot` | POST | `conversation.write` |

### Notifications

| Feature / Action | API Route | Method | Required Permission |
|---|---|---|---|
| List notifications | `/v1/notifications` | GET | (authenticated) |
| Mark notification read | `/v1/notifications/:id/read` | POST | (authenticated) |
| Register device | `/v1/notifications/devices` | POST | (authenticated) |
| Unregister device | `/v1/notifications/devices` | DELETE | (authenticated) |
| Send test notification | `/v1/notifications/test` | POST | (authenticated) |

### Storage

| Feature / Action | API Route | Method | Required Permission |
|---|---|---|---|
| Presign upload URL | `/v1/storage/presign-upload` | POST | `conversation.write` |
| Upload file | `/v1/storage/upload` | PUT | `conversation.write` |

### Analytics & Audit

| Feature / Action | API Route | Method | Required Permission |
|---|---|---|---|
| Record analytics event | `/v1/analytics/events` | POST | (authenticated) |
| Get analytics summary | `/v1/analytics/summary` | GET | `analytics.read` |
| List audit logs | `/v1/audit-logs` | GET | `tenant.manage` OR `analytics.read` |

---

## Sidebar Navigation Access by Role

The sidebar navigation items visible to each role are determined by the permissions associated with that role.

| Sidebar Item | Required Permission | Tenant Admin | Agent |
|---|---|---|---|
| Dashboard / Home | (authenticated) | ✅ | ✅ |
| Conversations | `conversation.read` | ✅ | ✅ |
| Channels | `conversation.read` | ✅ | ✅ |
| Feed | `conversation.read` | ✅ | ✅ |
| Calls | `conversation.read` | ✅ | ✅ |
| Notifications | (authenticated) | ✅ | ✅ |
| Team Management | `user.manage` | ✅ | ❌ |
| Tenant Settings | `tenant.manage` | ✅ | ❌ |
| Webhooks | `tenant.manage` | ✅ | ❌ |
| Billing | `tenant.manage` | ✅ | ❌ |
| Compliance | `tenant.manage` | ✅ | ❌ |
| AI Configuration | `tenant.manage` | ✅ | ❌ |
| Analytics | `analytics.read` | ✅ | ❌ |
| Audit Logs | `tenant.manage` OR `analytics.read` | ✅ | ❌ |
| Moderation | `moderation.manage` | ✅ | ❌ |
| Feature Flags | `featureflag.manage` | ✅ | ❌ |
| Profile Settings | (authenticated) | ✅ | ✅ |

---

## Notes

- **Authentication-only features** — Several endpoints require only a valid authentication token and do not check for a specific permission. These include viewing your own profile, reading notifications, registering devices, and recording analytics events. Every logged-in user can access these regardless of role.
- **Audit logs** accept either `tenant.manage` or `analytics.read`, meaning both Tenant Admins and any future role with `analytics.read` can view them.
- **Creating a moderation report** requires `conversation.write` (available to Agents), but **reviewing and managing** moderation reports requires `moderation.manage` (Tenant Admin only).
- Permissions are enforced server-side on every API request. The UI hides features for which the user lacks permission, but the API layer is the authoritative access-control boundary.
