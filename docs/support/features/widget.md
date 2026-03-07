# Visitor Widget

## Summary

The Getswyft visitor widget is an embeddable React application designed for real estate listing pages. It allows site visitors to start real-time conversations with agents directly from a property listing. The widget handles session creation, real-time messaging over WebSockets, after-hours detection, and file attachments — all within a lightweight, themeable interface.

The widget is currently a runtime shell with full API and WebSocket bootstrapping. It is deployed as a separate service and embedded on listing pages.

## Who Can Use This

- **Site visitors** — anyone browsing a real estate listing page where the widget is embedded.
- **Website administrators** — teams responsible for embedding the widget on listing pages and configuring its environment.

## What It Does

The visitor widget provides an end-to-end communication channel between listing-page visitors and support agents:

- **Session creation** — when a visitor opens the widget and submits their information, a session is created. The API returns a `visitorJwt`, a `conversationId`, and an `afterHours` flag indicating whether the request falls outside office hours. **Note:** The widget session creation endpoint (`POST /v1/widget/session`) is not yet implemented in the API server. The widget currently bootstraps sessions through the existing authentication and conversation creation endpoints.
- **Real-time messaging** — the widget connects to the server over Socket.IO using the `visitorJwt`. Messages are delivered in real time through the `message.created` socket event, and conversation history is loaded via the `conversation.history` event.
- **Message sending** — outbound messages are sent via `POST /v1/conversations/:id/messages` with the visitor's JWT as a Bearer token. The widget uses optimistic delivery with client-side UUIDs so messages appear instantly in the chat view.
- **After-hours detection** — when the session is created outside configured office hours, the widget displays an after-hours form instead of the live chat view.
- **File attachments** — visitors can attach files to messages through the file attachment button in the chat interface.
- **Theme support** — the widget supports light and dark themes.

Internally, the `useChat` hook manages the full lifecycle: session initialization, message state, WebSocket connection, and message sending.

## Key Functions / Actions Available

| Action | Description |
|---|---|
| Open widget | Click the widget button on the listing page to expand the chat interface. |
| Submit pre-chat form | Enter name, email, and optional phone number to start a session. |
| Send a message | Type a message and send it to the assigned agent in real time. |
| Attach a file | Use the file attachment button to upload and send a file with a message. |
| View after-hours notice | If contacting outside office hours, the after-hours form is displayed automatically. |
| Initiate a voice call | Use the voice call interface when available (shown in the widget demo). |

## Step-by-Step How to Use It

1. **Land on a listing page** — navigate to a real estate listing page where the Getswyft widget is embedded.
2. **Open the widget** — click the chat button in the corner of the page. The widget expands from its closed state.
3. **Fill out the pre-chat form** — enter your name, email address, and optionally a phone number, then submit the form.
4. **Session is created** — behind the scenes, the widget creates a session through the existing authentication and conversation creation endpoints and receives a `visitorJwt`, `conversationId`, and `afterHours` flag. (The dedicated `POST /v1/widget/session` endpoint is not yet implemented.)
   - If `afterHours` is `true`, the widget displays the after-hours form instead of live chat. You can leave a message that agents will see when they return.
   - If `afterHours` is `false`, the widget opens the live chat view.
5. **Chat with an agent** — type messages in the composer and press Send. Messages appear immediately via optimistic delivery. Agent replies arrive in real time through the WebSocket connection.
6. **Attach files (optional)** — click the file attachment button to upload a file alongside your message.
7. **End the conversation** — close the widget by clicking the close button. The conversation remains available to agents in the agent console.

## System Behavior / What Users Should Expect

- The widget establishes a Socket.IO connection using the `visitorJwt` returned during session creation.
- Conversation history is loaded automatically when the chat view opens (via the `conversation.history` socket event).
- New messages from agents appear in real time without requiring a page refresh (via the `message.created` socket event).
- Messages sent by the visitor are displayed immediately using optimistic delivery. If a send fails, the message is marked accordingly.
- Each message is assigned a client-side UUID to prevent duplicates.
- If the visitor is outside office hours, the widget transitions to the after-hours form automatically.
- The widget gracefully handles connection errors and displays an error state if connectivity is lost.

## Permissions Required

No authentication is required for visitors. The widget session endpoint is publicly accessible. Once a session is created, the returned `visitorJwt` grants scoped access to that specific conversation.

## Common Issues

| Issue | Cause | Resolution |
|---|---|---|
| Widget does not appear on the page | The widget embed script is missing or misconfigured. | Verify the embed snippet is present on the page. If you deployed the widget, confirm that `VITE_API_BASE_URL` and `VITE_WS_BASE_URL` were set correctly at build time. |
| "Connection error" state displayed | The WebSocket connection could not be established. | Contact the widget deployment team to verify that the WebSocket server is reachable and that `VITE_SOCKET_TOKEN` is valid. |
| Messages not sending | The visitor JWT may have expired or the API is unreachable. | Refresh the page to create a new session. If the problem persists, verify the API server is running. |
| After-hours form shown unexpectedly | Office hours may be misconfigured in routing settings. | Ask an administrator to review the office hours configuration in the agent console routing settings. |
| File attachment fails | The file may exceed the 25 MB size limit or the storage service is unavailable. | Try a smaller file. If the problem continues, check the storage service configuration. |

## Support Notes / Troubleshooting

- **Widget demo page**: an interactive demonstration of all widget states is available at `/widget-demo`. It showcases the closed state, pre-chat form, chat view, after-hours form, voice call interface, and error state, with a light/dark theme toggle.
- **Environment variables**: the widget requires three environment variables — `VITE_API_BASE_URL` (API server URL), `VITE_WS_BASE_URL` (WebSocket server URL), and `VITE_SOCKET_TOKEN` (authentication token for socket connections).
- **Embedding**: the widget is deployed as a standalone service and embedded on listing pages via a script tag. It runs independently from the main website application.
- **Technology stack**: React 19, TypeScript, Vite, Socket.IO.

## Related Pages

- [Agent Console](agent-console.md) — the application agents use to respond to widget conversations.
- [File Uploads and Storage](file-uploads-and-storage.md) — details on file attachment handling and storage configuration.
