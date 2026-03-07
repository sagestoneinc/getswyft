import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Search, Filter, Clock, MessageCircle, User, ChevronRight, Loader2, AlertTriangle } from "lucide-react";
import {
  type ConversationSummary,
  type ConversationTab,
  formatConversationTimestamp,
  listConversations,
} from "../../lib/conversations";

export function InboxPage() {
  const [activeTab, setActiveTab] = useState<ConversationTab>("unassigned");
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [counts, setCounts] = useState<Record<ConversationTab, number>>({
    unassigned: 0,
    mine: 0,
    closed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadConversations() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await listConversations({
          status: activeTab,
          q: searchQuery,
        });

        if (!mounted) {
          return;
        }

        setConversations(response.conversations);
        setCounts(response.counts);
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load conversations");
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadConversations();

    return () => {
      mounted = false;
    };
  }, [activeTab, searchQuery]);

  const tabs: { key: ConversationTab; label: string; count: number }[] = [
    { key: "unassigned", label: "Unassigned", count: counts.unassigned },
    { key: "mine", label: "Mine", count: counts.mine },
    { key: "closed", label: "Closed", count: counts.closed },
  ];

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl text-primary" style={{ fontWeight: 700 }}>
          Inbox
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your live tenant conversations</p>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search leads, addresses, messages..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
          />
        </div>
        <button
          type="button"
          className="px-4 py-2.5 rounded-lg border border-border bg-white hover:bg-muted transition-colors flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Filter className="w-4 h-4" /> Search
        </button>
      </div>

      <div className="flex gap-1 bg-muted rounded-lg p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-4 rounded-md text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === tab.key ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-primary"
            }`}
            style={{ fontWeight: activeTab === tab.key ? 600 : 400 }}
          >
            {tab.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? "bg-accent text-white" : "bg-muted-foreground/20"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {error ? (
        <div className="text-center py-16 bg-white rounded-xl border border-border">
          <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
          <h3 className="text-primary mb-2" style={{ fontWeight: 600 }}>
            Inbox unavailable
          </h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      ) : isLoading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-border">
          <Loader2 className="w-12 h-12 text-accent mx-auto mb-4 animate-spin" />
          <h3 className="text-primary mb-2" style={{ fontWeight: 600 }}>
            Loading conversations
          </h3>
          <p className="text-sm text-muted-foreground">Syncing your tenant inbox...</p>
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-border">
          <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-primary mb-2" style={{ fontWeight: 600 }}>
            No conversations
          </h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? "No results match your search." : `No ${activeTab} conversations right now.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conversation) => (
            <Link
              key={conversation.id}
              to={`/app/conversation/${conversation.id}`}
              className="block bg-white rounded-xl border border-border p-4 hover:border-accent/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm text-primary truncate" style={{ fontWeight: 600 }}>
                        {conversation.lead.name}
                      </span>
                      {conversation.afterHours && (
                        <span
                          className="text-[10px] bg-warning/10 text-warning px-1.5 py-0.5 rounded"
                          style={{ fontWeight: 600 }}
                        >
                          After Hours
                        </span>
                      )}
                      {conversation.status === "unassigned" && (
                        <span
                          className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded"
                          style={{ fontWeight: 600 }}
                        >
                          Unassigned
                        </span>
                      )}
                      {conversation.unreadCount > 0 && (
                        <span
                          className="text-[10px] bg-accent text-white px-1.5 py-0.5 rounded"
                          style={{ fontWeight: 600 }}
                        >
                          {conversation.unreadCount} unread
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatConversationTimestamp(conversation.lastMessageAt)}
                    </span>
                  </div>
                  <p className="text-xs text-accent mb-1">
                    {conversation.listing.address} &middot; {conversation.listing.price}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage || "No messages yet."}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-3" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
