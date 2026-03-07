# Channels

## Summary

Channels provide organized group communication spaces within the Getswyft platform. They allow teams and tenants to collaborate through persistent, topic-based conversations with support for threaded replies, emoji reactions, and role-based membership. Channels are accessed through the messaging context rather than a standalone page.

## Who Can Use This

- **All authenticated users** with the `conversation.read` permission can view channels and messages.
- **Users with the `conversation.write` permission** can create channels, send messages, and manage membership.
- **Channel Owners and Admins** have additional privileges to update channel settings and manage members.
- **Tenant Admins** can modify any channel within their tenant regardless of channel role.

## What It Does

Channels are shared communication spaces that organize conversations by topic, team, or purpose. Each channel has a name, description, optional topic, and one of three types:

| Channel Type | Description |
|---|---|
| **PUBLIC** | Visible and joinable by any member of the tenant. |
| **PRIVATE** | Visible only to invited members. Requires an explicit invitation to join. |
| **DIRECT** | A private conversation space between two or more specific users. |

Channels support:

- **Persistent messaging** — Messages are stored and accessible to all channel members.
- **Threaded replies** — Reply to a specific message to create a focused sub-conversation.
- **Emoji reactions** — React to any message with an emoji to provide quick feedback.
- **Role-based membership** — Members are assigned roles that determine their level of control.
- **Real-time updates** — Socket.IO integration delivers messages and typing indicators instantly.
- **Archiving** — Channels can be archived to preserve history while preventing new activity.

## Key Functions / Actions Available

- Create a new channel (public, private, or direct).
- Update channel name, description, topic, or archived status.
- Add and remove channel members.
- Send messages within a channel.
- Reply to messages in threads.
- Toggle emoji reactions on messages.
- Join and leave channels in real time via Socket.IO.
- View typing indicators when other members are composing messages.

## Step-by-Step How to Use It

### Creating a Channel

1. Navigate to the messaging context within the Getswyft platform.
2. Select the option to create a new channel.
3. Provide a **name** for the channel. A URL-friendly slug is generated automatically.
4. Choose the channel **type**: Public, Private, or Direct.
5. Optionally add a **description** to help members understand the channel's purpose.
6. Confirm creation. You are automatically assigned the **Owner** role.

### Adding Members to a Channel

1. Open the channel you own or administer.
2. Select the option to add members.
3. Search for and select the user(s) you want to add.
4. Confirm the addition. New members are assigned the **Member** role by default.
5. Added members immediately gain access to the channel and its message history.

### Sending Messages

1. Open a channel you are a member of.
2. Type your message in the message input area.
3. Send the message. It is delivered in real time to all online channel members.
4. Messages are paginated — scroll up to load older messages (pages of 50–100 messages).

### Using Threaded Replies

1. Locate the message you want to reply to within the channel.
2. Select the reply or thread option on that message.
3. Type your threaded reply. The reply is linked to the parent message via `parentMessageId`.
4. Send the reply. It appears in the thread context beneath the original message.
5. Threaded replies keep focused discussions organized without cluttering the main channel feed.

### Reacting to Messages

1. Hover over or select a message in the channel.
2. Choose the reaction option.
3. Select an emoji. The reaction is toggled — selecting the same emoji again removes it.
4. Reactions are visible to all channel members in real time.

### Real-Time Events

- When you open a channel, a `channel:join` event is emitted to notify other members.
- When you leave or navigate away, a `channel:leave` event is emitted.
- Typing indicators are broadcast via `typing:start` and `typing:stop` events, scoped to the specific `channelId`.

## System Behavior / What Users Should Expect

- **Slug generation** — Each channel is assigned a unique, URL-friendly slug derived from its name.
- **Pagination** — Message lists are paginated with a default limit between 50 and 100 messages per page. Scroll or request additional pages to view older messages.
- **Real-time delivery** — Messages, reactions, and typing indicators are delivered instantly to connected members via Socket.IO.
- **Archiving** — When a channel is archived, it remains visible for history but no new messages can be sent. Only Owners, Admins, or Tenant Admins can archive or unarchive a channel.
- **No standalone channel page** — Channels are accessed and managed within the messaging context of the Getswyft platform. There is no dedicated standalone channel page in the website UI.
- **Reaction toggling** — Reacting with the same emoji a second time removes the reaction. Each user can have one instance of each emoji per message.

## Permissions Required

| Action | Required Permission | Additional Requirement |
|---|---|---|
| View channels and messages | `conversation.read` | Must be a member of the channel (for Private and Direct types) |
| Create a channel | `conversation.write` | — |
| Send a message | `conversation.write` | Must be a member of the channel |
| Reply in a thread | `conversation.write` | Must be a member of the channel |
| Toggle a reaction | `conversation.write` | Must be a member of the channel |
| Update channel settings | `conversation.write` | Must be Owner, Admin, or Tenant Admin |
| Add a member | `conversation.write` | Must be Owner, Admin, or Tenant Admin |
| Remove a member | `conversation.write` | Must be Owner, Admin, or Tenant Admin |

### Channel Member Roles

| Role | Capabilities |
|---|---|
| **Owner** | Full control over the channel, including updating settings, managing members, and archiving. Assigned to the channel creator. |
| **Admin** | Can update channel settings and manage members. Cannot delete the channel or transfer ownership. |
| **Member** | Can view messages, send messages, reply in threads, and react to messages. Cannot modify channel settings or manage other members. |

## Common Issues

| Issue | Cause | Resolution |
|---|---|---|
| Cannot see a channel | The channel is Private or Direct and you are not a member. | Request an invitation from a channel Owner or Admin. |
| Cannot send messages | You lack the `conversation.write` permission or the channel is archived. | Contact your Tenant Admin to verify your permissions. If the channel is archived, ask an Owner or Admin to unarchive it. |
| Messages not appearing in real time | Socket.IO connection may be interrupted. | Refresh the page or check your network connection. Messages will still be available on reload. |
| Cannot update channel settings | You are not an Owner, Admin, or Tenant Admin. | Contact the channel Owner to request a role change or have a Tenant Admin make the update. |
| Reaction not toggling | Network delay or connection issue. | Try again after a moment. If the issue persists, refresh the page. |
| Typing indicator not showing | The `typing:start` / `typing:stop` events require an active Socket.IO connection with the correct `channelId`. | Ensure you are connected and within the correct channel context. |

## Support Notes / Troubleshooting

- **Channel not appearing after creation** — Verify the channel was created successfully by checking the channel list. Ensure you have the `conversation.read` permission. If the issue persists, check for API errors in the browser console or server logs.
- **Member not receiving messages** — Confirm the user has been added as a channel member. For Private and Direct channels, membership is required. Check that their Socket.IO connection is active.
- **Archived channel behavior** — Archived channels remain in the channel list but are read-only. To resume activity, an Owner, Admin, or Tenant Admin must unarchive the channel by updating the `archived` flag.
- **Thread messages not grouping** — Threaded replies are linked by `parentMessageId`. If replies appear as top-level messages, verify the parent message ID is being sent correctly with the reply.
- **Pagination limits** — If you are not seeing all messages, ensure you are paginating through the full message history. The API returns between 50 and 100 messages per page by default.

## Related Pages

- [Inbox and Conversations](./inbox-and-conversations.md) — Overview of the conversation inbox and managing conversations.
- [Conversation Details and Messaging](./conversation-details-and-messaging.md) — Detailed conversation view and messaging features.
- [Calling](./calling.md) — Voice and video calls initiated from conversations and channels.
