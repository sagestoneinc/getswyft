# Webhooks

## Summary

Webhooks allow your organization to receive real-time HTTP callbacks when events occur on the Getswyft platform. You can configure webhook endpoints to listen for specific event types, verify payloads using HMAC signatures, review delivery history, and send test deliveries to confirm your integration is working. Webhook management is available through both the website UI and the API.

## Who Can Use This

- **Administrators only.** The `tenant.manage` permission is required to create, update, delete, and manage webhook endpoints. In the website sidebar, webhook access is indicated by the **Admin** badge.
- Non-admin users do not have access to webhook configuration.

## What It Does

The webhook system provides:

- **Endpoint management** — Create, update, and delete webhook endpoints that receive HTTP POST requests when events occur.
- **Event type selection** — Choose which event types each endpoint subscribes to, so you only receive the callbacks you need.
- **HMAC payload signing** — Every webhook delivery includes an HMAC signature generated with your endpoint's signing secret, allowing you to verify that payloads are authentic.
- **Delivery history** — View a log of recent deliveries for each endpoint, including HTTP status codes, response bodies, and delivery duration.
- **Status control** — Enable or disable endpoints without deleting them.
- **Test deliveries** — Send a test payload to any endpoint to verify connectivity and integration.
- **Automatic retries** — Failed deliveries are automatically retried by the system.

## Key Functions / Actions Available

| Action | API Endpoint | Method | Description |
|---|---|---|---|
| List endpoints | `GET /v1/tenants/current/webhooks` | GET | Retrieve all webhook endpoints for the current tenant, including recent delivery history. |
| Create endpoint | `POST /v1/tenants/current/webhooks` | POST | Create a new webhook endpoint with a URL, description, and selected event types. |
| Update endpoint | `PATCH /v1/tenants/current/webhooks/:webhookId` | PATCH | Update the URL, description, event types, or status of an existing endpoint. |
| Delete endpoint | `DELETE /v1/tenants/current/webhooks/:webhookId` | DELETE | Permanently remove a webhook endpoint. |
| Send test delivery | `POST /v1/tenants/current/webhooks/:webhookId/test` | POST | Send a test payload to the endpoint to verify it is reachable and correctly configured. |

### Website UI Features

The webhook management page (`/app/webhooks`) provides:

- A list of all configured webhook endpoints with their current status.
- **Create** and **Edit** modals for configuring endpoint details.
- **Multi-select** control for choosing which event types an endpoint subscribes to.
- **Status toggle** to activate or disable an endpoint.
- **Delivery history** panel showing recent deliveries with status codes and timing.
- **Test delivery** button to send a test payload on demand.
- **Copy secret** button to copy the endpoint's HMAC signing secret to your clipboard.
- **Delete** confirmation modal to remove an endpoint.

## Step-by-Step How to Use It

### Creating a Webhook Endpoint

1. Navigate to **Webhooks** in the website sidebar (requires Admin access), or use the API.
2. Click **Create Webhook** (or send a `POST` request to `/v1/tenants/current/webhooks`).
3. Fill in the following fields:
   - **URL** (required) — The HTTPS endpoint that will receive webhook deliveries.
   - **Description** (optional) — A human-readable label to identify the endpoint's purpose.
   - **Event Types** (required) — Select one or more event types from the multi-select list.
4. Save the endpoint. The system generates a **signing secret** for HMAC payload verification.
5. Copy the signing secret and store it securely in your receiving application.

### Configuring Event Types

1. Open the webhook endpoint you want to configure (click **Edit** or send a `PATCH` request).
2. Use the event type multi-select to add or remove event types.
3. Save your changes. The endpoint will only receive deliveries for the selected event types.

### Testing a Webhook

1. Locate the endpoint you want to test in the webhook list.
2. Click the **Test** button (or send a `POST` request to `/v1/tenants/current/webhooks/:webhookId/test`).
3. The system sends a test payload to the endpoint URL.
4. Check the **Delivery History** to confirm the test was received successfully.
5. A successful test shows an HTTP `2xx` status code and a short delivery duration.

#### Example Scenario: Sending a Test Webhook

You have just created a webhook endpoint pointing to `https://your-app.example.com/webhooks/getswyft`. To confirm it is working:

1. Navigate to the Webhooks page in the sidebar.
2. Find the endpoint in the list and click **Test**.
3. The system sends a test POST request with a sample payload to your URL.
4. Open the delivery history for that endpoint. You should see an entry with:
   - **Status Code:** `200`
   - **Duration:** e.g., `145ms`
   - **Status:** `delivered`
5. On your server, verify the request was received and the HMAC signature matches your stored signing secret.

### Viewing Delivery History

1. Open the webhook endpoint details (click the endpoint in the list or use `GET /v1/tenants/current/webhooks`).
2. Review the list of recent deliveries. Each entry includes:
   - `statusCode` — The HTTP response code returned by your server.
   - `responseBody` — The response body returned by your server.
   - `durationMs` — How long the delivery took in milliseconds.
   - `status` — The delivery outcome (e.g., `delivered`, `failed`).
3. Use this information to diagnose connectivity or integration issues.

### Enabling or Disabling an Endpoint

1. Open the webhook endpoint you want to modify.
2. Toggle the **Status** switch to `active` or `disabled` (or send a `PATCH` request with `"status": "active"` or `"status": "disabled"`).
3. Disabled endpoints remain configured but do not receive deliveries until re-enabled.

### Deleting a Webhook Endpoint

1. Open the webhook endpoint you want to remove.
2. Click **Delete** and confirm in the modal (or send a `DELETE` request to `/v1/tenants/current/webhooks/:webhookId`).
3. The endpoint is permanently removed. This action cannot be undone.

## System Behavior / What Users Should Expect

- **HMAC signing:** Every delivery includes an HMAC signature in the request headers, generated using the endpoint's signing secret. Your receiving server should verify this signature to confirm the payload was sent by Getswyft and has not been tampered with.
- **Retry logic:** If a delivery fails (non-2xx response or network error), the system automatically retries the delivery. Repeated failures may result in the endpoint being marked with a failed status in the delivery history.
- **Delivery timing:** Webhook deliveries are sent shortly after the triggering event occurs. The `durationMs` field in the delivery history reflects the round-trip time to your server.
- **Signing secret:** The signing secret is generated when the endpoint is created. It is displayed once and can be copied from the UI. Store it securely — it is required to verify incoming webhook payloads.
- **Event scoping:** Each endpoint only receives deliveries for its configured event types. Changing event types takes effect immediately.

## Permissions Required

| Permission | Grants Access To |
|---|---|
| `tenant.manage` | Full access to create, read, update, delete, and test webhook endpoints. |

Only users with the `tenant.manage` permission (Admin role) can access the Webhooks page or use the webhook API endpoints.

## Common Issues

| Issue | Cause | Resolution |
|---|---|---|
| Webhook not receiving deliveries | Endpoint status is set to `disabled`. | Toggle the endpoint status to `active`. |
| Delivery shows a non-2xx status code | Your server returned an error response. | Check your server logs for the error. Ensure the endpoint URL is correct and your server is running. |
| HMAC signature verification fails | Signing secret mismatch or incorrect verification implementation. | Confirm you are using the correct signing secret. Verify your HMAC computation uses the same algorithm and encoding as Getswyft. |
| Cannot access Webhooks page | Missing `tenant.manage` permission. | Contact your organization administrator to request Admin access. |
| Test delivery fails | Endpoint URL is unreachable or returns an error. | Verify the URL is correct, the server is running, and it accepts POST requests. Check firewall and network rules. |
| Lost signing secret | The secret was not saved after endpoint creation. | Delete the endpoint and create a new one to receive a new signing secret. |

## Support Notes / Troubleshooting

- Start with a **test delivery** when setting up a new endpoint. This confirms connectivity before relying on the webhook for production events.
- If deliveries are failing intermittently, check the delivery history for patterns in status codes or response times. Timeouts or rate limiting on your server may be the cause.
- The system retries failed deliveries automatically. If an endpoint consistently fails, review your server's availability and error handling.
- HMAC verification is strongly recommended for security. Without it, you cannot confirm that incoming requests are genuinely from Getswyft.
- Webhook endpoints should respond quickly (ideally within a few seconds). Long-running processing should be handled asynchronously after acknowledging the webhook with a `2xx` response.
- If you need to rotate your signing secret, delete the endpoint and recreate it with the same configuration. A new secret is generated automatically.

## Related Pages

- [Feed and Posts](./feed-and-posts.md) — Feed events may be available as webhook event types.
- [Notifications](./notifications.md) — In-app and push notifications complement webhooks for user-facing alerts.
