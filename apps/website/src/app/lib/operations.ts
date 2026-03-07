import { apiClient } from "./api-client";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  payload: unknown;
  readAt: string | null;
  createdAt: string;
};

export type AIConfigItem = {
  id: string;
  tenantId: string;
  key: string;
  provider: string;
  config: unknown;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ModerationItem = {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: "OPEN" | "REVIEWING" | "RESOLVED" | "DISMISSED";
  details: unknown;
  reporterUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuditLogItem = {
  id: string;
  tenantId: string;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: unknown;
  requestId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type ChannelItem = {
  id: string;
  name: string;
  slug: string;
  type: "PUBLIC" | "PRIVATE" | "DIRECT";
  description: string | null;
  topic: string | null;
  isArchived: boolean;
  createdByUserId: string | null;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CallSessionItem = {
  id: string;
  tenantId: string;
  conversationId: string | null;
  channelId: string | null;
  callType: "VOICE" | "VIDEO";
  status: "RINGING" | "ANSWERED" | "BUSY" | "FAILED" | "ENDED";
  provider: string;
  roomName: string | null;
  durationSeconds: number | null;
  startedAt: string;
  answeredAt: string | null;
  endedAt: string | null;
  participantCount: number;
};

export type FeedReactionSummary = {
  emoji: string;
  count: number;
  reacted: boolean;
};

export type FeedPostItem = {
  id: string;
  body: string;
  mediaUrls: string[];
  visibility: "TEAM" | "PUBLIC" | "PRIVATE";
  isPinned: boolean;
  authorUserId: string;
  commentCount: number;
  reactions: FeedReactionSummary[];
  createdAt: string;
  updatedAt: string;
};

export type ComplianceExportItem = {
  id: string;
  exportType: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  storageKey: string | null;
  completedAt: string | null;
  metadata: unknown;
  requestedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listNotifications(limit = 50) {
  return apiClient.get<{
    ok: boolean;
    notifications: NotificationItem[];
  }>(`/v1/notifications?limit=${limit}`);
}

export async function sendNotificationTest() {
  return apiClient.post<{
    ok: boolean;
    notification: NotificationItem;
  }>("/v1/notifications/test", {});
}

export async function markNotificationRead(id: string) {
  return apiClient.post<{
    ok: boolean;
    updatedCount: number;
  }>(`/v1/notifications/${id}/read`, {});
}

export async function listAiConfigs() {
  return apiClient.get<{
    ok: boolean;
    configs: AIConfigItem[];
  }>("/v1/ai/config");
}

export async function upsertAiConfig(payload: {
  key: string;
  provider: string;
  config: unknown;
  isEnabled?: boolean;
}) {
  return apiClient.put<{
    ok: boolean;
    config: AIConfigItem;
  }>(`/v1/ai/config/${payload.key}`, {
    provider: payload.provider,
    config: payload.config,
    isEnabled: payload.isEnabled,
  });
}

export async function deleteAiConfig(key: string) {
  return apiClient.delete<{
    ok: boolean;
  }>(`/v1/ai/config/${key}`);
}

export async function listModerationReports(status?: string) {
  const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiClient.get<{
    ok: boolean;
    reports: ModerationItem[];
  }>(`/v1/moderation${suffix}`);
}

export async function createModerationReport(payload: {
  targetType: string;
  targetId: string;
  reason: string;
  details?: unknown;
}) {
  return apiClient.post<{
    ok: boolean;
    report: ModerationItem;
  }>("/v1/moderation", payload);
}

export async function updateModerationStatus(reportId: string, status: ModerationItem["status"]) {
  return apiClient.patch<{
    ok: boolean;
    report: ModerationItem;
  }>(`/v1/moderation/${reportId}`, {
    status,
  });
}

export async function listAuditLogs(limit = 100) {
  return apiClient.get<{
    ok: boolean;
    logs: AuditLogItem[];
    nextCursor: string | null;
  }>(`/v1/audit-logs?limit=${limit}`);
}

export async function listChannels() {
  return apiClient.get<{
    ok: boolean;
    channels: ChannelItem[];
  }>("/v1/channels");
}

export async function createChannel(payload: {
  name: string;
  type: ChannelItem["type"];
  description?: string;
}) {
  return apiClient.post<{
    ok: boolean;
    channel: ChannelItem;
  }>("/v1/channels", payload);
}

export async function listCallSessions(limit = 50) {
  return apiClient.get<{
    ok: boolean;
    sessions: CallSessionItem[];
    nextCursor: string | null;
  }>(`/v1/calls/sessions?limit=${limit}`);
}

export async function listFeedPosts(limit = 50) {
  return apiClient.get<{
    ok: boolean;
    posts: FeedPostItem[];
  }>(`/v1/feed?limit=${limit}`);
}

export async function createFeedPost(payload: {
  body: string;
  visibility?: FeedPostItem["visibility"];
}) {
  return apiClient.post<{
    ok: boolean;
    post: FeedPostItem;
  }>("/v1/feed", payload);
}

export async function listComplianceExports() {
  return apiClient.get<{
    ok: boolean;
    exports: ComplianceExportItem[];
  }>("/v1/compliance/exports");
}

export async function requestComplianceExport(exportType: "full_data" | "conversations" | "audit_logs" | "users") {
  return apiClient.post<{
    ok: boolean;
    export: ComplianceExportItem;
  }>("/v1/compliance/exports", {
    exportType,
  });
}
