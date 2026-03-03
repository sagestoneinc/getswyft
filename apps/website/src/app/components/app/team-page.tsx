import { useState } from "react";
import { Plus, Pencil, X, Users, Search } from "lucide-react";
import { agents, type Agent } from "./mock-data";

export function TeamPage() {
  const [agentList] = useState(agents);
  const [showAdd, setShowAdd] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = agentList.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    online: "bg-green-500",
    offline: "bg-gray-300",
    busy: "bg-amber-500",
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl text-primary" style={{ fontWeight: 700 }}>Team / Agents</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your team members and roles</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-accent text-white px-4 py-2.5 rounded-lg hover:bg-accent/90 transition-all flex items-center gap-2 text-sm"
          style={{ fontWeight: 600 }}
        >
          <Plus className="w-4 h-4" /> Add Agent
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search agents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
        />
      </div>

      <div className="bg-white rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs text-muted-foreground" style={{ fontWeight: 600 }}>Agent</th>
                <th className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell" style={{ fontWeight: 600 }}>Email</th>
                <th className="px-4 py-3 text-xs text-muted-foreground" style={{ fontWeight: 600 }}>Role</th>
                <th className="px-4 py-3 text-xs text-muted-foreground" style={{ fontWeight: 600 }}>Status</th>
                <th className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell" style={{ fontWeight: 600 }}>Chats</th>
                <th className="px-4 py-3 text-xs text-muted-foreground" style={{ fontWeight: 600 }}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((agent) => (
                <tr key={agent.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-accent/10 rounded-full flex items-center justify-center text-xs text-accent" style={{ fontWeight: 600 }}>
                        {agent.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <span className="text-sm text-primary" style={{ fontWeight: 500 }}>{agent.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{agent.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${agent.role === "admin" ? "bg-purple-50 text-purple-700" : "bg-muted text-muted-foreground"}`} style={{ fontWeight: 500 }}>
                      {agent.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-xs">
                      <span className={`w-2 h-2 rounded-full ${statusColors[agent.status]}`}></span>
                      {agent.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{agent.conversations}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setEditAgent(agent)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground">
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No agents found.</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg text-primary" style={{ fontWeight: 600 }}>Add Agent</h2>
              <button onClick={() => setShowAdd(false)} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setShowAdd(false); }} className="space-y-4">
              <div>
                <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Name</label>
                <input type="text" required className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm" placeholder="Full name" />
              </div>
              <div>
                <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Email</label>
                <input type="email" required className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm" placeholder="agent@company.com" />
              </div>
              <div>
                <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Role</label>
                <select className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm">
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-accent text-white py-2.5 rounded-lg hover:bg-accent/90 text-sm" style={{ fontWeight: 600 }}>
                Send Invite
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editAgent && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg text-primary" style={{ fontWeight: 600 }}>Edit Role - {editAgent.name}</h2>
              <button onClick={() => setEditAgent(null)} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Role</label>
                <select defaultValue={editAgent.role} className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm">
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button onClick={() => setEditAgent(null)} className="w-full bg-accent text-white py-2.5 rounded-lg hover:bg-accent/90 text-sm" style={{ fontWeight: 600 }}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
