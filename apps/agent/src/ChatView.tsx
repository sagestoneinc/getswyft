import { useEffect, useRef, useState, type FormEvent } from "react";
import { fetchMessages, postMessage, type Message } from "./api";
import { getSocket } from "./socket";

export type Tab = "unassigned" | "mine" | "closed";

interface Props {
  conversationId: string;
  token: string;
  agentId: string | null;
  tab: Tab;
  onAssignToMe: (conversationId: string) => void;
  onClose: (conversationId: string) => void;
  onReopen: (conversationId: string) => void;
}

export default function ChatView({ conversationId, token, agentId, tab, onAssignToMe, onClose, onReopen }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
    fetchMessages(token, conversationId).then(setMessages);

    const socket = getSocket();
    if (!socket) return;

    socket.emit("join", conversationId);

    const handleEvent = (evt: { type: string; conversationId: string; payload: unknown }) => {
      if (evt.type === "conversation.history" && evt.conversationId === conversationId) {
        const histPayload = evt.payload as { messages: Message[] };
        setMessages(histPayload.messages);
      }
      if (evt.type === "message.created" && evt.conversationId === conversationId) {
        const msg = evt.payload as Message;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    socket.on("event", handleEvent);

    return () => {
      socket.emit("leave", conversationId);
      socket.off("event", handleEvent);
    };
  }, [conversationId, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    try {
      await postMessage(token, conversationId, text);
      setDraft("");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="chat-view">
      <div className="chat-actions">
        {tab === "unassigned" && agentId && (
          <button className="action-btn" onClick={() => onAssignToMe(conversationId)}>Assign to me</button>
        )}
        {tab !== "closed" && (
          <button className="action-btn action-close" onClick={() => onClose(conversationId)}>Close</button>
        )}
        {tab === "closed" && (
          <button className="action-btn" onClick={() => onReopen(conversationId)}>Reopen</button>
        )}
      </div>
      <div className="messages">
        {messages.map((m) => (
          <div key={m.id} className={`msg msg-${m.senderType}`}>
            <span className="sender">{m.senderType}</span>
            <p>{m.text}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form className="composer" onSubmit={handleSend}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          disabled={sending}
        />
        <button type="submit" disabled={sending || !draft.trim()}>
          Send
        </button>
      </form>
    </section>
  );
}
