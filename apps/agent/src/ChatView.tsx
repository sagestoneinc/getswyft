import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ConversationMessage, ConversationSummary } from "./api";

interface Props {
  conversation: ConversationSummary | null;
  messages: ConversationMessage[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  canWrite: boolean;
  canManage: boolean;
  onSendMessage: (body: string) => Promise<void>;
  onAssignToMe: () => Promise<void>;
  onCloseConversation: () => Promise<void>;
  onReopenConversation: () => Promise<void>;
}

function formatMessageTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ChatView({
  conversation,
  messages,
  isLoading,
  isSending,
  error,
  canWrite,
  canManage,
  onSendMessage,
  onAssignToMe,
  onCloseConversation,
  onReopenConversation,
}: Props) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !canWrite) return;

    await onSendMessage(text);
    setDraft("");
  }

  if (!conversation) {
    return (
      <section className="chat-view chat-view--empty">
        <div className="empty-state">
          <p className="eyebrow">Conversation</p>
          <h2>Select a thread</h2>
          <p>Pick a conversation from the inbox to load history, join the room, and reply in real time.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="chat-view">
      <header className="chat-header">
        <div>
          <p className="eyebrow">Conversation</p>
          <h2>{conversation.lead.name || "Unknown lead"}</h2>
          <p className="chat-subtitle">
            {conversation.listing.address || "No listing address"}
            {conversation.assignedTo ? ` • Assigned to ${conversation.assignedTo}` : " • Unassigned"}
          </p>
        </div>
        <div className="chat-actions">
          {conversation.status === "unassigned" && canManage && (
            <button className="action-btn" onClick={() => void onAssignToMe()}>
              Assign to me
            </button>
          )}
          {conversation.workflowStatus !== "closed" && canManage && (
            <button className="action-btn action-close" onClick={() => void onCloseConversation()}>
              Close
            </button>
          )}
          {conversation.workflowStatus === "closed" && canManage && (
            <button className="action-btn" onClick={() => void onReopenConversation()}>
              Reopen
            </button>
          )}
        </div>
      </header>

      {error && <p className="panel-error">{error}</p>}

      <div className="messages">
        {isLoading && <div className="messages-empty">Loading message history...</div>}
        {!isLoading && messages.length === 0 && (
          <div className="messages-empty">No messages yet. Start the conversation when you're ready.</div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`msg msg-${m.senderType}`}>
            <div className="msg-meta">
              <span className="sender">{m.senderName || m.senderType}</span>
              <span>{formatMessageTimestamp(m.createdAt)}</span>
            </div>
            <p>{m.body}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form className="composer" onSubmit={handleSend}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={canWrite ? "Type a message..." : "You do not have permission to send messages"}
          disabled={isSending || !canWrite}
        />
        <button type="submit" disabled={isSending || !draft.trim() || !canWrite}>
          Send
        </button>
      </form>
    </section>
  );
}
