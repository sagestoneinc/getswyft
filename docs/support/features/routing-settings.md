# Routing Settings

## Summary

The Routing Settings page allows tenant administrators to control how incoming conversations are assigned to agents. Administrators can select a routing mode, define office hours, set a timezone, and designate a fallback agent for after-hours or overflow scenarios.

## Who Can Use This

This feature is available to **Tenant Admins** only. Users must have the `tenant.manage` permission to access or modify routing settings. The Routing Settings page is accessible from the sidebar under the **Admin** badge at `/app/routing`.

## What It Does

Routing settings determine how the platform distributes incoming conversations among your team. The system supports three routing modes, each suited to different team structures and workflows. Combined with office hours and a fallback agent, these settings give administrators full control over conversation assignment both during and outside business hours.

## Key Functions / Actions Available

- **Select a routing mode** — Choose between Manual, First Available, or Round Robin assignment.
- **Configure office hours** — Define working hours for each day of the week (Monday through Sunday), with individual start and end times per day.
- **Set a timezone** — Specify the timezone that office hours should follow.
- **Designate a fallback agent** — Assign a specific agent to handle conversations that arrive outside of office hours or when no agents are available.

## Step-by-Step How to Use It

### Changing the Routing Mode

1. Navigate to **Routing Settings** (`/app/routing`) from the sidebar.
2. Locate the **Routing Mode** selector.
3. Choose one of the three available modes:
   - **Manual** — An administrator manually assigns each conversation to an agent.
   - **First Available** — The system automatically assigns incoming conversations to the first available agent.
   - **Round Robin** — The system automatically assigns conversations to agents in rotation, distributing workload evenly.
4. Save your changes.

### Setting Office Hours

1. On the Routing Settings page, locate the **Office Hours** section.
2. For each day of the week (Monday through Sunday), set a **start time** and **end time** to define working hours.
3. To mark a day as closed, leave the hours unconfigured or disable that day if the option is available.
4. Save your changes. Office hours take effect immediately based on the configured timezone.

### Configuring the Timezone

1. On the Routing Settings page, locate the **Timezone** selector.
2. Choose the timezone that matches your team's operating location.
3. Save your changes. All office hour calculations will use this timezone.

### Setting a Fallback Agent

1. On the Routing Settings page, locate the **Fallback Agent** selector.
2. Choose a team member from the list to serve as the fallback agent.
3. Save your changes. The fallback agent will receive conversations that arrive outside of configured office hours or when no other agents are available.

## System Behavior / What Users Should Expect

### Manual Mode

- Incoming conversations are **not** automatically assigned to any agent.
- An administrator must manually assign each conversation to an agent from the conversation view.
- This mode is best suited for small teams or situations where an administrator needs direct control over workload distribution.

### First Available Mode

- The system automatically assigns each incoming conversation to the **first available agent**.
- Agent availability is determined by the platform's presence tracking.
- If no agents are currently available, the conversation is routed to the designated fallback agent.

### Round Robin Mode

- The system automatically assigns incoming conversations to agents in a **rotating sequence**.
- The platform tracks the last assigned agent (`lastAssignedAgentId`) and assigns the next conversation to the following agent in the rotation.
- This mode distributes conversations evenly across all eligible agents over time.
- If no agents are available in the rotation, the conversation is routed to the fallback agent.

### Office Hours Behavior

- During configured office hours, the selected routing mode operates as described above.
- Outside of office hours, incoming conversations are routed to the **fallback agent** regardless of the active routing mode.
- If no fallback agent is configured, conversations received outside of office hours remain unassigned until an agent or administrator claims them.

## Permissions Required

| Action                  | Permission Required |
|-------------------------|---------------------|
| View routing settings   | `tenant.manage`     |
| Update routing mode     | `tenant.manage`     |
| Configure office hours  | `tenant.manage`     |
| Set timezone            | `tenant.manage`     |
| Set fallback agent      | `tenant.manage`     |

## Common Issues

- **Changes not taking effect** — Ensure you have saved your changes after modifying any setting. Unsaved changes are discarded when navigating away from the page.
- **Office hours seem incorrect** — Verify that the correct timezone is selected. Office hours are evaluated against the configured timezone, not the user's local browser time.
- **Conversations not being assigned automatically** — Confirm that the routing mode is set to First Available or Round Robin. In Manual mode, conversations require explicit assignment by an administrator.
- **Fallback agent not receiving conversations** — Check that a fallback agent is configured and that the selected user is still an active member of the tenant.

## Support Notes / Troubleshooting

- The Routing Settings page is also accessible from the **Agent Console** for administrators.
- Only users with the `tenant.manage` permission (Tenant Admins) can view or modify routing settings. If a user cannot see the Routing Settings page in the sidebar, confirm their role is set to Admin.
- Routing configuration is stored per tenant. Each tenant maintains its own independent routing mode, office hours, timezone, and fallback agent.
- If the fallback agent leaves the team or is removed, the fallback agent field should be updated to another active team member to prevent unassigned conversations outside of office hours.

## Related Pages

- [Team Management and Roles](team-management-and-roles.md)
- [Invitations](invitations.md)
