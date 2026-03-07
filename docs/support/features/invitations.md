# Invitations

## Summary

The invitation system allows tenant administrators to invite new team members by email. Invitations include a secure token that is valid for 7 days, after which the invitation expires. Administrators can resend or revoke invitations at any time from the Team Management page.

## Who Can Use This

This feature is available to **Tenant Admins** only. Users must have the `user.manage` permission to send, resend, or revoke invitations. Invitations are managed from the **Team Management** page at `/app/team`.

## What It Does

Invitations allow administrators to onboard new users to the tenant without requiring manual account creation. When an invitation is sent, the recipient receives an email with a link to join the tenant. The invitation specifies the role the new member will be assigned upon acceptance. Administrators retain full control over the invitation lifecycle, including the ability to resend invitations that may have been missed and revoke invitations that are no longer needed.

## Key Functions / Actions Available

- **Invite a new team member** — Send an invitation email with a specified role.
- **Resend an invitation** — Re-send the invitation email to the same recipient.
- **Revoke an invitation** — Cancel a pending invitation so it can no longer be accepted.
- **View invitation status** — Monitor whether an invitation is pending, accepted, revoked, or expired.

## Step-by-Step How to Use It

### Inviting a New Team Member

1. Navigate to **Team Management** (`/app/team`) from the sidebar.
2. Click the **Invite** button to open the invitation modal.
3. Enter the new member's **email address**.
4. Select a **role** for the new member:
   - **Admin** (Tenant Admin) — Full administrative access to the tenant.
   - **Agent** (Tenant User) — Access to conversations and the agent console.
5. Submit the invitation. The system generates a secure token and sends an invitation email to the specified address.
6. The invitation appears in the **Pending Invitations** list with a status of **PENDING**.

### Resending an Invitation

1. On the Team Management page, scroll to the **Pending Invitations** section.
2. Locate the invitation you want to resend.
3. Click the **Resend** action on the invitation entry.
4. A new invitation email is sent to the recipient. This is useful if the original email was missed or ended up in spam.

### Revoking an Invitation

1. On the Team Management page, scroll to the **Pending Invitations** section.
2. Locate the invitation you want to revoke.
3. Click the **Revoke** action on the invitation entry.
4. The invitation status changes to **REVOKED**. The recipient can no longer use the invitation link to join the tenant.

## System Behavior / What Users Should Expect

### Invitation Statuses

| Status       | Description                                                                                     |
|--------------|-------------------------------------------------------------------------------------------------|
| **PENDING**  | The invitation has been sent and is awaiting acceptance. The token is still valid.               |
| **ACCEPTED** | The recipient has accepted the invitation and has been added to the tenant with the specified role. |
| **REVOKED**  | An administrator has revoked the invitation. The token is no longer valid.                       |
| **EXPIRED**  | The invitation token has passed its 7-day validity period and can no longer be used.             |

### Token Validity

- Each invitation generates a unique, secure token that is valid for **7 days** from the time of creation.
- After 7 days, the token expires automatically and the invitation status changes to **EXPIRED**.
- If a user attempts to accept an expired invitation, they will be informed that the link is no longer valid. The administrator must resend the invitation to generate a new token.

### Email Delivery

- In **production environments**, invitation emails are sent via **Resend**, a transactional email service.
- In **development environments**, invitation emails are **logged to the console** instead of being sent. This allows developers to test the invitation flow without requiring a mail service.
- The invitation email contains a link that directs the recipient to the platform, where they can create an account or sign in to accept the invitation.

### Acceptance Behavior

- When a recipient clicks the invitation link and completes the sign-up or sign-in process, they are automatically added to the tenant with the role specified in the invitation.
- The invitation status changes to **ACCEPTED** upon successful onboarding.
- Each invitation can only be accepted once.

## Permissions Required

| Action                | Permission Required |
|-----------------------|---------------------|
| Send an invitation    | `user.manage`       |
| Resend an invitation  | `user.manage`       |
| Revoke an invitation  | `user.manage`       |
| View invitations list | `user.manage`       |
| Accept an invitation  | No permission required (public link) |

## Common Issues

- **Recipient did not receive the invitation email** — Ask the recipient to check their spam or junk folder. If the email is not found, use the Resend action to send a new invitation email. In development environments, emails are logged to the server console and are not delivered to the recipient.
- **Invitation link is not working** — The invitation may have expired. Tokens are valid for 7 days. Check the invitation status on the Team Management page. If the status is EXPIRED, resend the invitation to generate a new token.
- **Invitation shows as REVOKED** — An administrator has cancelled this invitation. If the invitation should still be active, send a new invitation to the same email address.
- **User accepted the invitation but does not appear in the team list** — Ensure the user completed the full sign-up or sign-in process after clicking the invitation link. If the issue persists, contact support.
- **Cannot invite an email address that is already a team member** — The platform may prevent duplicate invitations for email addresses that are already associated with an active member of the tenant.

## Support Notes / Troubleshooting

- Invitation data is stored in the `TenantInvitation` model, which tracks the email, token, status, assigned role, and expiration date.
- Expired invitations remain in the system for auditing purposes and are visible in the Pending Invitations list with an EXPIRED status.
- Revoking an invitation invalidates the token immediately. Even if the recipient clicks the link before the 7-day expiry, they will not be able to join the tenant.
- If a user needs to be re-invited after a revoked or expired invitation, the administrator should send a new invitation. The system generates a fresh token for each invitation.
- In production, ensure that the Resend email service is properly configured. If invitation emails are not being delivered, verify the service configuration and check for delivery errors in the application logs.

## Related Pages

- [Team Management and Roles](team-management-and-roles.md)
- [Routing Settings](routing-settings.md)
