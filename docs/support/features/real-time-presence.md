# Real-Time Presence

## Summary

The Real-Time Presence system provides live status tracking for all users within a tenant. Built on Socket.IO, it automatically detects when team members are online, away, busy, or offline and broadcasts status changes across the platform. It also powers typing indicators in conversations and channel join/leave events. No manual configuration is required — presence tracking begins automatically when a user connects.

## Who Can Use This

- All authenticated users within a tenant are automatically tracked by the presence system.
- Presence information is visible to other users in the same tenant.
- There are no special permissions required to have your presence tracked or to view the presence of other team members.

## What It Does

The Real-Time Presence system provides three core capabilities:

1. **User presence tracking** — Monitors and broadcasts the online status of every user in the tenant, displayed on the team page and in conversation headers.
2. **Typing indicators** — Shows when a user is actively typing a message in a conversation or channel, giving other participants real-time feedback.
3. **Channel events** — Tracks when users join or leave conversation and channel rooms, enabling the platform to manage room membership and deliver messages to the correct participants.

## Key Functions / Actions Available

| Function | Description |
|---|---|
| Automatic presence detection | User status is tracked and updated without manual action |
| Status display | Presence indicators appear on the team page and in conversation headers |
| Typing indicators | Real-time display of who is currently typing in a conversation |
| Channel join/leave tracking | Monitors user participation in conversation and channel rooms |
| Disconnect cleanup | Automatically updates status and records `lastSeenAt` when a user disconnects |

## Step-by-Step How to Use It

### How Presence Tracking Works

1. When you log in and open the application, a Socket.IO connection is established automatically.
2. Your status is set to **ONLINE** and broadcast to all other users in your tenant.
3. Your presence is tracked by the `PresenceSession` model, which maintains your current status, socket ID, and last activity timestamp.
4. Other team members can see your status on the **Team** page and in **conversation headers** where you are the assigned agent.
5. When you close the application or lose your network connection, the system automatically updates your status to **OFFLINE** and records your `lastSeenAt` timestamp.

### Presence Statuses

The system supports four presence statuses:

| Status | Meaning |
|---|---|
| **ONLINE** | The user is actively connected and available |
| **AWAY** | The user is connected but has been inactive |
| **BUSY** | The user is connected but has indicated they are not available for new interactions |
| **OFFLINE** | The user is not connected to the platform |

Status changes are broadcast to all users in the tenant via the `presence:update` event.

### How Typing Indicators Work

1. When you begin typing a message in a conversation or channel, a `typing:start` event is emitted through Socket.IO.
2. Other participants in that conversation or channel receive a `typing:update` broadcast showing that you are typing.
3. A typing indicator (e.g., "Alex is typing...") appears in the message area for other participants.
4. When you stop typing or send the message, a `typing:stop` event is emitted.
5. The typing indicator is removed for other participants.

Typing indicators are scoped to the specific conversation or channel room — only participants in that room see the indicator.

### Where Presence Appears in the UI

- **Team page:** Displays a list of all team members with their current presence status indicator (online, away, busy, or offline).
- **Conversation header:** Shows the presence status of the assigned agent, so other team members and supervisors can see whether the agent handling a conversation is currently available.

## System Behavior / What Users Should Expect

### Automatic Status Management

- Presence tracking is fully automatic. Users do not need to manually set their status to ONLINE or OFFLINE.
- When a user opens the application, their status is set to ONLINE.
- When a user closes the application, navigates away, or loses connectivity, the system detects the disconnection and updates their status to OFFLINE.

### Shared Event Contract

All presence events follow a consistent data structure:

| Field | Type | Description |
|---|---|---|
| `userId` | string | The unique identifier of the user whose status changed |
| `tenantId` | string | The tenant the user belongs to |
| `status` | string | The new presence status (ONLINE, AWAY, BUSY, OFFLINE) |
| `socketId` | string | The Socket.IO connection identifier for the session |
| `updatedAt` | timestamp | When the status change occurred |

This contract (`RealtimePresenceEvent`) is shared across all presence-related event broadcasts.

### Disconnect Cleanup

- When a Socket.IO connection is lost (e.g., browser closed, network interruption), the server performs automatic cleanup.
- The user's `PresenceSession` is updated with a `lastSeenAt` timestamp recording when the disconnection occurred.
- The user's status is changed to **OFFLINE** and a `presence:update` event is broadcast to all tenant users.
- If the user reconnects, a new presence session is created and their status returns to **ONLINE**.

### Channel Events

- When a user enters a conversation or channel, a `channel:join` event is emitted.
- When a user leaves a conversation or channel, a `channel:leave` event is emitted.
- These events are used internally to manage Socket.IO room membership, ensuring messages and typing indicators are delivered only to active participants.

### Tenant Isolation

- Presence events are scoped to the tenant. Users in one tenant cannot see the presence status of users in another tenant.
- All broadcasts of `presence:update` are limited to users within the same `tenantId`.

## Permissions Required

No special permissions are required for the real-time presence system. All authenticated users are automatically tracked, and their presence is visible to all other users within the same tenant.

## Common Issues

| Issue | Cause | Resolution |
|---|---|---|
| Status shows OFFLINE when user is active | Socket.IO connection may have dropped | Refresh the page to re-establish the WebSocket connection. Check network stability. |
| Typing indicator does not appear | The other user's client may not be emitting typing events | Ensure both users have a stable connection. Refresh the page if the issue persists. |
| Typing indicator is stuck / does not clear | The typing user's session disconnected before a `typing:stop` event was sent | The indicator should time out automatically. Refresh the conversation if it persists. |
| Status not updating on the team page | Browser tab may be throttled or connection interrupted | Bring the tab into focus and refresh. Ensure the application has an active WebSocket connection. |
| Presence shows stale data after reconnecting | The client may not have re-synced presence state | Refresh the page after reconnecting to pull the latest presence data. |

## Support Notes / Troubleshooting

- **No manual setup required:** The presence system works automatically for all authenticated users. There is no configuration needed at the user or tenant level.
- **Socket.IO dependency:** Real-time presence relies entirely on Socket.IO WebSocket connections. If WebSocket connections are blocked by a firewall or proxy, presence tracking will not function. Ensure your network allows WebSocket traffic.
- **Browser tab behavior:** Some browsers throttle background tabs, which can affect the timeliness of presence updates. If a user's status appears inaccurate, ask them to bring the application tab into focus.
- **lastSeenAt for offline users:** When a user is offline, the `lastSeenAt` timestamp indicates the last time they were connected. This can be useful for understanding how recently a team member was active.
- **Multiple sessions:** If a user has the application open in multiple browser tabs or devices, each tab maintains its own `PresenceSession`. The user's overall status reflects their most recently active session.
- **Typing indicator scope:** Typing indicators are only visible within the specific conversation or channel where the user is typing. They are not broadcast globally.

## Related Pages

- [Conversation Details and Messaging](./conversation-details-and-messaging.md) — Full conversation view including messaging, reactions, attachments, and calling
