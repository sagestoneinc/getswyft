import type { Conversation } from "./api";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export default function ConversationList({ conversations, activeId, onSelect }: Props) {
  return (
    <aside className="conversation-list">
      <h2>Conversations</h2>
      <ul>
        {conversations.map((c) => (
          <li key={c.id}>
            <button
              className={c.id === activeId ? "active" : ""}
              onClick={() => onSelect(c.id)}
            >
              <span className="conv-status">{c.status}</span>
              {c.assignedAgent && (
                <span className="conv-agent">{c.assignedAgent.name}</span>
              )}
              <span className="conv-date">
                {new Date(c.createdAt).toLocaleString()}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
