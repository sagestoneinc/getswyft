# Compliance Exports

## Summary

Compliance Exports allow tenant administrators to request and download bulk data exports for regulatory compliance, auditing, legal discovery, or internal review purposes. Administrators can export conversations, audit logs, user records, or a full data dump, and track each export through a status pipeline from request to completion.

> **This feature is restricted to administrators.** Only users with the `tenant.manage` permission can request, view, or download compliance exports.

---

## Who Can Use This

| Role / Permission   | Capability                                              |
|---------------------|---------------------------------------------------------|
| `tenant.manage`     | Request exports, view export status, download completed exports |

No other permission grants access to compliance export functionality. This is intentionally limited to tenant-level administrators to protect sensitive data.

---

## What It Does

- Enables administrators to request structured exports of platform data for their tenant.
- Supports multiple export types covering different data categories.
- Tracks each export request through a status pipeline so administrators can monitor progress.
- Generates a downloadable file once processing is complete.
- All export requests and downloads are audit logged for accountability.

---

## Key Functions / Actions Available

| Action                | Endpoint                                  | Permission Required |
|-----------------------|-------------------------------------------|---------------------|
| List exports          | `GET /v1/compliance/exports`              | `tenant.manage`     |
| Request a new export  | `POST /v1/compliance/exports`             | `tenant.manage`     |
| Get export details    | `GET /v1/compliance/exports/:exportId`    | `tenant.manage`     |

### ComplianceExport Model

| Field           | Description                                                   |
|-----------------|---------------------------------------------------------------|
| `type`          | The category of data being exported (see Export Types below)  |
| `status`        | Current processing status of the export (see Status Flow)     |
| `requestedById` | The user who initiated the export request                     |
| `fileUrl`       | URL to download the completed export file (populated on completion) |
| `completedAt`   | Timestamp of when the export finished processing              |
| `format`        | The file format of the export output                          |

### Export Types

| Type             | Description                                                          |
|------------------|----------------------------------------------------------------------|
| `FULL_DATA`      | Complete data export for the tenant, including all categories below  |
| `CONVERSATIONS`  | All conversation messages, threads, and related metadata             |
| `AUDIT_LOGS`     | Complete audit trail of all actions taken within the tenant          |
| `USERS`          | User records, profiles, roles, and permission assignments            |

---

## Step-by-Step: How to Use It

### Requesting an Export

1. Determine which type of data you need to export. Choose from: `FULL_DATA`, `CONVERSATIONS`, `AUDIT_LOGS`, or `USERS`.
2. Send a `POST` request to `/v1/compliance/exports` with the desired export type:
   ```json
   POST /v1/compliance/exports
   {
     "type": "CONVERSATIONS"
   }
   ```
3. The system creates the export request and returns an export object with status `PENDING` and a unique `exportId`.
4. Note the `exportId` — you will use it to check the status and download the file.

### Checking Export Status

1. Send a `GET` request to `/v1/compliance/exports/:exportId` using the `exportId` from the previous step.
2. The response includes the current `status` of the export:
   - `PENDING` — The export is queued and waiting to be processed.
   - `PROCESSING` — The system is actively generating the export file.
   - `COMPLETED` — The export is ready for download.
   - `FAILED` — The export encountered an error during processing.
3. For large datasets, processing may take several minutes. Poll the status endpoint periodically (e.g., every 30 seconds) until the status changes.

### Downloading a Completed Export

1. Once the export status is `COMPLETED`, the response will include a `fileUrl` field and a `completedAt` timestamp.
2. Use the `fileUrl` to download the export file. The file format is indicated by the `format` field on the export object.
3. Store the downloaded file securely. Compliance exports may contain sensitive user data, conversations, or audit records.

### Listing All Exports

1. To see all past and current export requests, send `GET /v1/compliance/exports`.
2. The response returns a list of all exports for your tenant, including their type, status, and download URLs for completed exports.

---

## System Behavior / What Users Should Expect

### Status Flow

```
┌─────────┐     ┌────────────┐     ┌───────────┐
│ PENDING │────▶│ PROCESSING │────▶│ COMPLETED │
└─────────┘     └────────────┘     └───────────┘
                      │
                      │             ┌────────┐
                      └────────────▶│ FAILED │
                                    └────────┘
```

| Status       | Description                                                          |
|--------------|----------------------------------------------------------------------|
| `PENDING`    | Export request received and queued for processing.                   |
| `PROCESSING` | The system is actively compiling and generating the export file.    |
| `COMPLETED`  | Export is finished. The `fileUrl` is available for download and `completedAt` is set. |
| `FAILED`     | An error occurred during export generation. See troubleshooting.     |

- Exports are processed asynchronously. The `POST` request returns immediately with a `PENDING` status.
- Processing time depends on the volume of data. A `FULL_DATA` export for a large tenant will take longer than a `USERS` export.
- The `fileUrl` is only populated when the status reaches `COMPLETED`.
- All export requests, status changes, and downloads are recorded in the audit log.

---

## Permissions Required

| Permission       | What It Grants                                                |
|------------------|---------------------------------------------------------------|
| `tenant.manage`  | Full access to request, list, view, and download compliance exports |

This is the only permission that grants compliance export access. It is typically held by tenant administrators or compliance officers.

---

## Common Issues

| Issue                                        | Cause / Resolution                                                              |
|----------------------------------------------|---------------------------------------------------------------------------------|
| `403 Forbidden` on any compliance endpoint   | Your account lacks the `tenant.manage` permission. Only tenant administrators can access compliance exports. |
| Export stuck in `PENDING`                    | The export queue may be processing other requests. Wait and check status again. If it persists beyond 30 minutes, contact support. |
| Export status is `FAILED`                    | An error occurred during generation. Try submitting a new export request. If failures repeat, contact Getswyft support with the `exportId`. |
| `fileUrl` is empty or null                   | The export has not yet completed. Check that the status is `COMPLETED` before attempting to download. |
| Export file is very large                    | `FULL_DATA` exports for active tenants can be substantial. Consider using a more specific export type (`CONVERSATIONS`, `AUDIT_LOGS`, or `USERS`) if you only need a subset of data. |
| Cannot access a previously downloaded export | Export file URLs may expire. Request a new export if the download link is no longer valid. |

---

## Support Notes / Troubleshooting

- **Data scope:** Each export is scoped to the requesting user's tenant. You can only export data belonging to your own organization.
- **Sensitive data handling:** Export files may contain personally identifiable information (PII), conversation content, and audit records. Handle downloaded files in accordance with your organization's data protection policies and applicable regulations (e.g., GDPR, CCPA).
- **Audit logging:** Every compliance export request, status transition, and file download is recorded in the audit log. Use an `AUDIT_LOGS` export to review this activity.
- **Retry on failure:** If an export fails, the recommended approach is to submit a new request for the same type. Transient infrastructure issues are the most common cause of failures.
- **Concurrent exports:** You may submit multiple export requests simultaneously. Each is tracked independently with its own `exportId` and status.
- **File format:** The format of the generated export file is indicated in the `format` field of the export object. Ensure your tools support the specified format before downloading.

---

## Related Pages

- [Moderation](./moderation.md) — Moderation actions are captured in audit logs available via compliance exports.
- [AI Features](./ai-features.md) — AI interaction logs can be part of full data exports.
