export const PERMISSIONS = {
  tenantManage: "tenant.manage",
  userManage: "user.manage",
  conversationRead: "conversation.read",
  conversationWrite: "conversation.write",
  moderationManage: "moderation.manage",
  analyticsRead: "analytics.read",
  featureFlagManage: "featureflag.manage",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
