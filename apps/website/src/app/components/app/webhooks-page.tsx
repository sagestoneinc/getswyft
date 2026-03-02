import { useState } from "react";
import { Plus, Pencil, Trash2, X, CheckCircle, XCircle, Clock, Webhook, ExternalLink } from "lucide-react";
import { webhookEndpoints, deliveryLogs, type WebhookEndpoint } from "./mock-data";

export function WebhooksPage() {
  const [endpoints, setEndpoints] = useState(webhookEndpoints);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>([]);

  const allEvents = ["conversation.created", "conversation.closed", "message.sent", "lead.created"];

  const handleAdd = () => {
    if (!newUrl) return;
    const ep: WebhookEndpoint = {
      id: `wh${Date.now()}`,
      url: newUrl,
      events: newEvents,
      status: "active",
      createdAt: "2026-03-02",
    };
    setEndpoints([...endpoints, ep]);
    setShowAdd(false);
    setNewUrl("");
    setNewEvents([]);
  };

  const handleDelete = () => {
    setEndpoints(endpoints.filter((e) => e.id !== deleteId));
    setDeleteId(null);
  };

  const statusChip = (s: string) => {
    const map: Record<string, string> = {
      success: "bg-green-50 text-green-700",
      failed: "bg-red-50 text-red-700",
      pending: "bg-yellow-50 text-yellow-700",
    };
    return map[s] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl text-primary" style={{ fontWeight: 700 }}>Webhooks & Integrations</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage webhook endpoints and view delivery logs</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-accent text-white px-4 py-2.5 rounded-lg hover:bg-accent/90 transition-all flex items-center gap-2 text-sm"
          style={{ fontWeight: 600 }}
        >
          <Plus className="w-4 h-4" /> Add Endpoint
        </button>
      </div>

      {/* Endpoints List */}
      <div className="bg-white rounded-xl border border-border mb-8">
        <div className="p-4 border-b border-border">
          <h2 className="text-primary flex items-center gap-2" style={{ fontWeight: 600 }}>
            <Webhook className="w-5 h-5 text-accent" /> Endpoints
          </h2>
        </div>
        {endpoints.length === 0 ? (
          <div className="p-8 text-center">
            <Webhook className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No webhook endpoints configured.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {endpoints.map((ep) => (
              <div key={ep.id} className="p-4 flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ep.status === "active" ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary truncate flex items-center gap-1" style={{ fontWeight: 500 }}>
                    {ep.url} <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {ep.events.join(", ")} &middot; Created {ep.createdAt}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditId(ep.id)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteId(ep.id)} className="p-2 hover:bg-red-50 rounded-lg text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delivery Logs */}
      <div className="bg-white rounded-xl border border-border">
        <div className="p-4 border-b border-border">
          <h2 className="text-primary" style={{ fontWeight: 600 }}>Delivery Logs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs text-muted-foreground" style={{ fontWeight: 600 }}>Status</th>
                <th className="px-4 py-3 text-xs text-muted-foreground" style={{ fontWeight: 600 }}>Event</th>
                <th className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell" style={{ fontWeight: 600 }}>Code</th>
                <th className="px-4 py-3 text-xs text-muted-foreground" style={{ fontWeight: 600 }}>Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {deliveryLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${statusChip(log.status)}`} style={{ fontWeight: 500 }}>
                      {log.status === "success" && <CheckCircle className="w-3 h-3 inline mr-1" />}
                      {log.status === "failed" && <XCircle className="w-3 h-3 inline mr-1" />}
                      {log.status === "pending" && <Clock className="w-3 h-3 inline mr-1" />}
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-primary">{log.event}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{log.statusCode || "-"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg text-primary" style={{ fontWeight: 600 }}>Add Endpoint</h2>
              <button onClick={() => setShowAdd(false)} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>URL</label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://your-server.com/webhook"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Events</label>
                <div className="space-y-2">
                  {allEvents.map((ev) => (
                    <label key={ev} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newEvents.includes(ev)}
                        onChange={(e) => {
                          if (e.target.checked) setNewEvents([...newEvents, ev]);
                          else setNewEvents(newEvents.filter((x) => x !== ev));
                        }}
                        className="accent-[#14b8a6]"
                      />
                      {ev}
                    </label>
                  ))}
                </div>
              </div>
              <button onClick={handleAdd} className="w-full bg-accent text-white py-2.5 rounded-lg hover:bg-accent/90 text-sm" style={{ fontWeight: 600 }}>
                Add Endpoint
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <Trash2 className="w-10 h-10 text-destructive mx-auto mb-4" />
            <h2 className="text-lg text-primary mb-2" style={{ fontWeight: 600 }}>Delete Endpoint?</h2>
            <p className="text-sm text-muted-foreground mb-6">This action cannot be undone. All delivery logs for this endpoint will also be removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-lg border border-border hover:bg-muted text-sm">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-lg bg-destructive text-white hover:bg-destructive/90 text-sm" style={{ fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg text-primary" style={{ fontWeight: 600 }}>Edit Endpoint</h2>
              <button onClick={() => setEditId(null)} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>URL</label>
                <input
                  type="url"
                  defaultValue={endpoints.find((e) => e.id === editId)?.url}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Events</label>
                <div className="space-y-2">
                  {allEvents.map((ev) => (
                    <label key={ev} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={endpoints.find((e) => e.id === editId)?.events.includes(ev)}
                        className="accent-[#14b8a6]"
                      />
                      {ev}
                    </label>
                  ))}
                </div>
              </div>
              <button onClick={() => setEditId(null)} className="w-full bg-accent text-white py-2.5 rounded-lg hover:bg-accent/90 text-sm" style={{ fontWeight: 600 }}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
