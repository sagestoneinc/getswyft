# Tenant Admin Guide

## Overview

As a **Tenant Admin**, you have full control over your organization's Getswyft workspace. Your responsibilities include configuring how conversations are routed to agents, managing your team, setting up integrations, monitoring performance through analytics, and ensuring compliance. You hold all platform permissions (`tenant.manage`, `user.manage`, `conversation.read`, `conversation.write`, `moderation.manage`, `analytics.read`, `featureflag.manage`), giving you access to every feature in the system.

This guide walks you through each administrative capability, from initial setup to ongoing operations.

---

## Initial Setup Checklist

Complete these steps when first setting up your Getswyft workspace:

1. **Configure routing** — Set how incoming conversations are assigned to agents.
2. **Invite your team** — Add agents and additional admins to your workspace.
3. **Set up webhooks** — Connect external systems to receive real-time event notifications.
4. **Configure branding** — Add your logo, brand color, and support email.
5. **Review feature flags** — Enable or disable optional platform features for your tenant.
6. **Set up AI providers** — Configure AI capabilities such as chatbot, summarization, and moderation.

---

## Routing Configuration

**Navigate to:** `/app/routing`
**Required permission:** `tenant.manage`

Routing determines how new conversations are assigned to your agents. The routing settings page lets you configure the assignment mode, office hours, and fallback behavior.

### Routing Modes

| Mode | Behavior |
|------|----------|
| **Manual** | Conversations arrive as unassigned. Agents or admins manually pick them up from the Unassigned tab. |
| **First Available** | Automatically assigns each new conversation to the first available agent. |
| **Round Robin** | Distributes conversations evenly across all available agents in a rotating fashion. |

### Office Hours

Office hours control when automatic routing is active:

- **Enable/Disable** — Toggle office hours enforcement on or off (enabled by default).
- **Timezone** — Set the timezone for your office (defaults to `America/Chicago`).
- **Start Time** — The time your office opens (defaults to `09:00`).
- **End Time** — The time your office closes (defaults to `18:00`).

Conversations that arrive outside of office hours are flagged with `afterHours: true` and follow fallback behavior.

### Fallback Agent

Designate a fallback agent who receives conversations when no other agents are available or when conversations arrive outside office hours. Set the fallback agent by selecting a team member from the dropdown.

### Steps to Configure Routing

1. Go to `/app/routing`.
2. Select a routing mode from the **Mode** dropdown.
3. Toggle **Office Hours** on or off.
4. If enabled, set **Start Time**, **End Time**, and **Timezone**.
5. Select a **Fallback Agent** from the team member list.
6. Click **Save**.

> **Tip:** Start with **Manual** mode during onboarding so agents can get comfortable with the inbox before enabling auto-assignment.

---

## Team Management

**Navigate to:** `/app/team`
**Required permission:** `user.manage`

### Inviting Members

1. Go to `/app/team`.
2. Click **Invite Member**.
3. Enter the person's email address.
4. Select a role:
   - **Tenant Admin** — Full access to all administrative features and conversations.
   - **Agent** — Access to inbox, conversations, channels, calling, feed, notifications, and profile.
5. Click **Send Invitation**.

The invitee receives an email with a unique invitation link. Invitations expire after **7 days**. You can track invitation status on the team page.

### Invitation Statuses

| Status | Meaning |
|--------|---------|
| **Pending** | Invitation sent, awaiting acceptance. |
| **Accepted** | Invitee has joined the workspace. |
| **Revoked** | Admin manually cancelled the invitation. |
| **Expired** | 7-day window elapsed without acceptance. |

### Assigning Roles

Each team member has one role per tenant. To change a member's role, update their role assignment from the team management page. Promoting an agent to admin grants them all permissions; demoting an admin to agent restricts them to `conversation.read` and `conversation.write`.

### Removing Members

To remove a team member, locate them in the member list and deactivate their account. Deactivated users can no longer access the workspace.

> **Tip:** Revoke pending invitations for people who no longer need access before the 7-day expiry.

---

## Webhooks Setup

**Navigate to:** `/app/webhooks`
**Required permission:** `tenant.manage`

Webhooks push real-time event notifications to your external systems (CRMs, analytics platforms, custom integrations) whenever something happens in your workspace.

### Creating a Webhook Endpoint

1. Go to `/app/webhooks`.
2. Click **Add Endpoint**.
3. Enter the destination **URL** (must be HTTPS).
4. Add an optional **Description** for reference.
5. Select the **Event Types** you want to receive (e.g., `conversation.created`, `message.received`, `conversation.assigned`).
6. Click **Create**.

A unique **Signing Secret** is generated for each endpoint. Use this secret to verify the HMAC signature on incoming webhook payloads and ensure they originate from Getswyft.

### Managing Endpoints

- **Enable/Disable** — Toggle an endpoint between `ACTIVE` and `DISABLED` status without deleting it.
- **Edit** — Update the URL, description, or subscribed event types.
- **Delete** — Permanently remove the endpoint.

### Testing Webhooks

Use the **Send Test** feature to fire a sample event to your endpoint. This helps verify your receiver is correctly processing payloads before going live.

### Monitoring Deliveries

Each webhook endpoint has a delivery log showing:

| Field | Description |
|-------|-------------|
| **Event Type** | The event that triggered the delivery. |
| **Status** | `PENDING`, `SUCCESS`, or `FAILED`. |
| **Status Code** | The HTTP response code returned by your endpoint. |
| **Duration** | Round-trip time in milliseconds. |
| **Request ID** | Unique identifier for the delivery attempt. |
| **Payload** | The JSON body that was sent. |
| **Response Body** | The response returned by your endpoint. |

Review delivery logs regularly to catch failures. The `lastDeliveredAt` and `lastErrorAt` timestamps on each endpoint provide a quick health check.

> **Tip:** Start by subscribing to a few critical events, then expand as your integrations mature.

---

## Analytics Dashboard

**Navigate to:** `/app/analytics`
**Required permission:** `analytics.read`

The analytics dashboard provides a high-level view of your workspace performance with key metrics and visual charts.

### KPIs

| Metric | Description |
|--------|-------------|
| **Total Conversations** | Count of all conversations in the selected period. |
| **Avg Response Time** | Average time between a visitor's message and the first agent reply. |
| **Lead Conversion %** | Percentage of conversations that converted to qualified leads. |
| **Active Agents** | Number of agents currently online and available. |

### Charts

| Chart | Type | Shows |
|-------|------|-------|
| **Conversation Volume** | Bar chart | Number of conversations over time. |
| **Response Time** | Line chart | Trend of average response time over the period. |
| **Lead Source** | Pie chart | Breakdown of where leads originate. |

### Date Ranges

Filter analytics data using preset date ranges:

- **7 days** — Last week snapshot.
- **30 days** — Monthly view.
- **90 days** — Quarterly trend.

### Interpreting the Data

- A rising **Avg Response Time** may indicate understaffing or routing issues. Consider adding agents or switching to **Round Robin** routing.
- Low **Lead Conversion %** might signal a need for better follow-up workflows or AI-assisted responses.
- Use the **Lead Source** chart to identify which channels drive the most valuable leads.

> **Tip:** Check analytics weekly to spot trends early. Compare 30-day and 90-day views to identify seasonal patterns.

---

## Billing Management

**Navigate to:** `/app/billing`
**Required permission:** `tenant.manage`

The billing page displays your current subscription plan and invoice history.

### Available Information

- **Current Plan** — Your active subscription tier and its features.
- **Invoices** — List of past invoices with dates, amounts, and payment status.

> **Note:** The payment processor integration is currently pending. Subscription changes and payment method updates will be available once the processor is connected. Contact support for billing changes in the interim.

---

## Moderation Workflows

**Endpoint:** `GET /v1/moderation`, `POST /v1/moderation`, `PATCH /v1/moderation/:reportId`
**Required permission:** `moderation.manage`

> **Note:** Moderation is currently API-driven. A dedicated UI may be added in a future release.

### Report Lifecycle

Moderation reports follow this workflow:

```
OPEN → REVIEWING → RESOLVED
                 ↘ DISMISSED
```

1. **OPEN** — A report is created (by an agent or via AI moderation) against a target (message, user, etc.).
2. **REVIEWING** — An admin picks up the report for review.
3. **RESOLVED** — The admin takes action and closes the report.
4. **DISMISSED** — The admin determines no action is needed.

### Report Fields

| Field | Description |
|-------|-------------|
| `targetType` | What was reported (e.g., message, user). |
| `targetId` | ID of the reported item. |
| `reason` | Why it was reported. |
| `details` | Additional context (JSON). |
| `reviewerUserId` | Admin who reviewed the report. |
| `reviewNote` | Admin's notes on the resolution. |

### Steps to Review a Report

1. `GET /v1/moderation` — List all reports, optionally filtering by status.
2. `PATCH /v1/moderation/:reportId` — Update status to `REVIEWING` and assign yourself.
3. Investigate the reported content.
4. `PATCH /v1/moderation/:reportId` — Set status to `RESOLVED` or `DISMISSED` with a review note.

### AI Moderation

AI moderation can automatically flag content. Use `POST /v1/ai/moderate` to run content through the AI moderation pipeline. Flagged items create moderation reports that follow the same workflow.

---

## Compliance Exports

**Endpoint:** `GET /v1/compliance/exports`, `POST /v1/compliance/exports`, `GET /v1/compliance/exports/:exportId`
**Required permission:** `tenant.manage`

> **Note:** Compliance exports are API-driven.

### Export Types

| Type | Description |
|------|-------------|
| `FULL_DATA` | Complete data export for the tenant. |
| `CONVERSATIONS` | All conversations and messages. |
| `AUDIT_LOGS` | Full audit trail. |
| `USERS` | User data and profiles. |

### Export Status Flow

```
PENDING → PROCESSING → COMPLETED
                     ↘ FAILED
```

### Steps to Request an Export

1. `POST /v1/compliance/exports` — Specify the `exportType`.
2. The export enters `PENDING` status, then moves to `PROCESSING`.
3. `GET /v1/compliance/exports/:exportId` — Poll for status.
4. Once `COMPLETED`, download via the `fileUrl` or `storageKey` provided.

> **Tip:** Schedule regular `FULL_DATA` exports for disaster recovery and compliance audits.

---

## AI Configuration

**Endpoint:** `GET /v1/ai/config`, `PUT /v1/ai/config/:key`, `DELETE /v1/ai/config/:key`
**Required permission:** `tenant.manage`

> **Note:** AI configuration is API-driven.

### Configuration Model

Each AI configuration entry has:

| Field | Description |
|-------|-------------|
| `key` | Unique identifier for the AI capability (per tenant). |
| `provider` | AI provider name (e.g., OpenAI, Anthropic). |
| `config` | Provider-specific settings (JSON object — API keys, model names, parameters). |
| `isEnabled` | Toggle the capability on or off. |

### AI Capabilities

| Capability | Endpoint | Description |
|------------|----------|-------------|
| **Chatbot** | `POST /v1/ai/chat` | AI-powered responses to visitor queries. |
| **Summarization** | `POST /v1/ai/summarize` | Summarize conversation threads. |
| **Moderation** | `POST /v1/ai/moderate` | Automated content moderation. |
| **Assistant** | `POST /v1/ai/assist` | Agent-facing AI assistant for suggested replies. |
| **Voice Bot** | `POST /v1/ai/voice-bot` | AI voice interaction capability. |

### Steps to Set Up AI

1. `PUT /v1/ai/config/:key` — Create a configuration entry with a `key`, `provider`, `config` (including credentials), and set `isEnabled: true`.
2. Test the capability using the relevant endpoint (e.g., `POST /v1/ai/chat`).
3. Review AI interactions at `GET /v1/ai/interactions` to monitor usage, token consumption, and response quality.

### AI Interaction Logging

Every AI interaction is logged with:

- Interaction type (`CHATBOT`, `ASSISTANT`, `SUMMARIZATION`, `MODERATION`, `VOICE_BOT`)
- Input and output text
- Model and provider used
- Tokens consumed and duration

Use `GET /v1/ai/interactions` to review these logs.

---

## Branding

**Required permission:** `tenant.manage`

> **Note:** Branding configuration is managed via the `TenantBranding` model. Depending on your deployment, this may be accessible through `GET/PATCH /v1/tenants/current` endpoints or require direct configuration.

### Branding Fields

| Field | Description | Example |
|-------|-------------|---------|
| `primaryColor` | Hex color code for your brand. | `#2563EB` |
| `logoUrl` | URL to your organization's logo image. | `https://cdn.example.com/logo.png` |
| `supportEmail` | Support contact email displayed to visitors. | `support@yourcompany.com` |

These values are used in the visitor-facing widget and communications to maintain consistent branding.

---

## Feature Flags

**Required permission:** `featureflag.manage`

> **Note:** Feature flags are per-tenant configuration entries, typically managed by administrators or internal operations.

### Feature Flag Model

| Field | Description |
|-------|-------------|
| `key` | Unique flag identifier within the tenant. |
| `enabled` | Whether the feature is active (`true`/`false`, defaults to `false`). |
| `config` | Optional JSON configuration for the feature. |

Feature flags allow you to toggle platform capabilities on or off for your workspace without code changes. Common uses include enabling beta features, controlling access to experimental AI capabilities, or turning off modules during maintenance.

---

## Audit Logs

**Endpoint:** `GET /v1/audit-logs`
**Required permission:** `analytics.read`

> **Note:** Audit logs are API-driven.

Audit logs provide a chronological record of actions taken within your workspace. Use them to:

- Track who made configuration changes and when.
- Investigate security incidents.
- Satisfy compliance and regulatory requirements.

### Querying Audit Logs

`GET /v1/audit-logs` returns a paginated list of audit entries. Filter by date range, user, or action type as supported by the API.

> **Tip:** Review audit logs regularly, especially after team changes or security events.

---

## Quick Reference

### Admin Pages & Features

| Feature | Location | Permission | Notes |
|---------|----------|------------|-------|
| Routing Settings | `/app/routing` | `tenant.manage` | Modes, office hours, fallback |
| Webhooks | `/app/webhooks` | `tenant.manage` | CRUD, testing, delivery logs |
| Analytics Dashboard | `/app/analytics` | `analytics.read` | KPIs, charts, date ranges |
| Team Management | `/app/team` | `user.manage` | Members, invitations, roles |
| Billing | `/app/billing` | `tenant.manage` | Subscription, invoices |
| Moderation | `GET/POST/PATCH /v1/moderation` | `moderation.manage` | API-driven |
| Compliance Exports | `GET/POST /v1/compliance/exports` | `tenant.manage` | API-driven |
| AI Configuration | `GET/PUT/DELETE /v1/ai/config` | `tenant.manage` | API-driven |
| AI Interactions | `GET /v1/ai/interactions` | `analytics.read` | API-driven |
| Audit Logs | `GET /v1/audit-logs` | `analytics.read` | API-driven |
| Branding | `TenantBranding` model | `tenant.manage` | Via API or direct config |
| Feature Flags | `TenantFeatureFlag` model | `featureflag.manage` | Per-tenant toggles |
| Tenant Domains | `TenantDomain` model | `tenant.manage` | Domain management |

### Role Summary

| Role | Permissions | Access |
|------|-------------|--------|
| **Tenant Admin** | All permissions | Routing, webhooks, analytics, team, billing, moderation, compliance, AI config, audit logs, branding, feature flags |
| **Agent** | `conversation.read`, `conversation.write` | Inbox, conversations, channels, calling, feed, notifications, profile |
