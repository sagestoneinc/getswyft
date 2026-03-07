# Troubleshooting Guide

This guide covers common issues encountered on the Getswyft communications platform and provides step-by-step resolution instructions. Issues are organized by category so you can quickly locate the relevant solution.

---

## Login & Authentication

### Can't Log In

| Detail | Info |
|--------|------|
| **Symptom** | Login form rejects credentials or shows an error message. |
| **Likely Cause** | Incorrect email/password, disabled account, or auth provider outage. |

**Resolution Steps:**

1. Verify you are using the correct email address associated with your account.
2. Re-enter your password carefully — passwords are case-sensitive.
3. If your tenant uses a third-party auth provider, confirm the provider service is operational.
4. Use the **Forgot Password** / password-reset flow to generate a new password.
5. If the issue persists, contact your Tenant Admin to confirm your account is active.

### SSO Not Working

| Detail | Info |
|--------|------|
| **Symptom** | Clicking the SSO button results in an error or redirect loop. |
| **Likely Cause** | SSO provider misconfiguration or changed credentials on the identity provider side. |

**Resolution Steps:**

1. Confirm the SSO provider (e.g., Google, Okta, Azure AD) is configured correctly in **Tenant Settings**.
2. Verify the redirect URI registered with the identity provider matches the Getswyft callback URL.
3. Ask your Tenant Admin to review the SSO configuration under tenant settings (`GET /v1/tenants/current/settings`).
4. Check the identity provider's admin console for error logs.

### Session Expired

| Detail | Info |
|--------|------|
| **Symptom** | You are suddenly logged out or see a "session expired" message. |
| **Likely Cause** | The authentication token has expired due to inactivity or token lifetime policy. |

**Resolution Steps:**

1. Log in again using your credentials or SSO provider.
2. If sessions expire too frequently, contact your Tenant Admin to review token lifetime settings.

---

## Conversations & Messaging

### Messages Not Sending

| Detail | Info |
|--------|------|
| **Symptom** | Clicking "Send" does nothing, or a message shows a failed/pending state. |
| **Likely Cause** | Network connectivity issue, missing `conversation.write` permission, or API error. |

**Resolution Steps:**

1. Check your internet connection and confirm the application is online.
2. Verify your role includes the `conversation.write` permission (Tenant Admin or Agent roles).
3. Refresh the page and try sending the message again.
4. Open the browser developer console (F12) and check the **Network** tab for failed `POST /v1/conversations/:id/messages` requests.
5. If the error persists, contact support with the conversation ID and any error codes visible.

### Can't See Conversations

| Detail | Info |
|--------|------|
| **Symptom** | The conversations list is empty or missing expected conversations. |
| **Likely Cause** | Active tab filter is hiding results, or your role lacks `conversation.read` permission. |

**Resolution Steps:**

1. Check which tab is active — **Unassigned**, **Mine**, or **Closed** — and switch to **All** or the appropriate tab.
2. Confirm your role includes the `conversation.read` permission. Both the Tenant Admin and Agent roles include this permission.
3. If you are a new team member, ask your Tenant Admin to verify your role assignment.

### Unread Count Is Wrong

| Detail | Info |
|--------|------|
| **Symptom** | The unread badge count does not match actual unread messages. |
| **Likely Cause** | Stale real-time connection or a missed read-receipt sync. |

**Resolution Steps:**

1. Refresh the page to force a re-fetch of conversation data.
2. Open the conversation to trigger a mark-read event (`POST /v1/conversations/:id/read`).
3. Verify the WebSocket / Socket.IO connection is active (see [Real-time Features](#real-time-features) below).

### Can't Assign a Conversation

| Detail | Info |
|--------|------|
| **Symptom** | The assign button is disabled or returns a permission error. |
| **Likely Cause** | Your role does not include the `conversation.write` permission. |

**Resolution Steps:**

1. Verify your role includes `conversation.write`. Agent and Tenant Admin roles both have this permission.
2. Check that the conversation is not already closed — reopen it first if necessary (`PATCH /v1/conversations/:id`).
3. Contact your Tenant Admin if you believe your permissions are incorrect.

---

## Real-time Features

### Presence Not Updating

| Detail | Info |
|--------|------|
| **Symptom** | User online/offline status appears stuck or incorrect. |
| **Likely Cause** | WebSocket connection dropped or not established. |

**Resolution Steps:**

1. Refresh the page to re-establish the Socket.IO connection.
2. Check the browser developer console for WebSocket errors.
3. Confirm your network/firewall allows WebSocket connections (typically over port 443 with `wss://`).

### Typing Indicators Not Showing

| Detail | Info |
|--------|------|
| **Symptom** | You don't see "User is typing…" indicators when others are composing messages. |
| **Likely Cause** | The Socket.IO connection is not active or events are being blocked. |

**Resolution Steps:**

1. Refresh the page to reconnect Socket.IO.
2. Verify WebSocket support is enabled in your browser (all modern browsers support this by default).
3. Check that no browser extension (e.g., ad blocker, privacy extension) is blocking WebSocket frames.

### Not Receiving Real-time Updates

| Detail | Info |
|--------|------|
| **Symptom** | New messages, notifications, or status changes only appear after a manual page refresh. |
| **Likely Cause** | WebSocket connection is blocked by a firewall, proxy, or browser setting. |

**Resolution Steps:**

1. Confirm your browser supports WebSockets (Chrome, Firefox, Safari, and Edge all do).
2. If you are behind a corporate firewall or proxy, ask your network administrator to allow WebSocket traffic on `wss://` (port 443).
3. Disable browser extensions one by one to identify if any are interfering.
4. Try a different browser or network to isolate the issue.

---

## Notifications

### Not Receiving Push Notifications

| Detail | Info |
|--------|------|
| **Symptom** | No push notifications appear on your device despite new messages. |
| **Likely Cause** | Device not registered, FCM not configured, or browser notification permission denied. |

**Resolution Steps:**

1. Ensure your device is registered for push notifications (`POST /v1/notifications/devices`).
2. In your browser, go to **Settings → Notifications** and confirm Getswyft is allowed to send notifications.
3. Ask your Tenant Admin to verify Firebase Cloud Messaging (FCM) configuration.
4. Send a test notification (`POST /v1/notifications/test`) to confirm the pipeline works end-to-end.

### Notifications Not Showing in the App

| Detail | Info |
|--------|------|
| **Symptom** | The notification bell does not show new items even though events have occurred. |
| **Likely Cause** | Notification list is not refreshing, or the real-time connection is down. |

**Resolution Steps:**

1. Click the notification bell to force a fetch of the notification list (`GET /v1/notifications`).
2. Verify the WebSocket connection is active (see [Real-time Features](#real-time-features)).
3. Use the **Test Notification** feature to confirm notifications are being created.

---

## Team & Invitations

### Invitation Email Not Received

| Detail | Info |
|--------|------|
| **Symptom** | A new team member reports they never received the invitation email. |
| **Likely Cause** | Email landed in spam/junk, or the email address was entered incorrectly. |

**Resolution Steps:**

1. Ask the invitee to check their **Spam** or **Junk** folder.
2. Verify the email address used when sending the invitation (`POST /v1/users/team/invitations`).
3. Resend the invitation from the **Team Management** page.
4. If your organization uses email filtering, ask the IT team to allowlist Getswyft's sending domain.

### Invitation Expired

| Detail | Info |
|--------|------|
| **Symptom** | The invitee clicks the link but sees an "invitation expired" error. |
| **Likely Cause** | Invitations expire after **7 days**. |

**Resolution Steps:**

1. A Tenant Admin or user with `user.manage` permission must resend the invitation.
2. Advise the invitee to accept the new invitation promptly.

### Can't Manage Team Members

| Detail | Info |
|--------|------|
| **Symptom** | The Team Management page is not accessible or actions are disabled. |
| **Likely Cause** | Your role does not include the `user.manage` permission. |

**Resolution Steps:**

1. Only the **Tenant Admin** role includes `user.manage`. Confirm your role.
2. If you need team management access, contact your Tenant Admin to update your role (`PATCH /v1/users/team/members/:userId/role`).

---

## Calling

### Call Not Connecting

| Detail | Info |
|--------|------|
| **Symptom** | Initiating a call results in a timeout or error. |
| **Likely Cause** | Telephony integration not configured, or phone number format is incorrect. |

**Resolution Steps:**

1. Verify the tenant's telephony/calling configuration is set up correctly in **Tenant Settings**.
2. Ensure the phone number is in the correct international format (e.g., `+1XXXXXXXXXX`).
3. Confirm your role includes `conversation.write` permission, which is required to create call sessions (`POST /v1/calls/sessions`).
4. Check call history (`GET /v1/calls/history`) for error details on previous attempts.

### No Audio During a Call

| Detail | Info |
|--------|------|
| **Symptom** | The call connects but there is no audio in one or both directions. |
| **Likely Cause** | Browser microphone permission denied, or hardware issue. |

**Resolution Steps:**

1. Check your browser's address bar for a microphone permission prompt and click **Allow**.
2. Go to **Browser Settings → Privacy → Microphone** and ensure Getswyft is permitted.
3. Test your microphone with another application to rule out hardware issues.
4. Try a different browser or device.

---

## File Uploads

### Upload Failing

| Detail | Info |
|--------|------|
| **Symptom** | File upload shows an error or never completes. |
| **Likely Cause** | File exceeds the **25 MB** size limit, or storage configuration is incomplete. |

**Resolution Steps:**

1. Verify the file is under the **25 MB** maximum size.
2. Ensure the presigned upload URL was obtained successfully (`POST /v1/storage/presign-upload`).
3. Check your network connection — large uploads can fail on unstable connections.
4. Ask your Tenant Admin to confirm cloud storage configuration.

### Can't Attach Files

| Detail | Info |
|--------|------|
| **Symptom** | The attachment button is disabled or returns a permission error. |
| **Likely Cause** | Your role does not include `conversation.write` permission. |

**Resolution Steps:**

1. File uploads require the `conversation.write` permission. Both Agent and Tenant Admin roles include this.
2. If your role should allow uploads, contact your Tenant Admin.

---

## Webhooks

### Webhook Not Firing

| Detail | Info |
|--------|------|
| **Symptom** | Expected webhook events are not being delivered to your endpoint. |
| **Likely Cause** | Webhook is inactive, event types are not configured, or the endpoint is unreachable. |

**Resolution Steps:**

1. Navigate to **Tenant Settings → Webhooks** and confirm the webhook status is **active**.
2. Verify the correct event types are selected for the webhook.
3. Review webhook delivery logs for failed delivery attempts and error codes.
4. Ensure the target URL is publicly reachable and responds with a `2xx` status code.

### Test Delivery Failed

| Detail | Info |
|--------|------|
| **Symptom** | Clicking **Test** on a webhook returns a failure result. |
| **Likely Cause** | The endpoint URL is unreachable, or HMAC signature validation is rejecting the request. |

**Resolution Steps:**

1. Confirm the endpoint URL is correct and accessible from the public internet.
2. If your endpoint validates HMAC signatures, ensure the shared secret matches the one configured in Getswyft.
3. Check your server logs for the incoming test request and any errors.
4. Use the test endpoint (`POST /v1/tenants/current/webhooks/:id/test`) directly via API to see the raw response.

---

## General

### Page Not Loading

| Detail | Info |
|--------|------|
| **Symptom** | A page shows a blank screen, spinner, or error message. |
| **Likely Cause** | API connection issue, stale cache, or browser incompatibility. |

**Resolution Steps:**

1. Refresh the page (Ctrl+Shift+R / Cmd+Shift+R for a hard refresh).
2. Clear your browser cache and cookies for the Getswyft domain.
3. Try a different browser (Chrome, Firefox, Safari, or Edge recommended).
4. Check whether the Getswyft API is reachable — your Tenant Admin or DevOps team can verify service status.

### Permission Denied Error

| Detail | Info |
|--------|------|
| **Symptom** | An action returns a `403 Forbidden` or "Permission Denied" message. |
| **Likely Cause** | Your assigned role does not include the required permission for that action. |

**Resolution Steps:**

1. Identify which permission the action requires (see the [Permissions Matrix](./permissions-matrix.md)).
2. Contact your Tenant Admin to verify your role and update it if needed (`PATCH /v1/users/team/members/:userId/role`).
3. Tenant Admins have all permissions; Agents have `conversation.read` and `conversation.write` only.

### Data Not Refreshing

| Detail | Info |
|--------|------|
| **Symptom** | Dashboard data, conversation lists, or analytics appear stale. |
| **Likely Cause** | The WebSocket connection dropped, preventing real-time updates. |

**Resolution Steps:**

1. Refresh the page to re-establish the real-time connection and fetch fresh data.
2. Check the WebSocket connection status (see [Real-time Features](#real-time-features)).
3. If the issue persists, try logging out and back in.

---

## Escalation Guide

### When to Self-Service

Most issues above can be resolved by the end user or a Tenant Admin. Attempt self-service when:

- The issue matches a documented symptom above.
- The resolution involves checking permissions, refreshing, or adjusting browser settings.
- A Tenant Admin can resolve it by updating settings, roles, or configurations.

### When to Escalate

Escalate to internal support when:

- The issue persists after following all resolution steps above.
- The problem appears to be a platform-wide outage (multiple users affected).
- You receive unexpected server errors (`5xx` status codes) consistently.
- Data integrity issues are suspected (e.g., missing conversations, corrupted messages).
- Security concerns arise (e.g., unauthorized access, suspicious activity).

### Escalation Information to Include

When escalating, provide the following to help the support team investigate efficiently:

- **User ID and Tenant ID**
- **Timestamp** of when the issue occurred (with timezone)
- **Steps to reproduce** the problem
- **Browser and OS** information
- **Screenshots or screen recordings** if applicable
- **Network logs** (browser developer console → Network tab export)
- **Error messages** or status codes observed
- **API endpoint and response** if available (e.g., from the developer console)

### Internal Support Team Notes

- Check **audit logs** (`GET /v1/audit-logs`) for a timeline of user actions around the reported issue.
- Review **webhook delivery logs** for integration-related problems.
- Verify **tenant configuration** via `GET /v1/tenants/current/settings` to rule out misconfigurations.
- For real-time issues, check Socket.IO server health and connection metrics.
- For calling issues, review call session records (`GET /v1/calls/sessions`) and telemetry data.
