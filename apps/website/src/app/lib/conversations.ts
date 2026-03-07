import { apiClient } from "./api-client";

export type ConversationTab = "unassigned" | "mine" | "closed";

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

type ConversationListResponse = {
  ok: boolean;
  counts: Record<ConversationTab, number>;
  conversations: ConversationSummary[];
};

type ConversationResponse = {
  ok: boolean;
  conversation: ConversationSummary;
};

type ConversationMessagesResponse = {
  ok: boolean;
  messages: ConversationMessage[];
};

type ConversationMessageResponse = {
  ok: boolean;
  message: ConversationMessage;
};

type ConversationCallResponse = {
  ok: boolean;
  call: {
    provider: string;
    to: string;
    externalCallId: string | null;
  };
};

export async function listConversations(params: { status: ConversationTab; q?: string }) {
  const search = new URLSearchParams();
  search.set("status", params.status);

  if (params.q?.trim()) {
    search.set("q", params.q.trim());
  }

  return apiClient.get<ConversationListResponse>(`/v1/conversations?${search.toString()}`);
}

export async function getConversation(conversationId: string) {
  return apiClient.get<ConversationResponse>(`/v1/conversations/${conversationId}`);
}

export async function updateConversation(
  conversationId: string,
  payload: {
    assignToMe?: boolean;
    assignedUserId?: string | null;
    status?: "open" | "closed";
    notes?: string;
  },
) {
  return apiClient.patch<ConversationResponse>(`/v1/conversations/${conversationId}`, payload);
}

export async function getConversationMessages(conversationId: string) {
  return apiClient.get<ConversationMessagesResponse>(`/v1/conversations/${conversationId}/messages`);
}

export async function startConversationCall(conversationId: string) {
  return apiClient.post<ConversationCallResponse>(`/v1/conversations/${conversationId}/call`, {});
}

export async function sendConversationMessage(
  conversationId: string,
  payload: {
    body: string;
    parentMessageId?: string | null;
    attachments?: Array<{
      storageKey: string;
      filename: string;
      contentType?: string | null;
      sizeBytes?: number | null;
    }>;
  },
) {
  return apiClient.post<ConversationMessageResponse>(`/v1/conversations/${conversationId}/messages`, payload);
}

export async function markConversationRead(conversationId: string) {
  return apiClient.post<{ ok: boolean; updatedCount: number; readAt: string }>(`/v1/conversations/${conversationId}/read`, {});
}

export async function toggleMessageReaction(messageId: string, emoji: string) {
  return apiClient.post<ConversationMessageResponse & { action: "added" | "removed" }>(`/v1/messages/${messageId}/reactions`, { emoji });
}

export function formatConversationTimestamp(value: string) {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return "";
  }

  const now = Date.now();
  const diffMs = now - timestamp.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  return timestamp.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatMessageTimestamp(value: string) {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return "";
  }

  return timestamp.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
