import { apiClient } from "./api-client";

export type ConversationTab = "unassigned" | "mine" | "closed";

export type AuthMembership = {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  roleKeys: string[];
  permissions: string[];
};

export type AuthContext = {
  ok: boolean;
  user: {
    id: string;
    externalAuthId: string;
    email: string;
    displayName: string | null;
  };
  tenant: {
    id: string;
    slug: string;
    name: string;
  };
  roles: string[];
  permissions: string[];
};

export type ConversationSummary = {
  id: string;
  status: ConversationTab | "assigned";
  workflowStatus: "open" | "closed";
  assignedTo: string | null;
  assignedUserId: string | null;
  afterHours: boolean;
  notes: string;
  unreadCount: number;
  lastMessage: string;
  lastMessageAt: string;
  lead: {
    name: string;
    email: string | null;
    phone: string | null;
    source: string | null;
    utm?: string | null;
  };
  listing: {
    address: string;
    price: string;
    beds: number | null;
    baths: number | null;
    sqft: number | null;
    mls: string | null;
  };
  createdAt: string;
  updatedAt: string;
};

export type ConversationMessage = {
  id: string;
  body: string;
  sender: "agent" | "visitor" | "system";
  senderType: "agent" | "visitor" | "system";
  senderName: string;
  createdAt: string;
  updatedAt: string;
  parentMessageId: string | null;
  readByCurrentUser: boolean;
  readCount: number;
  reactions: Array<{
    emoji: string;
    count: number;
    reacted: boolean;
  }>;
  attachments: Array<{
    id: string;
    storageKey: string;
    filename: string;
    contentType: string | null;
    sizeBytes: number | null;
    createdAt: string;
  }>;
};

export type RealtimeConversationMessage = {
  id: string;
  conversationId: string;
  text?: string | null;
  body?: string | null;
  sender?: "agent" | "visitor" | "system";
  senderType: "agent" | "visitor" | "system";
  createdAt: string;
  clientMsgId?: string | null;
};

export type TenantRoutingSettings = {
  routingMode: "manual" | "first_available" | "round_robin";
  officeHoursEnabled: boolean;
  timezone: string;
  officeHoursStart: string;
  officeHoursEnd: string;
  afterHoursMessage: string;
  fallbackUserId: string | null;
  fallbackUserName: string | null;
};

export type FallbackCandidate = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "agent";
  roleKeys: string[];
};

type ConversationListResponse = {
  ok: boolean;
  counts: Record<ConversationTab, number>;
  conversations: ConversationSummary[];
};

type ConversationMessagesResponse = {
  ok: boolean;
  messages: ConversationMessage[];
};

type ConversationMessageResponse = {
  ok: boolean;
  message: ConversationMessage;
};

export function formatSocketMessage(message: RealtimeConversationMessage): ConversationMessage {
  const body = message.body || message.text || "";
  const senderType = message.senderType || message.sender || "system";
  const senderName =
    senderType === "visitor" ? "Visitor" : senderType === "agent" ? "Agent" : "System";

  return {
    id: message.id,
    body,
    sender: message.sender || senderType,
    senderType,
    senderName,
    createdAt: message.createdAt,
    updatedAt: message.createdAt,
    parentMessageId: null,
    readByCurrentUser: senderType === "agent",
    readCount: senderType === "agent" ? 1 : 0,
    reactions: [],
    attachments: [],
  };
}

export async function fetchAuthContext() {
  return apiClient.get<AuthContext>("/v1/auth/me");
}

export async function fetchMemberships() {
  return apiClient.get<{
    ok: boolean;
    activeTenant: AuthMembership | null;
    memberships: AuthMembership[];
  }>("/v1/auth/memberships");
}

export async function fetchConversations(status: ConversationTab) {
  return apiClient.get<ConversationListResponse>(`/v1/conversations?status=${status}`);
}

export async function fetchMessages(conversationId: string) {
  return apiClient.get<ConversationMessagesResponse>(`/v1/conversations/${conversationId}/messages`);
}

export async function postMessage(conversationId: string, body: string) {
  return apiClient.post<ConversationMessageResponse>(`/v1/conversations/${conversationId}/messages`, {
    body,
  });
}

export async function assignConversationToMe(conversationId: string) {
  return apiClient.patch<{ ok: boolean; conversation: ConversationSummary }>(`/v1/conversations/${conversationId}`, {
    assignToMe: true,
  });
}

export async function closeConversation(conversationId: string) {
  return apiClient.patch<{ ok: boolean; conversation: ConversationSummary }>(`/v1/conversations/${conversationId}`, {
    status: "closed",
  });
}

export async function reopenConversation(conversationId: string) {
  return apiClient.patch<{ ok: boolean; conversation: ConversationSummary }>(`/v1/conversations/${conversationId}`, {
    status: "open",
  });
}

export async function markConversationRead(conversationId: string) {
  return apiClient.post<{ ok: boolean; updatedCount: number; readAt: string }>(`/v1/conversations/${conversationId}/read`, {});
}

export async function fetchRoutingSettings() {
  return apiClient.get<{
    ok: boolean;
    settings: TenantRoutingSettings;
    fallbackCandidates: FallbackCandidate[];
  }>("/v1/tenants/current/settings");
}

export async function updateRoutingSettings(data: Partial<TenantRoutingSettings>) {
  return apiClient.patch<{
    ok: boolean;
    settings: TenantRoutingSettings;
    fallbackCandidates: FallbackCandidate[];
  }>("/v1/tenants/current/settings", data);
}
