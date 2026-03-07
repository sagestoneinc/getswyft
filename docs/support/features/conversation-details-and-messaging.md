# Conversation Details and Messaging

## Summary

The Conversation Detail page (`/app/conversation/:id`) is the primary workspace for managing individual conversations with leads and customers. It provides a real-time message thread, file attachments, emoji reactions, read receipts, typing indicators, notes, conversation assignment and transfer, and the ability to initiate outbound calls — all within a single unified view.

## Who Can Use This

- **Viewing conversations:** Users with the `conversation.read` permission.
- **Sending messages, modifying conversations, and performing actions:** Users with the `conversation.write` permission.

Team members who lack the required permissions will not be able to view or interact with conversations they are not authorized to access.

## What It Does

The Conversation Detail page centralizes all communication and context for a single conversation. It includes:

- **Real-time message thread** displaying messages from visitors, agents, and system-generated events.
- **Message reactions** allowing users to react to individual messages with emoji.
- **File attachments** for uploading and downloading documents, images, and other files.
- **Conversation header** showing the customer name, conversation status, assigned agent, and a quick action menu.
- **Lead details sidebar** with property listing information and customer contact details.
- **Notes** for adding and editing internal notes on the conversation.
- **Assignment and transfer** controls to assign or reassign conversations to team members.
- **Call functionality** to initiate outbound calls directly from the conversation.
- **Read receipts** to track message delivery and read status.
- **Typing indicators** showing when another participant is actively typing.

## Key Functions / Actions Available

| Action | Description |
|---|---|
| Send a message | Compose and send a text message to the conversation |
| Attach files | Upload up to 5 file attachments per message |
| React to a message | Add or remove an emoji reaction on any message |
| Mark as read | Automatically mark all messages in the conversation as read |
| Assign conversation | Assign the conversation to a specific team member |
| Transfer conversation | Transfer the conversation to a different team member |
| Update status | Change the conversation status (e.g., open, closed, pending) |
| Add/edit notes | Write or update internal notes on the conversation |
| Initiate a call | Start an outbound call to the customer via Telnyx |
| Mute/unmute mic | Toggle microphone during an active call |
| End call | Terminate an active call |
| Download attachment | Download a file that was previously attached to a message |

## Step-by-Step How to Use It

### Sending a Message

1. Navigate to the conversation at `/app/conversation/:id`.
2. Locate the message input area at the bottom of the message thread.
3. Type your message in the text area.
4. Click the **Send** button or press **Enter** to send.
5. The message appears in the thread immediately and is delivered in real time to other participants.

### Attaching a File

1. In the message input area, click the **attachment button** (paperclip icon).
2. Select one or more files from your device. You may attach up to **5 files** per message.
3. The selected files are displayed as pending attachments in the input area.
4. Add an optional text message, then click **Send**.
5. Attachments are uploaded and stored with metadata including storage key, content type, and file size (tracked via the `MessageAttachment` model).
6. Recipients can click on any attachment in the message thread to download it.

### Adding a Reaction to a Message

1. Hover over the message you want to react to.
2. Click the **reaction icon** or open the **emoji picker**.
3. Select an emoji reaction (e.g., 👍, ❤️, 👀).
4. The reaction is toggled on the message. If you have already reacted with the same emoji, clicking it again removes your reaction.
5. Reactions are visible to all participants in the conversation.

### Assigning or Transferring a Conversation

1. Open the conversation detail page.
2. In the conversation header, click the **quick action menu** or the **assigned agent** indicator.
3. Select **Assign** or **Transfer**.
4. Choose the team member you want to assign or transfer the conversation to.
5. Confirm the action. The conversation is reassigned, and the new assignee receives a notification.

### Updating Conversation Status

1. In the conversation header or quick action menu, locate the **status** control.
2. Select the desired status (e.g., close or reopen the conversation).
3. The status change is saved immediately. Webhooks and notifications are triggered automatically.

### Adding or Editing Notes

1. Locate the **Notes** section in the conversation detail view or lead details sidebar.
2. Click on the notes field to begin editing.
3. Enter or update your internal notes.
4. Notes are saved and visible to authorized team members.

### Initiating a Call

1. In the conversation detail page, click the **Call** button.
2. An outbound call is initiated to the customer via Telnyx.
3. Once connected, use the **mute/unmute** toggle to control your microphone.
4. To end the call, click the **End Call** button.
5. Call status is displayed in the conversation view throughout the call lifecycle.

## System Behavior / What Users Should Expect

### Real-Time Message Delivery

- Messages sent by any participant appear in the thread instantly for all connected users via Socket.IO.
- There is no need to refresh the page to see new messages.

### Message Sender Types

Each message in the thread is labeled with one of three sender types:

| Sender Type | Description |
|---|---|
| **Visitor** | The external lead or customer participating in the conversation |
| **Agent** | A team member responding on behalf of the organization |
| **System** | Automated messages generated by the platform (e.g., status changes, assignment notifications) |

### Read Receipts

- When you open a conversation, all messages are automatically marked as read via `POST /conversations/:id/read`.
- Read status is tracked per message using the `MessageReceipt` model, which records both `deliveredAt` and `readAt` timestamps.
- Other participants can see when their messages have been read.

### Typing Indicators

- When you begin typing in the message input, a `typing:start` event is emitted via Socket.IO.
- When you stop typing, a `typing:stop` event is emitted.
- Other participants in the conversation see a typing indicator showing who is currently composing a message.
- Typing status is broadcast as a `typing:update` event to all users in the conversation room.

### Reactions

- Reactions are toggled per user. Clicking the same emoji a second time removes your reaction.
- The reaction endpoint (`POST /messages/:id/reactions`) handles both adding and removing reactions in a single toggle action.

### Notifications and Webhooks

- Changes to conversation status, assignee, or notes via `PATCH /conversations/:id` trigger webhook events and in-app notifications to relevant team members.
- New messages may also trigger notifications depending on tenant notification settings.

### File Attachments

- Uploaded files are stored with metadata tracked by the `MessageAttachment` model, including `storageKey`, `contentType`, and `size`.
- Attachments can be downloaded by any participant with access to the conversation.

### Call Functionality

- Outbound calls are initiated via `POST /conversations/:id/call`, which connects through the Telnyx telephony provider.
- Call status updates are reflected in the conversation view in real time.
- Microphone mute/unmute is available during active calls.

## Permissions Required

| Permission | Grants Access To |
|---|---|
| `conversation.read` | View the conversation detail page, message thread, attachments, notes, and lead details |
| `conversation.write` | Send messages, attach files, react to messages, assign/transfer conversations, update status, edit notes, initiate calls |

Users without `conversation.read` cannot access the conversation detail page. Users with `conversation.read` but without `conversation.write` can view the conversation but cannot send messages or make changes.

## Common Issues

| Issue | Cause | Resolution |
|---|---|---|
| Messages not appearing in real time | WebSocket connection may be interrupted | Refresh the page to re-establish the Socket.IO connection. Check your network connection. |
| Cannot send a message | Missing `conversation.write` permission | Contact your administrator to request the required permission. |
| File upload fails | File exceeds size limits or unsupported format | Verify the file meets upload requirements. Try a smaller file or a different format. |
| Reactions not saving | Network issue or session timeout | Refresh the page and try again. Ensure you are logged in. |
| Call button not working | Telnyx integration may not be configured for your tenant | Contact your administrator to verify telephony configuration. |
| Typing indicator stuck | The other user's session may have disconnected unexpectedly | The indicator should clear automatically after a short timeout. Refresh if it persists. |
| Cannot assign conversation | Missing permission or the target agent is not available | Verify you have `conversation.write` permission and that the target agent is an active team member. |

## Support Notes / Troubleshooting

- **Message pagination:** The message thread supports pagination. The API returns between 200 and 500 messages per request via `GET /conversations/:id/messages`. Scroll up in the thread to load older messages.
- **Attachment limits:** Each message supports a maximum of 5 file attachments. If you need to send more files, send them across multiple messages.
- **Call quality:** Call quality depends on your network connection and the Telnyx service. If you experience audio issues, check your microphone permissions and network stability.
- **Read receipts not updating:** If read receipts appear delayed, this may be due to the recipient's client not having sent the read confirmation yet. Read receipts are processed when the recipient opens the conversation.
- **Webhook failures:** If downstream systems are not receiving conversation update events, verify the webhook endpoint configuration in your tenant settings.
- **Session timeout:** If your session expires, you will need to log in again. Unsent message drafts may be lost.

## Related Pages

- [Real-Time Presence](./real-time-presence.md) — Presence statuses, typing indicators, and channel events
