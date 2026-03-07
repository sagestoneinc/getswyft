# Team Management and Roles

## Summary

The Team Management page provides tenant administrators with a centralized view of all team members and pending invitations. Administrators can view member details, edit roles, remove members, and search across the team. This page also displays each member's current presence status and conversation counts.

## Who Can Use This

This feature is available to **Tenant Admins** only. Users must have the `user.manage` permission to access the Team Management page. It is accessible from the sidebar under the **Admin** badge at `/app/team`.

## What It Does

Team Management gives administrators full visibility and control over who has access to the tenant. The page displays two lists: active team members and pending invitations. Administrators can adjust member roles, remove members, and monitor real-time agent presence — all from a single interface.

## Key Functions / Actions Available

- **View the team member list** — See all active members with their avatar, name, email, role, and presence indicator.
- **Edit a member's role** — Change a team member's role between Agent and Admin.
- **Remove a team member** — Delete a member from the tenant.
- **View pending invitations** — See all outstanding invitations with their email, status, and sent date.
- **Search the team** — Filter members and invitations by name or email.
- **Invite a new team member** — Open the invitation modal to send an invite (see [Invitations](invitations.md) for details).

## Step-by-Step How to Use It

### Viewing the Team

1. Navigate to **Team Management** (`/app/team`) from the sidebar.
2. The **Team Members** section displays all active members of the tenant, including:
   - **Avatar** — The member's profile image.
   - **Name** — The member's display name.
   - **Email** — The email address associated with the account.
   - **Role** — Either **Admin** (Tenant Admin) or **Agent** (Tenant User).
   - **Presence indicator** — Shows whether the member is currently online or offline.
3. The **Pending Invitations** section displays all invitations that have not yet been accepted or have expired.
4. Use the **search bar** to filter the list by name or email.

### Changing a Member's Role

1. On the Team Management page, locate the member whose role you want to change.
2. Click the **Edit** button next to the member's entry.
3. Select the new role:
   - **Admin** (Tenant Admin) — Full administrative access, including team management, routing settings, and all platform features.
   - **Agent** (Tenant User) — Access to conversations and the agent console. Cannot manage team members or routing settings.
4. Confirm the role change. The update takes effect immediately.

### Removing a Team Member

1. On the Team Management page, locate the member you want to remove.
2. Click the **Delete** button next to the member's entry.
3. Confirm the removal when prompted. The member will lose access to the tenant immediately.

## System Behavior / What Users Should Expect

### Roles

The platform defines two tenant-level roles:

| Role                     | Also Known As   | Permissions                                                                                       |
|--------------------------|-----------------|---------------------------------------------------------------------------------------------------|
| **Tenant Admin** (Admin) | Admin           | Full access to all tenant features, including team management (`user.manage`), routing settings (`tenant.manage`), and conversations. |
| **Agent**                | Tenant User     | Access to conversations and the agent console. Cannot manage team members or modify routing settings. |

### Presence Indicators

- Each team member's entry displays a **presence indicator** showing their current online or offline status.
- Presence is updated in real time and reflects whether the agent is actively connected to the platform.

### Conversation Counts

- The team member list includes conversation counts per member, giving administrators visibility into each agent's current workload.

### Search

- The search functionality filters both the team member list and the pending invitations list.
- Search matches against member names and email addresses.

## Permissions Required

| Action                     | Permission Required  |
|----------------------------|----------------------|
| View team members          | `user.manage`        |
| Edit a member's role       | `user.manage`        |
| Remove a team member       | `user.manage`        |
| View pending invitations   | `user.manage`        |
| Send a new invitation      | `user.manage`        |
| View assignable members    | `conversation.write` |
| View own roles/permissions | Any authenticated user |

## Common Issues

- **Cannot access the Team Management page** — Only Tenant Admins have the `user.manage` permission. If you cannot see the page in the sidebar, your account is set to the Agent role. Contact a Tenant Admin to update your role.
- **Member's presence shows as offline despite being active** — Presence relies on an active connection to the platform. If the member's browser tab is closed or their session has timed out, they will appear offline.
- **Role change not reflected immediately** — Role updates take effect immediately on the server. The affected user may need to refresh their browser to see updated navigation and permissions.
- **Cannot remove yourself** — Administrators cannot delete their own account from the team. Another administrator must perform this action.

## Support Notes / Troubleshooting

- The team member list and invitation list are fetched together from the same endpoint. If one list loads but the other does not, this may indicate a data issue — contact support.
- When a member's role is changed, their active sessions reflect the new permissions on the next page load or API call.
- Removing a member does not delete their historical conversation data. Past conversations and messages associated with the removed member are retained.
- The **assignable members** list (used when assigning conversations) may differ from the full team list, as it is scoped by the `conversation.write` permission.

## Related Pages

- [Invitations](invitations.md)
- [Routing Settings](routing-settings.md)
