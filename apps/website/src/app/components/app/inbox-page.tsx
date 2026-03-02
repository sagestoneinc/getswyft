import { useState } from "react";
import { Link } from "react-router";
import { Search, Filter, Clock, MessageCircle, User, ChevronRight } from "lucide-react";
import { conversations } from "./mock-data";

type Tab = "unassigned" | "mine" | "closed";

export function InboxPage() {
  const [activeTab, setActiveTab] = useState<Tab>("unassigned");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = conversations.filter((c) => {
    if (c.status !== activeTab) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.lead.name.toLowerCase().includes(q) ||
        c.listing.address.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "unassigned", label: "Unassigned", count: conversations.filter((c) => c.status === "unassigned").length },
    { key: "mine", label: "Mine", count: conversations.filter((c) => c.status === "mine").length },
    { key: "closed", label: "Closed", count: conversations.filter((c) => c.status === "closed").length },
  ];

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl text-primary" style={{ fontWeight: 700 }}>Inbox</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your conversations</p>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search leads, addresses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
          />
        </div>
        <button className="px-4 py-2.5 rounded-lg border border-border bg-white hover:bg-muted transition-colors flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-4 rounded-md text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === tab.key
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-primary"
            }`}
            style={{ fontWeight: activeTab === tab.key ? 600 : 400 }}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab.key ? "bg-accent text-white" : "bg-muted-foreground/20"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Conversation List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-border">
          <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-primary mb-2" style={{ fontWeight: 600 }}>No conversations</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? "No results match your search." : `No ${activeTab} conversations right now.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((conv) => (
            <Link
              key={conv.id}
              to={`/app/conversation/${conv.id}`}
              className="block bg-white rounded-xl border border-border p-4 hover:border-accent/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm text-primary truncate" style={{ fontWeight: 600 }}>{conv.lead.name}</span>
                      {conv.afterHours && (
                        <span className="text-[10px] bg-warning/10 text-warning px-1.5 py-0.5 rounded" style={{ fontWeight: 600 }}>
                          After Hours
                        </span>
                      )}
                      {conv.status === "unassigned" && (
                        <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded" style={{ fontWeight: 600 }}>
                          Unassigned
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {conv.lastTime}
                    </span>
                  </div>
                  <p className="text-xs text-accent mb-1">{conv.listing.address} &middot; {conv.listing.price}</p>
                  <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
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
