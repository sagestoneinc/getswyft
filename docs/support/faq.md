# Frequently Asked Questions

Answers to the most common questions about using the Getswyft communications platform for real estate teams.

---

## General

### What is Getswyft?

Getswyft is a multi-tenant SaaS communications platform built for real estate teams. It provides conversations, channels, calling, a feed, AI-powered features, moderation, analytics, and integrations — all in one place. Each real estate organization operates within its own tenant, with role-based access controlling what each user can see and do.

### What are the different user roles?

There are two roles:

- **Tenant Admin** (`admin`) — Has full access to all platform features, including tenant settings, team management, billing, analytics, moderation, compliance, AI configuration, and feature flags.
- **Agent** (`agent`) — Has access to conversations, channels, calling, the feed, and file uploads. Agents can read and write conversations but cannot manage tenant settings, team members, or moderation reports.

For a complete breakdown, see the [Permissions Matrix](./permissions-matrix.md).

### What permissions do I need to…?

Refer to the [Permissions Matrix](./permissions-matrix.md) for a detailed feature-to-permission mapping. In general:

- **View conversations and messages** → `conversation.read`
- **Send messages, upload files, assign conversations** → `conversation.write`
- **Manage team members and invitations** → `user.manage`
- **Configure tenant settings, webhooks, billing** → `tenant.manage`
- **Review moderation reports** → `moderation.manage`
- **View analytics and audit logs** → `analytics.read`
- **Manage feature flags** → `featureflag.manage`

---

## Authentication

### How do I log in?

Navigate to the Getswyft login page and enter your email and password. If your tenant has SSO configured (e.g., Google, Okta), you can also log in using the SSO button. After successful authentication, you will be redirected to the dashboard.

### How do I reset my password?

Click the **Forgot Password** link on the login page and enter your registered email address. You will receive an email with instructions to create a new password. If you do not receive the email, check your spam folder or contact your Tenant Admin.

---

## Team Management

### How do I invite team members?

You need the `user.manage` permission (Tenant Admin role). Navigate to **Team Management**, click **Invite**, enter the new member's email address and select a role, then send the invitation. The invitee will receive an email with a link to accept and create their account.

See also: `POST /v1/users/team/invitations`

### Why didn't my team member receive their invitation?

Common causes include:

1. The email went to their **spam or junk** folder.
2. The email address was entered incorrectly.
3. Corporate email filters blocked the message.

Verify the email address and resend the invitation. If the problem persists, ask your IT team to allowlist the Getswyft sending domain. Invitations expire after **7 days** — if expired, simply resend a new one.

---

## Conversations

### What's the difference between Unassigned, Mine, and Closed tabs?

- **Unassigned** — Conversations that have not been assigned to any team member. These are waiting to be picked up.
- **Mine** — Conversations currently assigned to you.
- **Closed** — Conversations that have been resolved and closed.

Use these tabs to filter the conversation list and focus on the conversations relevant to you.

### How do I assign a conversation to myself?

Open an unassigned conversation and click the **Assign to Me** button (or use the assignment dropdown). This requires the `conversation.write` permission, which is included in both the Agent and Tenant Admin roles.

### How do I transfer a conversation to another team member?

Open the conversation and use the assignment dropdown to select a different team member. The list of assignable members is fetched from `GET /v1/users/team/assignable` and requires `conversation.write` permission.

### How do I close or reopen a conversation?

To **close** a conversation, open it and click the **Close** button or update its status. To **reopen**, navigate to the **Closed** tab, open the conversation, and click **Reopen**. Both actions use `PATCH /v1/conversations/:id` and require `conversation.write` permission.

---

## Messaging & Files

### How do I send a file attachment?

In a conversation or channel, click the **attachment** icon, select a file from your device, and send it. The platform first obtains a presigned upload URL (`POST /v1/storage/presign-upload`), uploads the file (`PUT /v1/storage/upload`), and then sends the message with the file attached. You need the `conversation.write` permission.

### What is the file size limit?

The maximum file size for uploads is **25 MB**. If your file exceeds this limit, consider compressing it or splitting it into smaller parts before uploading.

---

## Channels

### How do I create a channel?

You need `conversation.write` permission. Navigate to **Channels**, click **Create Channel**, provide a name and optional description, then save. You can then add members to the channel using `POST /v1/channels/:id/members`. Channels are useful for team-wide discussions and topic-based collaboration.

---

## Calling

### How do I make a call?

There are two ways to initiate a call:

1. **From a conversation** — Open a conversation and click the **Call** button (`POST /v1/conversations/:id/call`).
2. **Directly** — Create a new call session via `POST /v1/calls/sessions`.

Both require `conversation.write` permission. Ensure the phone number is in the correct international format and that your tenant's telephony integration is configured.

### I have no audio during a call. What should I do?

Check that your browser has permission to access your microphone. Go to your browser's site settings and ensure Getswyft is allowed microphone access. Also verify that your microphone hardware is functioning correctly by testing it in another application. See the [Troubleshooting Guide](./troubleshooting.md#no-audio-during-a-call) for more details.

---

## Tenant Settings

### How do routing settings work?

Routing settings determine how incoming conversations are distributed to agents. Tenant Admins can configure routing via **Tenant Settings** (`GET/PATCH /v1/tenants/current/settings`). The settings control which routing mode is active and how conversations are assigned.

### What routing modes are available?

The available routing modes depend on your tenant configuration. Common modes include:

- **Manual** — Conversations go to the unassigned queue and agents pick them up manually.
- **Round-robin** — Conversations are distributed evenly across available agents.
- **Auto-assign** — Conversations are automatically assigned based on rules and availability.

Contact your Tenant Admin for the specific modes enabled for your tenant.

### What does the billing page show?

The billing page (`GET /v1/tenants/current/billing`) displays your tenant's current subscription plan, usage metrics, and billing details. Only users with the `tenant.manage` permission (Tenant Admin) can access this page.

### Is payment processing active?

The billing page provides visibility into plan and usage information. For payment processing details, contact your Tenant Admin or the Getswyft sales team for your specific tenant arrangement.

---

## Webhooks

### How do webhooks work?

Webhooks allow your tenant to receive real-time HTTP notifications when specific events occur in Getswyft (e.g., new message, conversation closed). A Tenant Admin configures webhook endpoints under **Tenant Settings → Webhooks** (`POST /v1/tenants/current/webhooks`), selecting the events to subscribe to. When an event fires, Getswyft sends an HTTP POST to your endpoint with event data, signed with an HMAC signature for verification.

### How do I test a webhook?

Navigate to **Tenant Settings → Webhooks**, select the webhook you want to test, and click **Test**. This triggers a test delivery (`POST /v1/tenants/current/webhooks/:id/test`) to your configured endpoint. Check your server logs to confirm the test payload was received. If the test fails, verify the endpoint URL is reachable and that your server responds with a `2xx` status. See the [Troubleshooting Guide](./troubleshooting.md#webhooks) for common webhook issues.

---

## Analytics & Audit Logs

### How do I view analytics?

Navigate to the **Analytics** page. The analytics summary (`GET /v1/analytics/summary`) provides an overview of key metrics. You need the `analytics.read` permission, which is included in the Tenant Admin role.

### How do I view audit logs?

Audit logs are available at `GET /v1/audit-logs` and require either `tenant.manage` or `analytics.read` permission. They provide a chronological record of significant actions taken within your tenant for compliance and monitoring purposes.

---

## Notifications

### How do notifications work?

Getswyft sends notifications for events such as new messages, conversation assignments, and system updates. Notifications appear in the in-app notification panel (`GET /v1/notifications`). For push notifications on mobile or desktop, ensure your device is registered (`POST /v1/notifications/devices`) and browser notification permissions are granted. All authenticated users can manage their notifications — no special permission is required.

### How do I send a test notification?

Use the test notification endpoint (`POST /v1/notifications/test`) to send a sample notification to your registered device. This helps verify that push notification delivery is working end-to-end.

---

## AI Features

### What AI features are available?

Getswyft includes several AI-powered capabilities:

| Feature | Description | Permission Required |
|---------|-------------|---------------------|
| **AI Chatbot** | Conversational AI assistant for agents | `conversation.write` |
| **AI Summarize** | Automatically summarize conversation threads | `conversation.read` |
| **AI Assist** | Smart reply suggestions and content drafting | `conversation.write` |
| **AI Moderate** | AI-powered content moderation analysis | `moderation.manage` |
| **AI Voice Bot** | Automated voice interaction bot | `conversation.write` |
| **AI Config** | Configure AI behavior and settings | `tenant.manage` |
| **AI Interactions** | View logs of AI interactions | `analytics.read` |

AI configuration is managed by Tenant Admins via `tenant.manage`. Agents can use AI chat, assist, and voice-bot features through their `conversation.write` permission.

---

## Compliance & Moderation

### How do I request a compliance export?

Compliance exports are managed through `POST /v1/compliance/exports` and require the `tenant.manage` permission (Tenant Admin). Navigate to **Compliance**, select the data range and type of export, and submit the request. Once the export is ready, it can be downloaded from the compliance exports list (`GET /v1/compliance/exports`).

### How do I report content for moderation?

Any user with `conversation.write` permission (Agents and Tenant Admins) can create a moderation report by submitting `POST /v1/moderation` with details about the content in question. Reviewing and acting on moderation reports requires the `moderation.manage` permission, which is available to Tenant Admins. The moderation queue is accessible under the **Moderation** section in the sidebar.

---

## Profile & Settings

### How do I change my profile settings?

Click on your avatar or profile icon and select **Profile Settings**. You can update your display name, avatar, and other profile details via `PATCH /v1/auth/profile`. Profile management is available to all authenticated users — no special permission is required.

---

## Platform Concepts

### What is the agent console?

The agent console is the primary workspace for Agents. It provides access to conversations, channels, the feed, and calling features — everything an Agent needs to communicate with contacts and collaborate with their team. The console surfaces conversations in Unassigned, Mine, and Closed tabs, and provides real-time updates via WebSocket.

### What is the visitor widget?

The visitor widget is an embeddable chat component that can be placed on a real estate website. It allows website visitors (e.g., prospective buyers or renters) to start conversations with your team. Messages from the widget appear as new conversations in the agent console's Unassigned queue, where agents can pick them up and respond.

---

## Still Need Help?

If your question is not answered here, try the following resources:

- **[Troubleshooting Guide](./troubleshooting.md)** — Step-by-step solutions for common issues.
- **[Permissions Matrix](./permissions-matrix.md)** — Detailed role and permission reference.
- **Tenant Admin** — Your organization's Tenant Admin can help with configuration, role assignments, and account issues.
- **Support Team** — Contact the Getswyft support team for issues that cannot be resolved through self-service.
