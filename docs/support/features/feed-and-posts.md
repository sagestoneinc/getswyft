# Feed and Posts

## Summary

The Feed and Posts feature provides a social-style communication channel within your Getswyft tenant. Team members can create posts with text and media, comment on posts (with threaded replies), react with emoji, and control who sees each post through visibility settings. Administrators can pin important posts to keep them prominent.

> **Note:** The feed is currently available through the API (`/v1/feed`). A dedicated feed page in the website UI may not yet be present. All functionality described below is accessible via API integration.

## Who Can Use This

- **Viewing posts:** Any authenticated user with the `conversation.read` permission can view posts in the feed.
- **Creating and modifying posts:** Users with the `conversation.write` permission can create posts, add comments, and toggle reactions.
- **Deleting content:** Post authors can delete their own posts. Moderators can delete any post or comment.

## What It Does

The feed serves as an internal communication hub for your organization. It supports:

- **Posts** — Share text updates and media files with your team or publicly.
- **Comments** — Respond to posts with comments, including threaded replies to other comments.
- **Reactions** — React to posts with emoji. Each user can toggle a reaction on or off.
- **Visibility controls** — Restrict who can see each post using PUBLIC, TEAM, or PRIVATE visibility.
- **Pinning** — Pin important posts so they remain prominent in the feed.

## Key Functions / Actions Available

| Action | API Endpoint | Method | Description |
|---|---|---|---|
| List posts | `GET /v1/feed` | GET | Retrieve all visible posts. TEAM and PUBLIC posts are visible to all authenticated users. PRIVATE posts are visible only to the author. |
| Create a post | `POST /v1/feed` | POST | Create a new post with a text body, optional media URLs, and a visibility setting. |
| Get post details | `GET /v1/feed/:postId` | GET | Retrieve a single post along with its comments and reactions. |
| Update a post | `PATCH /v1/feed/:postId` | PATCH | Update the body, visibility, or pinned status of a post. Author only. |
| Delete a post | `DELETE /v1/feed/:postId` | DELETE | Remove a post. Available to the post author or a moderator. |
| Add a comment | `POST /v1/feed/:postId/comments` | POST | Add a comment to a post. Optionally include `parentCommentId` to create a threaded reply. |
| Delete a comment | `DELETE /v1/feed/:postId/comments/:commentId` | DELETE | Remove a comment. Available to the comment author or a moderator. |
| Toggle a reaction | `POST /v1/feed/:postId/reactions` | POST | Add or remove an emoji reaction on a post. If the user has already reacted with the same emoji, the reaction is removed. |

## Step-by-Step How to Use It

### Creating a Post

1. Send a `POST` request to `/v1/feed` with the following fields:
   - `body` (string, required) — The text content of the post.
   - `mediaUrls` (array, optional) — A list of URLs for images, videos, or other media to attach.
   - `visibility` (string, required) — One of `PUBLIC`, `TEAM`, or `PRIVATE`.
2. The API returns the newly created post object, including its `postId`.

### Commenting on a Post

1. Send a `POST` request to `/v1/feed/:postId/comments` with:
   - `body` (string, required) — The comment text.
   - `parentCommentId` (string, optional) — If replying to an existing comment, include its ID to create a threaded reply.
2. The comment is added to the post and is visible to anyone who can see the post.

### Reacting to a Post

1. Send a `POST` request to `/v1/feed/:postId/reactions` with:
   - `emoji` (string, required) — The emoji to react with (e.g., `👍`, `❤️`, `🎉`).
2. If you have not already reacted with that emoji, the reaction is added.
3. If you have already reacted with that emoji, the reaction is removed (toggle behavior).

### Updating a Post

1. Send a `PATCH` request to `/v1/feed/:postId` with any of the following fields:
   - `body` (string) — Updated post text.
   - `visibility` (string) — Change to `PUBLIC`, `TEAM`, or `PRIVATE`.
   - `isPinned` (boolean) — Set to `true` to pin the post or `false` to unpin it.
2. Only the original author of the post can perform this action.

### Pinning a Post

1. Send a `PATCH` request to `/v1/feed/:postId` with `isPinned` set to `true`.
2. Pinned posts are highlighted or prioritized in the feed.
3. To unpin, send the same request with `isPinned` set to `false`.

### Deleting a Post or Comment

1. To delete a post, send a `DELETE` request to `/v1/feed/:postId`.
2. To delete a comment, send a `DELETE` request to `/v1/feed/:postId/comments/:commentId`.
3. Only the content author or a moderator can delete posts and comments.

## System Behavior / What Users Should Expect

- **Visibility rules:**
  - `PUBLIC` — Visible to all authenticated users across the tenant.
  - `TEAM` — Visible to all members of the user's team.
  - `PRIVATE` — Visible only to the post author.
- When listing posts via `GET /v1/feed`, TEAM and PUBLIC posts appear for all authenticated users. PRIVATE posts are returned only when the requesting user is the author.
- Reactions use a per-user toggle. Sending the same emoji reaction twice removes it.
- Threaded comments are supported by specifying a `parentCommentId`. Comments without a parent appear as top-level responses.
- Pinned posts remain pinned until explicitly unpinned by the author.

## Permissions Required

| Permission | Grants Access To |
|---|---|
| `conversation.read` | View posts, comments, and reactions in the feed. |
| `conversation.write` | Create posts, add comments, and toggle reactions. |

Moderators have additional privileges to delete any post or comment, regardless of authorship.

## Common Issues

| Issue | Cause | Resolution |
|---|---|---|
| Cannot see a post | The post has `PRIVATE` visibility and you are not the author. | Ask the author to change visibility to `TEAM` or `PUBLIC`. |
| Cannot create a post | Missing `conversation.write` permission. | Contact your administrator to request the required permission. |
| Cannot delete a post or comment | You are not the author and do not have moderator privileges. | Ask the content author or a moderator to delete it. |
| Reaction not appearing | The same emoji was sent twice, which toggles the reaction off. | Send the reaction request again to re-add it. |
| Media not displaying | Invalid or inaccessible URL in `mediaUrls`. | Verify the media URL is correct and publicly accessible. |

## Support Notes / Troubleshooting

- The feed feature is API-driven. If you do not see a feed page in the website UI, access it through the API at `/v1/feed`.
- Ensure your API requests include a valid authentication token and that your user account has the appropriate permissions.
- If posts are not appearing as expected, verify the visibility setting on the post and confirm your user role.
- For issues with threaded comments, confirm the `parentCommentId` refers to a valid, existing comment on the same post.

## Related Pages

- [Notifications](./notifications.md) — Receive alerts when activity occurs on posts you follow.
- [Webhooks](./webhooks.md) — Configure external integrations to respond to feed events.
