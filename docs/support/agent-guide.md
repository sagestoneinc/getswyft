# Agent Guide

## Overview

As an **Agent**, you are the front line of your organization's communication with visitors, leads, and customers on Getswyft. Your day-to-day work revolves around responding to conversations, collaborating with your team through channels and the feed, and managing your availability. You have `conversation.read` and `conversation.write` permissions, giving you access to everything you need to handle conversations effectively.

This guide covers your daily workflow from login to closing conversations, along with all the tools at your disposal.

---

## Getting Started

### Logging In

You can access Getswyft through two interfaces:

1. **Website Dashboard** — Log in at your organization's Getswyft URL. Authentication supports multiple providers (Keycloak, Supabase, or Firebase) depending on your tenant's configuration. After authentication, you land on the inbox.

2. **Agent Console** — A standalone application built for focused agent work. Enter your email and password to receive an `agentJwt` token. The console provides a streamlined view of your inbox and conversations with real-time updates via Socket.IO.

> **Tip:** The agent console is optimized for high-volume conversation handling. Use it when your primary focus is managing conversations quickly.

### First-Time Setup

After your first login:

1. Go to **Profile** and update your display name, phone number, timezone, and locale.
2. Register your device for **push notifications** so you never miss an assignment.
3. Familiarize yourself with the inbox tabs and navigation.

---

## Managing Your Inbox

**Navigate to:** `/app/inbox`

The inbox is your command center. It shows all conversations relevant to you, organized into tabs for quick navigation.

### Inbox Tabs

| Tab | What It Shows |
|-----|---------------|
| **Unassigned** | Conversations waiting to be picked up. Grab one to start working on it. |
| **Mine** | Conversations currently assigned to you. This is your active workload. |
| **Closed** | Conversations that have been resolved. Review past interactions here. |

### Searching Conversations

Use the search bar at the top of the inbox to find conversations by:

- Lead name or email
- Message content
- Listing address or MLS number

### Selecting a Conversation

Click any conversation in the list to open it in the conversation detail view. The list shows a preview of the last message, the lead's name, and the conversation status.

> **Tip:** Keep the **Mine** tab as your default view. Check **Unassigned** regularly, especially if your team uses Manual routing.

---

## Working with Conversations

**Navigate to:** `/app/conversation/:id`

The conversation view is where you spend most of your time. Here's everything you can do:

### Reading Messages

The message thread displays all messages in chronological order. Each message shows:

- **Sender type** — Visitor, Agent, or System message.
- **Timestamp** — When the message was sent.
- **Content** — The message body, including any attachments.

Messages from visitors appear on one side, your replies on the other. System messages (assignments, status changes) appear inline.

### Sending Messages

1. Type your message in the compose box at the bottom of the conversation.
2. Press **Enter** or click **Send**.

Messages are delivered in real time. The visitor sees your response immediately in their widget.

### Reactions

React to any message with an emoji:

1. Hover over a message.
2. Click the reaction icon.
3. Select an emoji.

Reactions are visible to all participants in the conversation.

### Attachments and File Uploads

Share files with visitors or team members:

1. Click the **attachment** icon in the compose area.
2. Select a file from your device.
3. The file is uploaded to storage and a link is shared in the conversation.

Files are stored securely and accessible through the generated URL.

### Notes

Add internal notes to a conversation that are visible only to your team:

1. Switch to the **Notes** section within the conversation.
2. Type your note and save.

Use notes to document context, next steps, or important details about the lead.

### Assigning and Transferring Conversations

- **Assign to yourself** — Click **Assign to Me** on an unassigned conversation.
- **Transfer** — Click **Transfer** and select another agent from the team list. The conversation moves to their inbox.

### Closing and Reopening

- **Close** — When a conversation is resolved, click **Close**. It moves to the **Closed** tab.
- **Reopen** — If a visitor follows up on a closed conversation, reopen it to resume.

### Conversation Details

The sidebar shows lead and listing information:

| Field | Example |
|-------|---------|
| Lead Name | Jane Smith |
| Lead Email | jane@example.com |
| Lead Phone | (555) 123-4567 |
| Lead Source | Website |
| Listing Address | 123 Main St |
| Listing Price | $450,000 |
| Listing Beds/Baths | 3 bed / 2 bath |
| Listing Sqft | 1,800 |
| Listing MLS | MLS-12345 |

> **Tip:** Review lead and listing details before responding to personalize your replies.

---

## Making Calls

**Endpoint:** `/v1/calls`

Getswyft supports voice and video calls directly from conversations.

### Initiating a Call

1. Open a conversation.
2. Click the **Call** button (voice or video).
3. A call session is created and the other participant is notified.

Calls are powered by LiveKit and Telnyx, providing reliable voice and video infrastructure.

### During a Call

| Action | Description |
|--------|-------------|
| **Mute/Unmute** | Toggle your microphone on or off. |
| **Hold** | Place the participant on hold. |
| **End Call** | Terminate the call session. |

### Call Details

After a call ends, the following is recorded:

- Call type (voice or video)
- Duration in seconds
- Participants and their join/leave times
- Recording URL (if recording is enabled)

---

## Using Channels

**Endpoint:** `/v1/channels`

Channels are persistent group conversations for your team. Use them for topic-based collaboration outside of customer conversations.

### Channel Types

| Type | Description |
|------|-------------|
| **Public** | Visible and joinable by any team member. |
| **Private** | Invite-only, hidden from non-members. |
| **Direct** | One-on-one private messaging between two team members. |

### Creating a Channel

1. Navigate to the channels section.
2. Click **Create Channel**.
3. Enter a name and optional description.
4. Select the channel type (Public, Private, or Direct).
5. Click **Create**.

Each channel gets a unique slug within your tenant.

### Joining a Channel

- **Public channels** — Browse the channel list and click **Join**.
- **Private channels** — You must be invited by a channel owner or admin.

### Messaging in Channels

- Type a message in the channel compose box and send.
- **Threading** — Reply to a specific message to start a thread. Threads keep sub-conversations organized without cluttering the main channel.
- **Reactions** — React to channel messages with emojis, just like in conversations.

### Channel Roles

| Role | Capabilities |
|------|-------------|
| **Owner** | Full control, including deleting the channel. |
| **Admin** | Manage members and settings. |
| **Member** | Send messages and react. |

---

## Team Feed

**Endpoint:** `/v1/feed`

The feed is a social-style communication tool for announcements, updates, and team engagement.

### Creating a Post

1. Navigate to the feed.
2. Click **New Post**.
3. Write your message and optionally attach media (images, files).
4. Set **Visibility**:
   - **Public** — Visible to all team members.
   - **Team** — Visible to your immediate team.
   - **Private** — Visible only to you.
5. Click **Post**.

### Commenting

- Click on any post to open it.
- Type your comment in the comment box.
- Comments support threading via replies to other comments.

### Reacting

React to posts with emojis to show acknowledgment or agreement without adding a comment.

### Pinned Posts

Admins can pin important posts to the top of the feed. Check pinned posts for announcements and team-wide updates.

> **Tip:** Use the feed for shift handoff notes, team announcements, and celebrating wins.

---

## Managing Notifications

**Endpoint:** `/v1/notifications`

Notifications keep you informed about assignments, new messages, and other workspace events.

### Notification Types

You receive notifications for events such as:

- `conversation.assigned` — A conversation was assigned to you.
- `message.received` — A new message arrived in your conversation.
- Other workspace events configured by your admin.

### Viewing Notifications

- In-app notifications appear in the notification panel.
- Each notification includes a **title**, **body**, and **payload** linking to the relevant item.

### Marking as Read

Click on a notification or use the **Mark as Read** action to clear it. Read notifications show a `readAt` timestamp.

### Device Registration for Push Notifications

To receive push notifications on your device:

1. When prompted, **allow notifications** in your browser.
2. Your device is automatically registered with an FCM (Firebase Cloud Messaging) token.
3. Push notifications are delivered even when you're not actively on the platform.

You can manage your registered devices and remove old ones as needed.

> **Tip:** Enable push notifications so you're alerted to new assignments even when working in other tabs.

---

## Profile Settings

**Navigate to:** `/app/profile`

Keep your profile up to date so your team and the system can work with accurate information.

### Editable Fields

| Field | Description | Example |
|-------|-------------|---------|
| **Display Name** | Your name as shown to team members and visitors. | Jane Smith |
| **Phone** | Your contact number. | (555) 123-4567 |
| **Timezone** | Your local timezone for scheduling and timestamps. | America/New_York |
| **Locale** | Language and regional preferences. | en-US |
| **Avatar URL** | Link to your profile picture. | https://cdn.example.com/avatar.jpg |

### Updating Your Profile

1. Go to `/app/profile`.
2. Edit any of the fields above.
3. Click **Save**.

Your profile is updated via `PATCH /v1/auth/profile`. Changes take effect immediately across the platform.

---

## Real-Time Features

Getswyft uses Socket.IO for real-time updates, keeping your workspace responsive and collaborative.

### Presence Status

Your online/offline status is automatically tracked and shared with your team. When you're connected to the platform, your status shows as **online**. Other agents can see who's available for transfers and collaboration.

Events:
- `presence:update` — Broadcast when your status changes.

### Typing Indicators

When you're composing a message, other participants see a typing indicator:

- `typing:start` — Shown to others when you begin typing.
- `typing:stop` — Removed when you stop typing or send the message.
- `typing:update` — Updates the typing status in real time.

Typing indicators work in both conversations and channels.

---

## Tips for Efficient Agent Work

1. **Prioritize Unassigned** — Check the Unassigned tab frequently. Quick pickup times improve customer satisfaction.
2. **Use Notes** — Document context in conversation notes so team members picking up a transferred conversation have full context.
3. **Set Your Profile** — A complete profile with your correct timezone ensures accurate timestamps and scheduling.
4. **Leverage Channels** — Use channels for quick team questions instead of email. It keeps communication visible and searchable.
5. **Enable Push Notifications** — Don't miss assignments. Enable notifications on your primary device.
6. **Review Lead Details** — Before responding, check the lead's information and listing details in the sidebar to provide personalized service.
7. **Use Reactions** — Acknowledge messages quickly with reactions when a full reply isn't needed yet.
8. **Close Resolved Conversations** — Keep your inbox clean by closing conversations that are fully resolved.
9. **Use Threads in Channels** — Keep channel conversations organized by replying in threads instead of the main timeline.
10. **Familiarize Yourself with Keyboard Shortcuts** — Use Enter to send messages and navigate between tabs efficiently.

---

## Quick Reference

### Agent Features & Navigation

| Feature | Location | What You Can Do |
|---------|----------|-----------------|
| Inbox | `/app/inbox` | View conversations (Unassigned, Mine, Closed), search |
| Conversation Detail | `/app/conversation/:id` | Read/send messages, react, attach files, notes, assign, transfer, close/reopen |
| Calling | `/v1/calls` (from conversation) | Initiate voice/video calls, mute, hold, end |
| Channels | `/v1/channels` | Create, join, message, thread, react |
| Feed | `/v1/feed` | Create posts, comment, react |
| Notifications | `/v1/notifications` | View, mark read, manage devices |
| Profile | `/app/profile` | Update name, phone, timezone, locale, avatar |

### Conversation Actions

| Action | How |
|--------|-----|
| Pick up a conversation | Click a conversation in the **Unassigned** tab → **Assign to Me** |
| Send a message | Type in the compose box → **Enter** or **Send** |
| React to a message | Hover → reaction icon → select emoji |
| Attach a file | Click attachment icon → select file |
| Add a note | Open **Notes** section → type → save |
| Transfer | Click **Transfer** → select agent |
| Close | Click **Close** |
| Reopen | Click **Reopen** on a closed conversation |
| Start a call | Click **Call** (voice or video) from the conversation |

### Permissions

| Permission | Value | What It Allows |
|------------|-------|----------------|
| Read conversations | `conversation.read` | View conversations, messages, channels, feed, call history |
| Write conversations | `conversation.write` | Send messages, create channels, upload files, create moderation reports, initiate calls |
