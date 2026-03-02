const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function loginAgent(email: string, password: string) {
  const res = await fetch(`${API_URL}/v1/agent/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Login failed" }));
    throw new Error(err.error ?? "Login failed");
  }
  return res.json() as Promise<{
    agentJwt: string;
    agentId: string;
    tenantId: string;
    name: string;
  }>;
}

export async function fetchAgentMe(token: string) {
  const res = await fetch(`${API_URL}/v1/agent/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch agent info");
  return res.json() as Promise<{ agentId: string; tenantId: string; name: string; email: string }>;
}

export async function fetchConversations(token: string, params?: { status?: string; assigned?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.assigned) qs.set("assigned", params.assigned);
  const res = await fetch(`${API_URL}/v1/agent/conversations?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch conversations");
  return res.json() as Promise<Conversation[]>;
}

export async function fetchMessages(token: string, conversationId: string) {
  const res = await fetch(
    `${API_URL}/v1/agent/conversations/${encodeURIComponent(conversationId)}/messages`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json() as Promise<Message[]>;
}

export async function postMessage(
  token: string,
  conversationId: string,
  text: string,
) {
  const clientMsgId = crypto.randomUUID();
  const res = await fetch(
    `${API_URL}/v1/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text, clientMsgId }),
    },
  );
  if (!res.ok) throw new Error("Failed to send message");
  return res.json() as Promise<Message>;
}

export async function assignConversation(token: string, conversationId: string, agentId: string) {
  const res = await fetch(
    `${API_URL}/v1/agent/conversations/${encodeURIComponent(conversationId)}/assign`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ agentId }),
    },
  );
  if (!res.ok) throw new Error("Failed to assign conversation");
  return res.json() as Promise<Conversation>;
}

export async function closeConversation(token: string, conversationId: string) {
  const res = await fetch(
    `${API_URL}/v1/agent/conversations/${encodeURIComponent(conversationId)}/close`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!res.ok) throw new Error("Failed to close conversation");
  return res.json();
}

export async function reopenConversation(token: string, conversationId: string) {
  const res = await fetch(
    `${API_URL}/v1/agent/conversations/${encodeURIComponent(conversationId)}/reopen`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!res.ok) throw new Error("Failed to reopen conversation");
  return res.json();
}

export async function fetchRoutingSettings(token: string) {
  const res = await fetch(`${API_URL}/v1/settings/routing`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch routing settings");
  return res.json() as Promise<RoutingSettings>;
}

export async function updateRoutingSettings(token: string, data: Partial<RoutingSettings>) {
  const res = await fetch(`${API_URL}/v1/settings/routing`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update routing settings");
  return res.json() as Promise<RoutingSettings>;
}

export interface Message {
  id: string;
  conversationId: string;
  senderType: string;
  senderId: string;
  text: string | null;
  clientMsgId: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  tenantId: string;
  status: string;
  assignedAgentId: string | null;
  context: Record<string, unknown>;
  createdAt: string;
  source: string;
  afterHours: boolean;
  leadName: string | null;
  leadEmail: string | null;
  leadPhone: string | null;
  assignedAgent: { id: string; name: string; email: string } | null;
  messages: Message[];
}

export interface RoutingSettings {
  id: string;
  tenantId: string;
  mode: string;
  timezone: string;
  officeHours: Record<string, { start: string; end: string }>;
  fallbackAgentId: string | null;
  lastAssignedAgentId: string | null;
}
