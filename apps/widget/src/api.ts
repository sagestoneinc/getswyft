const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3000";

export interface SessionPayload {
  tenantId?: string;
  tenantSlug?: string;
  lead: Record<string, unknown>;
  listing: Record<string, unknown>;
  pageUrl: string;
}

export interface SessionResponse {
  visitorJwt: string;
  conversationId: string;
  visitorId: string;
  afterHours?: boolean;
}

export async function createSession(
  tenantId: string | undefined,
  tenantSlug: string | undefined,
  lead: Record<string, unknown>,
  listing: Record<string, unknown>,
): Promise<SessionResponse> {
  const res = await fetch(`${API_URL}/v1/widget/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenantId,
      tenantSlug,
      lead,
      listing: { ...listing, url: listing.url || window.location.href },
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
    `${API_URL}/v1/widget/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${visitorJwt}`,
      },
      body: JSON.stringify({ body, clientMsgId }),
    },
  );

  if (!res.ok) {
    throw new Error(`Send message failed: ${res.status}`);
  }
}
