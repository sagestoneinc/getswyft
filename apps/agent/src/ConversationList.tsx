interface Conversation {
  id: string;
  title: string;
  createdAt: string;
}

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
              {c.title}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
