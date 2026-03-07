# Inbox and Conversations

The Inbox is the central hub for managing visitor conversations in Getswyft. It provides a real-time view of all conversations across your organization, with tools for filtering, searching, and triaging inquiries as they come in.

## Who Can Use This

- **Users with the `conversation.read` permission** can view the inbox and read conversations.
- **Users with the `conversation.write` permission** can update conversations, change assignments, modify status, and edit notes.
- Conversation visibility is scoped to the user's tenant.

## What It Does

The Inbox page (`/app/inbox`) displays a list of all conversations associated with your tenant. Each conversation represents a communication thread between a visitor (lead) and your team, typically initiated through the chat widget on a property listing page.

Conversations are organized into tabs for quick triage:

| Tab | What It Shows |
| --- | --- |
| **Unassigned** | Conversations with no agent assigned and a status of **OPEN**. These are new or unhandled inquiries waiting to be picked up. |
| **Mine** | Conversations assigned to the currently logged-in user with a status of **OPEN**. These are your active, in-progress conversations. |
| **Closed** | Conversations with a status of **CLOSED**, regardless of assignment. These are resolved or archived threads. |

> **Note:** The API also supports an `assigned` filter value, which returns all OPEN conversations assigned to any agent (not limited to the current user). This filter is available for administrative or supervisory use but does not have a dedicated tab in the UI.

Each tab displays a real-time count of conversations matching its criteria, so you can see at a glance how many items need attention.

## Key Functions / Actions Available

- View all conversations in a filterable, searchable list
- Switch between Unassigned, Mine, and Closed tabs
- Search across lead name, email, phone number, listing address, MLS number, and message content
- Apply advanced filters using the filter button
- Select a conversation to view its full details
- See unread message indicators on conversation cards
- View real-time conversation counts per tab
- Update conversation assignment, status, and notes (with `conversation.write` permission)
- Mark all messages in a conversation as read

## Step-by-Step How to Use It

### Viewing the Inbox

1. Navigate to **Inbox** in the main application menu, or go directly to `/app/inbox`.
2. The inbox loads with the default tab selected, showing a list of conversation cards.
3. Each conversation card displays:
   - Visitor name and avatar
   - Last message preview
   - Timestamp of the most recent activity
   - Unread message indicator (if applicable)

### Switching Tabs

1. At the top of the inbox, locate the tab bar with **Unassigned**, **Mine**, and **Closed**.
2. Click the tab you want to view.
3. The conversation list updates immediately to show only conversations matching the selected tab's criteria.
4. The count badge on each tab reflects the current number of conversations in real time.

### Searching for a Conversation

1. Locate the search bar at the top of the inbox.
2. Enter your search term. You can search by:
   - Lead name
   - Email address
   - Phone number
   - Listing address
   - MLS number
   - Message content
3. The conversation list filters in real time as you type.
4. To clear the search, remove the text from the search bar.

### Using Advanced Filters

1. Click the **Filter** button near the search bar.
2. Select or configure the filter criteria you want to apply.
3. The conversation list updates to show only matching results.
4. Remove or adjust filters as needed to broaden or narrow your view.

### Selecting a Conversation

1. From the conversation list, click on a conversation card.
2. The conversation detail view opens, showing the full message thread and conversation metadata.
3. From the detail view, you can:
   - Read the full message history
   - View lead and listing information (name, email, phone, address, price, beds, baths, sqft, MLS)
   - Update the assigned agent
   - Change the conversation status (OPEN or CLOSED)
   - Edit conversation notes
   - Mark all unread messages as read

## System Behavior / What Users Should Expect

- **Real-time updates**: Conversation counts and the conversation list update in real time. When a new message arrives or a conversation is reassigned, the inbox reflects the change without requiring a page refresh.
- **Unread indicators**: Conversations with unread messages display a visual indicator on the conversation card. Opening a conversation and calling `POST /v1/conversations/:id/read` marks all messages as read.
- **Webhooks and notifications**: When a conversation is updated (e.g., assignment changed, status changed, notes edited) via `PATCH /v1/conversations/:id`, the system triggers configured webhooks and sends notifications to relevant users. This means other team members are automatically informed of changes.
- **After-hours flag**: Conversations initiated outside of business hours are flagged with an `afterHours` indicator, helping agents prioritize follow-ups.
- **Pagination**: The conversation list is paginated. If your tenant has many conversations, scroll to load additional results or use search and filters to narrow the list.

### API Reference

| Endpoint | Method | Description |
| --- | --- | --- |
| `/v1/conversations` | GET | List conversations with filters (`status=unassigned\|mine\|assigned\|closed`), search query, and pagination. The `assigned` filter returns all conversations assigned to any agent (not just the current user). |
| `/v1/conversations/:id` | GET | Retrieve a single conversation's details, including unread count |
| `/v1/conversations/:id` | PATCH | Update a conversation (assignee, status, notes). Triggers webhooks and notifications |
| `/v1/conversations/:id/read` | POST | Mark all unread messages in the conversation as read |

### Conversation Data Model

Each conversation includes the following fields:

| Field | Description |
| --- | --- |
| `leadName` | Name of the visitor or lead |
| `leadEmail` | Email address of the lead |
| `leadPhone` | Phone number of the lead |
| `address` | Listing street address |
| `price` | Listing price |
| `beds` | Number of bedrooms |
| `baths` | Number of bathrooms |
| `sqft` | Square footage of the listing |
| `MLS` | MLS listing number |
| `assignedAgentId` | ID of the agent assigned to the conversation |
| `status` | Conversation status: `OPEN` or `CLOSED` |
| `notes` | Free-text notes attached to the conversation (editable) |
| `afterHours` | Boolean flag indicating the conversation was started outside business hours |
| `createdAt` | Timestamp when the conversation was created |
| `updatedAt` | Timestamp of the most recent update |

## Permissions Required

| Action | Permission Key | Notes |
| --- | --- | --- |
| View inbox and conversation list | `conversation.read` | Required to access `/app/inbox` |
| View conversation details | `conversation.read` | Required to open a conversation |
| Update conversation (assign, close, edit notes) | `conversation.write` | Required to modify any conversation field |
| Mark messages as read | `conversation.write` | Required to call the mark-as-read endpoint |

## Common Issues

- **Inbox appears empty** — Verify that the user has the `conversation.read` permission and is associated with the correct tenant. If permissions were recently changed, the user may need to log out and log back in.
- **Conversation counts do not update** — Real-time updates require an active WebSocket or polling connection. Check for network issues or browser extensions that may block connections.
- **Search returns no results** — Full-text search covers lead name, email, phone, listing address, MLS number, and message content. Ensure the search term matches one of these fields. Partial matches may be supported depending on configuration.
- **Cannot update a conversation** — The user may only have `conversation.read` permission. The `conversation.write` permission is required to change assignment, status, or notes.
- **Unread indicator does not clear** — Opening a conversation does not automatically mark messages as read in all cases. Ensure the mark-as-read action (`POST /v1/conversations/:id/read`) is being triggered.

## Support Notes / Troubleshooting

- If a user reports that they can see conversations in one tab but not another, review the tab filtering logic: **Unassigned** shows only OPEN conversations with no assigned agent, **Mine** shows only OPEN conversations assigned to the current user, and **Closed** shows only CLOSED conversations.
- When a conversation is updated via `PATCH /v1/conversations/:id`, webhooks fire and notifications are sent. If downstream systems are not receiving updates, verify the webhook configuration in the tenant settings.
- For performance issues with large conversation lists, encourage users to use search and filters to reduce the result set rather than scrolling through all results.
- If the after-hours flag appears incorrect, check the business hours configuration for the tenant.

## Related Pages

- [Authentication and Login](authentication-and-login.md)
