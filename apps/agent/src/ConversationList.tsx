import type { ConversationSummary, ConversationTab } from "./api";

interface Props {
  conversations: ConversationSummary[];
  counts: Record<ConversationTab, number>;
  activeId: string | null;
  onSelect: (id: string) => void;
  tab: ConversationTab;
  onTabChange: (tab: ConversationTab) => void;
  onAssignToMe: (conversationId: string) => void;
  canAssign: boolean;
  isLoading: boolean;
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ConversationList({
  conversations,
  counts,
  activeId,
  onSelect,
  tab,
  onTabChange,
  onAssignToMe,
  canAssign,
  isLoading,
}: Props) {
  return (
    <aside className="conversation-list">
      <div className="conversation-list-header">
        <div>
          <p className="eyebrow">Inbox</p>
          <h2>Active queues</h2>
        </div>
        {isLoading && <span className="status-badge status-badge--muted">Refreshing</span>}
      </div>
      <div className="tabs">
        <button className={tab === "unassigned" ? "tab active" : "tab"} onClick={() => onTabChange("unassigned")}>
          Unassigned
          <span>{counts.unassigned || 0}</span>
        </button>
        <button className={tab === "mine" ? "tab active" : "tab"} onClick={() => onTabChange("mine")}>
          Mine
          <span>{counts.mine || 0}</span>
        </button>
        <button className={tab === "closed" ? "tab active" : "tab"} onClick={() => onTabChange("closed")}>
          Closed
          <span>{counts.closed || 0}</span>
        </button>
      </div>
      <ul>
        {conversations.length === 0 && (
          <li className="empty-list">{isLoading ? "Loading conversations..." : "No conversations in this queue."}</li>
        )}
        {conversations.map((c) => {
          const isUnassigned = !c.assignedUserId && c.workflowStatus !== "closed";

          return (
            <li key={c.id} className="conv-item">
              <div
                className={`conv-content ${c.id === activeId ? "active" : ""}`}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(c.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(c.id); } }}
              >
                <div className="conv-lead">
                  <span className="conv-name">{c.lead.name || "Unknown lead"}</span>
                  {c.afterHours && <span className="badge badge-afterhours">After Hours</span>}
                  {isUnassigned && <span className="badge badge-unassigned">Unassigned</span>}
                  {c.unreadCount > 0 && <span className="badge badge-unread">{c.unreadCount} new</span>}
                </div>
                {c.lead.email && <span className="conv-email">{c.lead.email}</span>}
                {c.lead.phone && <span className="conv-phone">{c.lead.phone}</span>}
                {c.listing.address ? (
                  <span className="conv-listing">
                    {c.listing.address}
                    {c.listing.price ? ` • ${c.listing.price}` : ""}
                  </span>
                ) : null}
                {c.lastMessage && (
                  <span className="conv-preview">
                    {c.lastMessage.slice(0, 80)}
                    {c.lastMessage.length > 80 ? "…" : ""}
                  </span>
                )}
                <div className="conv-meta">
                  <span className="conv-date">{formatTimestamp(c.lastMessageAt || c.createdAt)}</span>
                  {c.assignedTo && <span className="conv-assigned">Assigned to {c.assignedTo}</span>}
                </div>
              </div>
              {tab === "unassigned" && isUnassigned && canAssign && (
                <button
                  className="assign-btn"
                  onClick={() => onAssignToMe(c.id)}
                >
                  Claim
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
