# Agent Console

## Summary

The Getswyft agent console is a separate React application that support agents use to manage and respond to visitor conversations. It provides a real-time inbox, individual chat views, conversation lifecycle management (assign, close, reopen), and routing configuration — all connected via WebSockets for instant updates.

This is a standalone application, distinct from the main Getswyft website dashboard. It is built with React 19, TypeScript, Vite, and Socket.IO.

## Who Can Use This

- **Support agents** — authenticated users who respond to visitor inquiries from the widget.
- **Team leads / administrators** — users who configure routing settings such as routing mode, office hours, timezone, and fallback agent assignments.

## What It Does

The agent console provides the following capabilities:

- **Agent authentication** — agents log in with an email and password. The `loginAgent` API call returns an `agentJwt` and `agentId` used for all subsequent API calls and socket connections.
- **Conversation inbox** — the conversation list displays all conversations organized into three tabs:
  - **Unassigned** — new conversations that have not been claimed by an agent.
  - **Mine** — conversations assigned to the currently logged-in agent.
  - **Closed** — conversations that have been resolved and closed.
- **Conversation cards** — each card in the inbox shows the lead's name, email, phone number, associated listing information, a preview of the last message, and badges for after-hours and unassigned status.
- **Real-time chat view** — selecting a conversation opens a threaded message view with a message composer for sending replies. Messages arrive in real time via WebSocket events.
- **Conversation actions** — agents can assign a conversation to themselves, close a resolved conversation, or reopen a previously closed conversation.
- **Routing settings** — administrators can configure the routing mode (`manual`, `first_available`, or `round_robin`), set office hours per day of the week, choose a timezone, and designate a fallback agent.
- **Socket connectivity** — the console maintains a persistent Socket.IO connection for real-time events. The health check display and socket connection status are shown in the interface.

## Key Functions / Actions Available

| Action | Description |
|---|---|
| Log in | Authenticate with email and password to access the console. |
| View inbox | Browse conversations across Unassigned, Mine, and Closed tabs. |
| Open a conversation | Select a conversation card to view the full message thread. |
| Send a reply | Type and send a message to the visitor in real time. |
| Assign to me | Claim an unassigned conversation so it appears in your "Mine" tab. |
| Close conversation | Mark a conversation as resolved and move it to the Closed tab. |
| Reopen conversation | Restore a closed conversation to active status. |
| Configure routing | Set the routing mode, office hours, timezone, and fallback agent. |

## Step-by-Step How to Use It

### Logging In

1. Navigate to the agent console application URL.
2. On the login page, enter your registered email address and password.
3. Click **Log In**. The system calls the `loginAgent` API and returns an `agentJwt` and `agentId`.
4. Upon successful authentication, you are redirected to the conversation inbox.

### Managing Conversations

5. **View the inbox** — the conversation list loads automatically. Use the tabs to switch between **Unassigned**, **Mine**, and **Closed** views.
6. **Select a conversation** — click a conversation card to open the chat view. The full message history loads via the `fetchMessages` API call and the `conversation.history` socket event.
7. **Send a reply** — type your message in the composer at the bottom of the chat view and press Send. The message is sent via `postMessage` and appears in the visitor's widget in real time.
8. **Assign the conversation to yourself** — if the conversation is unassigned, click the **Assign to Me** action. This calls `patchConversation` to update the assignment and moves the conversation to your "Mine" tab.
9. **Close the conversation** — when the issue is resolved, click the **Close** action. The conversation moves to the Closed tab.
10. **Reopen a conversation** — if a closed conversation requires further attention, open it from the Closed tab and click **Reopen**. The conversation returns to active status.

### Configuring Routing Settings

11. Navigate to the **Routing Settings** page.
12. Select a routing mode:
    - **Manual** — agents manually claim conversations from the Unassigned tab.
    - **First Available** — new conversations are automatically assigned to the first available agent.
    - **Round Robin** — new conversations are distributed evenly across available agents.
13. Set **office hours** for each day of the week. Conversations received outside these hours trigger the after-hours flow in the widget.
14. Choose the appropriate **timezone** for your team.
15. Optionally designate a **fallback agent** who receives conversations when no other agents are available.
16. Save the settings. Changes are applied via the `updateRoutingSettings` API call.

## System Behavior / What Users Should Expect

- The console establishes a Socket.IO connection on login using the `agentJwt`. The connection status is displayed in the interface.
- New conversations and messages appear in real time without requiring a manual refresh. The `message.created` and `conversation.history` socket events drive live updates.
- Agents join and leave conversation rooms via socket events when opening and closing chat views.
- The inbox automatically reflects assignment and status changes made by any agent in real time.
- Conversation cards display contextual badges: an **after-hours** badge when the visitor contacted outside office hours, and an **unassigned** badge when no agent has claimed the conversation.
- A health check display confirms the API server is reachable and operational.

## Permissions Required

- **Agent authentication** is required. Only users with valid agent credentials can access the console.
- The `agentJwt` returned at login authorizes all API calls and socket connections.
- Routing settings configuration may be restricted to users with administrative privileges, depending on your team's configuration.

## Common Issues

| Issue | Cause | Resolution |
|---|---|---|
| Login fails | Incorrect email or password, or the API is unreachable. | Verify credentials and confirm the API server is running at the configured `VITE_API_BASE_URL`. |
| Conversations not loading | API connectivity issue or expired JWT. | Check the network connection and try logging out and back in to refresh the token. |
| Messages not appearing in real time | WebSocket connection may have dropped. | Check the socket connection status indicator. If disconnected, refresh the page to re-establish the connection. |
| "Assign to Me" not working | The conversation may have already been assigned by another agent. | Refresh the inbox to see the latest assignment status. |
| Routing settings not saving | API error or insufficient permissions. | Verify you have administrative access and that the API server is responding. Check browser developer tools for error details. |
| After-hours badge showing incorrectly | Office hours or timezone may be misconfigured. | Review the office hours and timezone settings on the Routing Settings page. |

## Support Notes / Troubleshooting

- **Separate application**: the agent console is a standalone application, not part of the main Getswyft website dashboard. It has its own deployment and URL.
- **Environment variables**: the console requires `VITE_API_BASE_URL` (API server URL), `VITE_WS_BASE_URL` (WebSocket server URL), and `VITE_SOCKET_TOKEN` (socket authentication token).
- **API helper functions**: the console uses dedicated API helpers — `loginAgent`, `fetchConversations`, `fetchMessages`, `postMessage`, `patchConversation`, `fetchRoutingSettings`, and `updateRoutingSettings`.
- **Technology stack**: React 19, TypeScript, Vite, Socket.IO.
- **Health check**: the console displays a health check status and socket connection indicator to help diagnose connectivity issues.

## Related Pages

- [Visitor Widget](widget.md) — the embeddable widget that visitors use to start conversations.
- [File Uploads and Storage](file-uploads-and-storage.md) — details on file attachment handling and storage configuration.
