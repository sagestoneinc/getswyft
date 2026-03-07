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
| Groups / channels | ✅ | Channel CRUD, membership management, channel messaging with threading and reactions (`/v1/channels`) |
| Typing indicators | ✅ | Real-time `typing:start`/`typing:stop` events via Socket.IO with conversation and channel support |

## Phase 3 — Calling

| Feature | Status | Notes |
|---------|--------|-------|
| Outbound calls | ✅ | Telnyx integration with dev fallback logging |
| Voice / video signaling | ✅ | CallSession model with LiveKit room name generation, voice/video call types (`/v1/calls/sessions`) |
| Call state | ✅ | CallSession with RINGING/ANSWERED/BUSY/FAILED/ENDED status tracking, duration calculation |
| UI controls | ✅ | Participant state management — mute, hold per participant (`/v1/calls/sessions/:id/participants/:userId`) |
| Reconnect logic | ✅ | Participant join/leave tracking with timestamps for reconnection support |
| Call history | ✅ | Completed call listing with duration, participants, and recording URLs (`/v1/calls/history`) |
| Telemetry hooks | ✅ | Call quality metrics and event tracking per session (`/v1/calls/sessions/:id/telemetry`) |

## Phase 4 — Feed / Social

| Feature | Status | Notes |
|---------|--------|-------|
| Posts | ✅ | Team activity feed with text and media posts, pinning (`/v1/feed`) |
| Comments | ✅ | Threaded comments on posts with parent comment support |
| Reactions | ✅ | Emoji reactions on posts with per-user toggle |
| Privacy controls | ✅ | Post visibility (PUBLIC/TEAM/PRIVATE) with author-only access for private posts |

## Phase 5 — Admin / Analytics / Security

| Feature | Status | Notes |
|---------|--------|-------|
| Analytics | ✅ | Event tracking and summary aggregation |
| Feature flags | ✅ | Per-tenant feature flags with JSON config |
| Webhooks | ✅ | HMAC-signed delivery with retries, logs, and test delivery |
| Billing | ✅ | Subscription and invoice models (processor integration pending) |
| Admin dashboard | ✅ | Tenant settings, team management, billing, webhooks, moderation, and compliance in one admin surface |
| Moderation | ✅ | Content moderation reports with status workflow (OPEN → REVIEWING → RESOLVED/DISMISSED) (`/v1/moderation`) |
| Compliance hooks | ✅ | Data export requests with status tracking (PENDING → PROCESSING → COMPLETED/FAILED) (`/v1/compliance/exports`) |

## Phase 6 — AI Layer

| Feature | Status | Notes |
|---------|--------|-------|
| AI config | ✅ | Per-tenant AI provider configuration with CRUD (`/v1/ai/config`) |
| Chatbot | ✅ | Chatbot endpoint with tenant AI config check and interaction logging (`/v1/ai/chat`) |
| Assistant orchestration | ✅ | AI-assisted agent workflows with conversation/channel context (`/v1/ai/assist`) |
| Summarization | ✅ | Conversation and channel message summarization with auto-input loading (`/v1/ai/summarize`) |
| Moderation AI | ✅ | Automated content screening endpoint with flagging support (`/v1/ai/moderate`) |
| Voice bot extension points | ✅ | Voice bot interaction endpoint with call session context (`/v1/ai/voice-bot`) |
