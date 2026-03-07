# Roadmap

Development is organized into six phases. Each phase builds on the previous one. Items marked ✅ are implemented; items marked ⬜ are planned.

## Phase 1 — Foundations

| Feature | Status | Notes |
|---------|--------|-------|
| Tenant model | ✅ | Multi-tenant isolation with slug, domains, branding, feature flags |
| RBAC | ✅ | Roles, permissions, per-tenant user roles, middleware enforcement |
| Realtime / presence | ✅ | Socket.IO with online/away/busy/offline status and tenant broadcast |
| Notification pipeline | ✅ | In-app notifications, FCM push delivery, device registration |
| Storage abstraction | ✅ | S3 presigned uploads with local filesystem fallback |
| Audit / event model | ✅ | Audit logs for all mutations; analytics event ingestion and summary |

## Phase 2 — Core Messaging

| Feature | Status | Notes |
|---------|--------|-------|
| Conversations | ✅ | Create, list, assign, reassign, close with lead and listing context |
| Messages | ✅ | Send with threading (parentMessageId), sender types (visitor/agent/system) |
| Reactions | ✅ | Emoji reactions with per-user toggle |
| Receipts | ✅ | Delivery and read timestamps per user per message |
| Unread | ✅ | Unread count per conversation via `MessageReceipt` tracking |
| Search | ✅ | Full-text search across lead name, email, phone, listing address, MLS, messages |
| Attachments | ✅ | File attachments with storage key, content type, size |
| Groups / channels | ⬜ | Multi-party conversations and named channels |
| Typing indicators | ⬜ | Real-time typing status broadcast via Socket.IO |

## Phase 3 — Calling

| Feature | Status | Notes |
|---------|--------|-------|
| Outbound calls | ✅ | Telnyx integration scaffolded with dev fallback logging |
| Voice / video signaling | ⬜ | LiveKit integration (env vars defined, implementation pending) |
| Call state | ⬜ | Call session model, status tracking, duration |
| UI controls | ⬜ | In-call mute, hold, transfer, and end controls |
| Reconnect logic | ⬜ | Automatic reconnection on network interruption |
| Call history | ⬜ | Call log with duration, outcome, and recording links |
| Telemetry hooks | ⬜ | Call quality metrics and event tracking |

## Phase 4 — Feed / Social

| Feature | Status | Notes |
|---------|--------|-------|
| Posts | ⬜ | Team activity feed with text and media posts |
| Comments | ⬜ | Threaded comments on posts |
| Reactions | ⬜ | Emoji reactions on posts and comments |
| Privacy controls | ⬜ | Visibility rules for posts and feeds |

## Phase 5 — Admin / Analytics / Security

| Feature | Status | Notes |
|---------|--------|-------|
| Analytics | ✅ | Event tracking and summary aggregation |
| Feature flags | ✅ | Per-tenant feature flags with JSON config |
| Webhooks | ✅ | HMAC-signed delivery with retries, logs, and test delivery |
| Billing | ✅ | Subscription and invoice models (processor integration pending) |
| Admin dashboard | ⬜ | Dedicated admin console for platform management |
| Moderation | ⬜ | Content moderation (ModerationReport model exists, handlers pending) |
| Compliance hooks | ⬜ | Data retention, export, and regulatory integration points |

## Phase 6 — AI Layer

| Feature | Status | Notes |
|---------|--------|-------|
| AI config | ✅ | Per-tenant AI provider configuration model (AIConfig) |
| Chatbot | ⬜ | Automated responses for common lead inquiries |
| Assistant orchestration | ⬜ | AI-assisted agent workflows and suggestions |
| Summarization | ⬜ | Conversation and thread summarization |
| Moderation AI | ⬜ | Automated content screening and flagging |
| Voice bot extension points | ⬜ | AI-powered voice interaction hooks |
