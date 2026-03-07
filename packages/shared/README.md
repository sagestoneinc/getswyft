# @app/shared

Shared TypeScript contracts and permission constants used by the API and frontend apps.

## Exports

### `@app/shared/permissions`

Permission key constants for RBAC enforcement.

```typescript
import { PERMISSIONS } from "@app/shared/permissions";

// Available permissions:
PERMISSIONS.tenantManage       // "tenant.manage"
PERMISSIONS.userManage         // "user.manage"
PERMISSIONS.conversationRead   // "conversation.read"
PERMISSIONS.conversationWrite  // "conversation.write"
PERMISSIONS.moderationManage   // "moderation.manage"
PERMISSIONS.analyticsRead      // "analytics.read"
PERMISSIONS.featureFlagManage  // "featureflag.manage"
```

### `@app/shared/contracts`

TypeScript interfaces for API response shapes.

| Interface | Description |
|-----------|-------------|
| `AuthMeResponse` | Response from `GET /v1/auth/me` with user, tenant, roles, and permissions |
| `TenantCurrentResponse` | Response from `GET /v1/tenants/current` with tenant details, branding, and feature flags |
| `NotificationListResponse` | Response from `GET /v1/notifications` with notification list |
| `RealtimePresenceEvent` | Socket.IO event payload for `presence:user_status_changed` |
