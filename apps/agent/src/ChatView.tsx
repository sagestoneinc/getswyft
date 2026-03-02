import { useEffect, useRef, useState, type FormEvent } from "react";
import { postMessage, type Message } from "./api";
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
    const socket = getSocket();
    if (!socket) return;

    setMessages([]);
    socket.emit("join", conversationId);

    const handleHistory = (history: Message[]) => setMessages(history);
    const handleMessage = (msg: Message) => {
      if (msg.conversationId === conversationId) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("history", handleHistory);
    socket.on("message.created", handleMessage);

    return () => {
      socket.emit("leave", conversationId);
      socket.off("history", handleHistory);
      socket.off("message.created", handleMessage);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    try {
      await postMessage(token, conversationId, body);
      setDraft("");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="chat-view">
      <div className="messages">
        {messages.map((m) => (
          <div key={m.id} className={`msg msg-${m.sender}`}>
            <span className="sender">{m.sender}</span>
            <p>{m.body}</p>
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
