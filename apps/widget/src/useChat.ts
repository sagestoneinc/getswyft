import { useCallback, useEffect, useRef, useState } from "react";
import { createSession, sendMessage } from "./api";
import { connectSocket, joinConversation, disconnectSocket, getSocket } from "./socket";

export interface ChatMessage {
  id: string;
  body: string;
  sender: "visitor" | "agent";
  timestamp: string;
}

interface UseChatOptions {
  tenantId: string;
  lead: Record<string, unknown>;
  listing: Record<string, unknown>;
}

export function useChat({ tenantId, lead, listing }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const visitorJwtRef = useRef<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    let cancelled = false;

    async function init() {
      try {
        const { visitorJwt, conversationId } = await createSession(
          tenantId,
          lead,
          listing,
        );

        if (cancelled) return;

        visitorJwtRef.current = visitorJwt;
        conversationIdRef.current = conversationId;

        const socket = connectSocket(visitorJwt);

        socket.on("connect", () => {
          if (!cancelled) {
            setConnected(true);
            joinConversation(conversationId);
          }
        });

        socket.on("disconnect", () => {
          if (!cancelled) setConnected(false);
        });

        socket.on("message.created", (msg: { id: string; body: string; sender: string; createdAt: string }) => {
          if (cancelled) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [
              ...prev,
              {
                id: msg.id,
                body: msg.body,
                sender: msg.sender === "visitor" ? "visitor" : "agent",
                timestamp: msg.createdAt,
              },
            ];
          });
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
  }, [tenantId, lead, listing]);

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
    } catch {
      setError("Failed to send message");
    }
  }, []);

  const sendTyping = useCallback(() => {
    const socket = getSocket();
    const convId = conversationIdRef.current;
    if (socket && convId) {
      socket.emit("typing", convId);
    }
  }, []);

  return { messages, connected, error, send, sendTyping };
}
