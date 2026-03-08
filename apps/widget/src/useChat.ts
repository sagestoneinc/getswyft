import { useCallback, useEffect, useRef, useState } from "react";
import { createSession, sendMessage } from "./api";
import { connectSocket, joinConversation, disconnectSocket } from "./socket";

export interface ChatMessage {
  id: string;
  body: string;
  sender: "visitor" | "agent";
  timestamp: string;
}

interface UseChatOptions {
  tenantId?: string;
  tenantSlug?: string;
  lead: Record<string, unknown>;
  listing: Record<string, unknown>;
  enabled?: boolean;
}

export function useChat({ tenantId, tenantSlug, lead, listing, enabled = true }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [afterHours, setAfterHours] = useState(false);
  const visitorJwtRef = useRef<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      initializedRef.current = false;
      visitorJwtRef.current = null;
      conversationIdRef.current = null;
      setMessages([]);
      setConnected(false);
      setAfterHours(false);
      setError(null);
      return;
    }

    if (initializedRef.current) return;
    initializedRef.current = true;

    let cancelled = false;

    async function init() {
      try {
        const resp = await createSession(tenantId, tenantSlug, lead, listing);

        if (cancelled) return;

        visitorJwtRef.current = resp.visitorJwt;
        conversationIdRef.current = resp.conversationId;
        if (resp.afterHours) setAfterHours(true);

        const socket = connectSocket(resp.visitorJwt);

        socket.on("connect", () => {
          if (!cancelled) {
            setConnected(true);
            joinConversation(resp.conversationId);
          }
        });

        socket.on("disconnect", () => {
          if (!cancelled) setConnected(false);
        });

        socket.on("event", (evt: { type: string; payload: unknown; conversationId: string }) => {
          if (cancelled) return;

          if (evt.type === "conversation.history") {
            const historyPayload = evt.payload as {
              messages: Array<{ id: string; text?: string; body?: string; senderType: string; createdAt: string }>;
            };
            setMessages(
              historyPayload.messages.map((m) => ({
                id: m.id,
                body: m.text || m.body || "",
                sender: m.senderType === "visitor" ? "visitor" as const : "agent" as const,
                timestamp: m.createdAt,
              }))
            );
          }

          if (evt.type === "message.created") {
            const msg = evt.payload as {
              id: string;
              text?: string;
              body?: string;
              senderType: string;
              createdAt: string;
              clientMsgId?: string;
            };
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              if (msg.clientMsgId && prev.some((m) => m.id === msg.clientMsgId)) {
                return prev.map((m) =>
                  (m.id === msg.clientMsgId) ? { ...m, id: msg.id } : m
                );
              }
              return [
                ...prev,
                {
                  id: msg.id,
                  body: msg.text || msg.body || "",
                  sender: msg.senderType === "visitor" ? "visitor" as const : "agent" as const,
                  timestamp: msg.createdAt,
                },
              ];
            });
          }
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to initialize chat");
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      disconnectSocket();
    };
  }, [enabled, tenantId, tenantSlug, lead, listing]);

  const send = useCallback(async (body: string) => {
    const jwt = visitorJwtRef.current;
    const convId = conversationIdRef.current;
    if (!jwt || !convId) return;

    const clientMsgId = crypto.randomUUID();
    const optimistic: ChatMessage = {
      id: clientMsgId,
      body,
      sender: "visitor",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      await sendMessage(convId, jwt, body, clientMsgId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    }
  }, []);

  return { messages, connected, error, afterHours, send };
}
