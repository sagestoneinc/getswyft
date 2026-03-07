# Moderation

## Summary

The Moderation system enables users to report inappropriate or policy-violating content and provides moderators with tools to review, resolve, or dismiss those reports. Reports follow a structured status workflow from creation through resolution, ensuring consistent and auditable content governance across the platform.

> **Note:** There is no dedicated Moderation page in the website UI. All moderation operations are API-driven via the `/v1/moderation` endpoint. Organizations may integrate these endpoints into custom tooling or admin dashboards.

---

## Who Can Use This

| Role / Permission        | Capability                              |
|--------------------------|-----------------------------------------|
| `conversation.write`    | Create moderation reports               |
| `moderation.manage`     | View, review, resolve, or dismiss reports; delete feed posts/comments |

Any user with `conversation.write` permission can flag content for review. Only users with `moderation.manage` can access the report queue, update report statuses, and perform moderation actions such as deleting posts or comments.

---

## What It Does

- Allows users to report messages, posts, comments, or other content that violates community guidelines or platform policies.
- Tracks each report through a defined status workflow so nothing falls through the cracks.
- Provides moderators with the ability to review flagged content, add review notes, and take action.
- Supports feed post and comment deletion by the content author or any user with `moderation.manage` permission.
- All moderation actions are audit logged for compliance and accountability.

---

## Key Functions / Actions Available

| Action                  | Endpoint                          | Permission Required   |
|-------------------------|-----------------------------------|-----------------------|
| List reports            | `GET /v1/moderation`              | `moderation.manage`   |
| Create a report         | `POST /v1/moderation`             | `conversation.write`  |
| Get report details      | `GET /v1/moderation/:reportId`    | `moderation.manage`   |
| Update report status    | `PATCH /v1/moderation/:reportId`  | `moderation.manage`   |

### ModerationReport Model

| Field            | Description                                      |
|------------------|--------------------------------------------------|
| `targetType`     | The type of content being reported (e.g., post, comment, message) |
| `targetId`       | The unique identifier of the reported content    |
| `reporterUserId` | The user who submitted the report                |
| `reason`         | Free-text explanation of why the content was reported |
| `status`         | Current status of the report (see workflow below) |
| `reviewerUserId` | The moderator who reviewed the report            |
| `reviewNote`     | Notes added by the reviewer during resolution    |

---

## Step-by-Step: How to Use It

### Reporting Content

1. Identify the content that violates guidelines. Note the `targetType` (e.g., `post`, `comment`, `message`) and the `targetId`.
2. Send a `POST` request to `/v1/moderation` with the following body:
   ```json
   {
     "targetType": "post",
     "targetId": "abc-123",
     "reason": "This post contains spam and misleading information."
   }
   ```
3. The system creates a new report with status `OPEN` and returns the report object including the generated `reportId`.
4. The report is now visible to all users with `moderation.manage` permission.

### Reviewing Reports (Moderator)

1. Retrieve the list of open reports by sending `GET /v1/moderation?status=OPEN`.
2. Select a report to review and retrieve its details with `GET /v1/moderation/:reportId`.
3. Examine the reported content using the `targetType` and `targetId` to locate the original item.
4. Update the report status to `REVIEWING` by sending:
   ```json
   PATCH /v1/moderation/:reportId
   {
     "status": "REVIEWING"
   }
   ```

### Resolving or Dismissing a Report

1. After reviewing the content, decide on an outcome:
   - **Resolve** — the report is valid and action has been or will be taken (e.g., content deleted).
   - **Dismiss** — the report does not warrant action.
2. Update the report with the final status and a review note:
   ```json
   PATCH /v1/moderation/:reportId
   {
     "status": "RESOLVED",
     "reviewNote": "Content removed. User warned per community guidelines."
   }
   ```
   Or to dismiss:
   ```json
   PATCH /v1/moderation/:reportId
   {
     "status": "DISMISSED",
     "reviewNote": "Content reviewed and found compliant with guidelines."
   }
   ```

### Deleting Feed Posts or Comments

- The **author** of a post or comment can delete their own content at any time.
- A user with `moderation.manage` permission can delete any post or comment, typically as part of resolving a moderation report.

---

## System Behavior / What Users Should Expect

### Status Workflow

```
┌────────┐     ┌───────────┐     ┌──────────┐
│  OPEN  │────▶│ REVIEWING │────▶│ RESOLVED │
└────────┘     └───────────┘     └──────────┘
                     │
                     │           ┌───────────┐
                     └──────────▶│ DISMISSED │
                                 └───────────┘
```

| Status      | Description                                                       |
|-------------|-------------------------------------------------------------------|
| `OPEN`      | Report has been submitted and is awaiting moderator review.       |
| `REVIEWING` | A moderator has picked up the report and is actively reviewing it.|
| `RESOLVED`  | The report has been addressed and the issue is considered closed. |
| `DISMISSED` | The report was reviewed and determined to not require action.     |

- Reports always start at `OPEN`.
- A report must move to `REVIEWING` before it can be `RESOLVED` or `DISMISSED`.
- Once a report is `RESOLVED` or `DISMISSED`, it is considered final.
- All status transitions, reviewer assignments, and review notes are audit logged.

---

## Permissions Required

| Permission            | What It Grants                                         |
|-----------------------|--------------------------------------------------------|
| `conversation.write`  | Ability to create moderation reports                   |
| `moderation.manage`   | Full access to view, review, and manage all reports; delete feed posts/comments |

---

## Common Issues

| Issue                                          | Cause / Resolution                                                        |
|------------------------------------------------|---------------------------------------------------------------------------|
| `403 Forbidden` when listing reports           | Your account lacks the `moderation.manage` permission. Contact your admin.|
| `403 Forbidden` when creating a report         | Your account lacks the `conversation.write` permission.                   |
| Cannot find a report after submitting          | Reports are only visible to users with `moderation.manage`. The reporter does not receive a queue view. |
| Report stuck in `OPEN` status                  | No moderator has picked it up yet. Escalate to your organization admin.   |
| Cannot delete another user's post              | You need the `moderation.manage` permission to delete content you did not author. |

---

## Support Notes / Troubleshooting

- **Audit trail:** Every moderation action (report creation, status change, content deletion) is recorded in the audit log. If you need to investigate a moderation decision, consult the audit logs via the Compliance Exports feature.
- **Filtering reports:** Use the `status` query parameter on `GET /v1/moderation` to filter by report status (e.g., `?status=OPEN`, `?status=REVIEWING`).
- **No UI page:** Moderation is currently API-only. If your organization needs a moderation dashboard, build one using the API endpoints documented above, or contact Getswyft support for integration guidance.
- **Rate of reports:** If a single piece of content receives multiple reports, each report is tracked independently. Moderators should review related reports together to avoid duplicate effort.

---

## Related Pages

- [Compliance Exports](./compliance-exports.md) — Export audit logs that include moderation actions.
- [AI Features](./ai-features.md) — Use AI-powered content moderation to automatically flag content.
