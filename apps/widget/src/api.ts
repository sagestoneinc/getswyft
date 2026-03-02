const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface SessionPayload {
  tenantId: string;
  lead: Record<string, unknown>;
  listing: Record<string, unknown>;
  pageUrl: string;
}

export interface SessionResponse {
  visitorJwt: string;
  conversationId: string;
  visitorId: string;
}

export async function createSession(
  tenantId: string,
  lead: Record<string, unknown>,
  listing: Record<string, unknown>,
): Promise<SessionResponse> {
  const res = await fetch(`${API_URL}/v1/widget/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenantId,
      lead,
      listing,
      pageUrl: window.location.href,
    }),
  });

  if (!res.ok) {
    throw new Error(`Session creation failed: ${res.status}`);
  }

  return res.json() as Promise<SessionResponse>;
}

export async function sendMessage(
  conversationId: string,
  visitorJwt: string,
  body: string,
  clientMsgId: string,
): Promise<void> {
  const res = await fetch(
    `${API_URL}/v1/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${visitorJwt}`,
      },
      body: JSON.stringify({ text: body, clientMsgId }),
    },
  );

  if (!res.ok) {
    throw new Error(`Send message failed: ${res.status}`);
  }
}
