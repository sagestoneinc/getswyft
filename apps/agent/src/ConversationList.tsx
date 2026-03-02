import type { Conversation } from "./api";

type Tab = "unassigned" | "mine" | "closed";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  onAssignToMe: (conversationId: string) => void;
  agentId: string | null;
}

export default function ConversationList({ conversations, activeId, onSelect, tab, onTabChange, onAssignToMe, agentId }: Props) {
  return (
    <aside className="conversation-list">
      <h2>Inbox</h2>
      <div className="tabs">
        <button className={tab === "unassigned" ? "tab active" : "tab"} onClick={() => onTabChange("unassigned")}>Unassigned</button>
        <button className={tab === "mine" ? "tab active" : "tab"} onClick={() => onTabChange("mine")}>Mine</button>
        <button className={tab === "closed" ? "tab active" : "tab"} onClick={() => onTabChange("closed")}>Closed</button>
      </div>
      <ul>
        {conversations.length === 0 && (
          <li className="empty-list">No conversations</li>
        )}
        {conversations.map((c) => {
          const ctx = c.context as Record<string, unknown>;
          const listing = ctx?.listing as Record<string, unknown> | undefined;
          const lastMsg = c.messages?.[0];
          return (
            <li key={c.id}>
              <button
                className={c.id === activeId ? "active" : ""}
                onClick={() => onSelect(c.id)}
              >
                <div className="conv-lead">
                  <span className="conv-name">{c.leadName || "Unknown"}</span>
                  {c.afterHours && <span className="badge badge-afterhours">After Hours</span>}
                  {!c.assignedAgentId && <span className="badge badge-unassigned">Unassigned</span>}
                </div>
                {c.leadEmail && <span className="conv-email">{c.leadEmail}</span>}
                {c.leadPhone && <span className="conv-phone">{c.leadPhone}</span>}
                {listing?.address ? <span className="conv-listing">{String(listing.address)}{listing?.price ? ` • ${String(listing.price)}` : ""}</span> : null}
                {lastMsg && <span className="conv-preview">{lastMsg.text?.slice(0, 60)}{(lastMsg.text?.length ?? 0) > 60 ? "…" : ""}</span>}
                <span className="conv-date">{new Date(c.createdAt).toLocaleString()}</span>
                {tab === "unassigned" && !c.assignedAgentId && agentId && (
                  <span
                    className="assign-btn"
                    onClick={(e) => { e.stopPropagation(); onAssignToMe(c.id); }}
                  >
                    Assign to me
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
