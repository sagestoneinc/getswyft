import { useEffect, useRef, useState, type FormEvent } from "react";
import { fetchMessages, postMessage, type Message } from "./api";
import { getSocket } from "./socket";

interface Props {
  conversationId: string;
  token: string;
}

export default function ChatView({ conversationId, token }: Props) {
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

    const handleMessage = (msg: Message) => {
      if (msg.conversationId === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    socket.on("message.created", handleMessage);

    return () => {
      socket.emit("leave", conversationId);
      socket.off("message.created", handleMessage);
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
