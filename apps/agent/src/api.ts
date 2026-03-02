const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

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
    token: string;
    agent: { id: string; email: string; name: string };
  }>;
}

export async function fetchConversations(token: string) {
  const res = await fetch(`${API_URL}/v1/agent/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch conversations");
  return res.json() as Promise<{
    conversations: { id: string; title: string; createdAt: string }[];
  }>;
}

export async function postMessage(
  token: string,
  conversationId: string,
  body: string,
) {
  const res = await fetch(
    `${API_URL}/v1/agent/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ body }),
    },
  );
  if (!res.ok) throw new Error("Failed to send message");
  return res.json() as Promise<Message>;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: string;
  body: string;
  createdAt: string;
}
