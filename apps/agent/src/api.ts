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
    name: string;
  }>;
}

export async function fetchConversations(token: string) {
  const res = await fetch(`${API_URL}/v1/agent/conversations`, {
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
  assignedAgent: { id: string; name: string; email: string } | null;
  messages: Message[];
}
