import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Webhook,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Send,
  Copy,
} from "lucide-react";
import {
  createWebhookEndpoint,
  deleteWebhookEndpoint,
  getWebhookWorkspace,
  sendTestWebhook,
  updateWebhookEndpoint,
  type WebhookDelivery,
  type WebhookEndpoint,
} from "../../lib/tenant-admin";

type WebhookDraft = {
  url: string;
  description: string;
  status: "active" | "disabled";
  eventTypes: string[];
};

const emptyDraft: WebhookDraft = {
  url: "",
  description: "",
  status: "active",
  eventTypes: [],
};

export function WebhooksPage() {
  const [supportedEvents, setSupportedEvents] = useState<string[]>([]);
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editEndpoint, setEditEndpoint] = useState<WebhookEndpoint | null>(null);
  const [draft, setDraft] = useState<WebhookDraft>(emptyDraft);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingEndpointId, setIsTestingEndpointId] = useState<string | null>(null);
  const [latestSecret, setLatestSecret] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadWorkspace() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getWebhookWorkspace();
        if (!mounted) {
          return;
        }

        setSupportedEvents(response.supportedEvents);
        setEndpoints(response.endpoints);
        setDeliveries(response.deliveries);
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load webhook workspace");
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadWorkspace();

    return () => {
      mounted = false;
    };
  }, []);

  const groupedDeliveries = useMemo(() => deliveries.slice(0, 20), [deliveries]);

  function openCreate() {
    setEditEndpoint(null);
    setDraft(emptyDraft);
    setLatestSecret(null);
    setShowEditor(true);
  }

  function openEdit(endpoint: WebhookEndpoint) {
    setEditEndpoint(endpoint);
    setDraft({
      url: endpoint.url,
      description: endpoint.description || "",
      status: endpoint.status,
      eventTypes: endpoint.eventTypes,
    });
    setLatestSecret(null);
    setShowEditor(true);
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);

    try {
      if (editEndpoint) {
        const response = await updateWebhookEndpoint(editEndpoint.id, draft);
        setEndpoints((currentEndpoints) =>
          currentEndpoints.map((endpoint) => (endpoint.id === response.endpoint.id ? response.endpoint : endpoint)),
        );
      } else {
        const response = await createWebhookEndpoint(draft);
        setEndpoints((currentEndpoints) => [response.endpoint, ...currentEndpoints]);
        setLatestSecret(response.signingSecret);
      }

      setShowEditor(false);
      setDraft(emptyDraft);
      setEditEndpoint(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save webhook endpoint");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(endpointId: string) {
    setError(null);

    try {
      await deleteWebhookEndpoint(endpointId);
      setEndpoints((currentEndpoints) => currentEndpoints.filter((endpoint) => endpoint.id !== endpointId));
      setDeliveries((currentDeliveries) => currentDeliveries.filter((delivery) => delivery.endpointId !== endpointId));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete webhook endpoint");
    }
  }

  async function handleTest(endpointId: string) {
    setIsTestingEndpointId(endpointId);
    setError(null);

    try {
      await sendTestWebhook(endpointId);
      const response = await getWebhookWorkspace();
      setEndpoints(response.endpoints);
      setDeliveries(response.deliveries);
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : "Failed to send test webhook");
    } finally {
      setIsTestingEndpointId(null);
    }
  }

  const statusChip = (status: WebhookDelivery["status"]) => {
    const map: Record<WebhookDelivery["status"], string> = {
      success: "bg-green-50 text-green-700",
      failed: "bg-red-50 text-red-700",
      pending: "bg-yellow-50 text-yellow-700",
    };

    return map[status];
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl text-primary" style={{ fontWeight: 700 }}>Webhooks & Integrations</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage outgoing delivery endpoints and inspect recent webhook attempts.</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-accent text-white px-4 py-2.5 rounded-lg hover:bg-accent/90 transition-all flex items-center gap-2 text-sm"
          style={{ fontWeight: 600 }}
        >
          <Plus className="w-4 h-4" /> Add Endpoint
        </button>
      </div>

      {latestSecret && (
        <div className="mb-6 bg-accent/5 border border-accent/20 rounded-xl p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-primary" style={{ fontWeight: 600 }}>Signing secret created</p>
              <p className="text-sm text-muted-foreground mt-1">Copy this once and store it on the receiving endpoint before you leave this page.</p>
            </div>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(latestSecret).catch(() => null)}
              className="px-3 py-2 rounded-lg border border-border text-sm text-primary hover:bg-white flex items-center gap-2"
            >
              <Copy className="w-4 h-4" /> Copy
            </button>
          </div>
          <pre className="mt-3 bg-white rounded-lg border border-border p-3 text-xs overflow-x-auto">{latestSecret}</pre>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-warning/5 border border-warning/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
          <div>
            <p className="text-primary text-sm" style={{ fontWeight: 600 }}>Webhook workspace needs attention</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-border mb-8">
        <div className="p-4 border-b border-border">
          <h2 className="text-primary flex items-center gap-2" style={{ fontWeight: 600 }}>
            <Webhook className="w-5 h-5 text-accent" /> Endpoints
          </h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading webhook endpoints...</p>
          </div>
        ) : endpoints.length === 0 ? (
          <div className="p-8 text-center">
            <Webhook className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No webhook endpoints configured yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {endpoints.map((endpoint) => (
              <div key={endpoint.id} className="p-4 flex items-start gap-4">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${endpoint.status === "active" ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary truncate flex items-center gap-1" style={{ fontWeight: 500 }}>
                    {endpoint.url} <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(endpoint.description || "No description")} · {endpoint.eventTypes.join(", ")}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Last success: {endpoint.lastDeliveredAt ? new Date(endpoint.lastDeliveredAt).toLocaleString() : "Never"} ·
                    Last error: {endpoint.lastErrorAt ? new Date(endpoint.lastErrorAt).toLocaleString() : "None"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTest(endpoint.id)}
                    disabled={isTestingEndpointId === endpoint.id}
                    className="p-2 hover:bg-muted rounded-lg text-muted-foreground disabled:opacity-60"
                    title="Send test webhook"
                  >
                    {isTestingEndpointId === endpoint.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openEdit(endpoint)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(endpoint.id)} className="p-2 hover:bg-red-50 rounded-lg text-destructive" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-border">
        <div className="p-4 border-b border-border">
          <h2 className="text-primary" style={{ fontWeight: 600 }}>Recent delivery logs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs text-muted-foreground" style={{ fontWeight: 600 }}>Status</th>
                <th className="px-4 py-3 text-xs text-muted-foreground" style={{ fontWeight: 600 }}>Event</th>
                <th className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell" style={{ fontWeight: 600 }}>Endpoint</th>
                <th className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell" style={{ fontWeight: 600 }}>Code</th>
                <th className="px-4 py-3 text-xs text-muted-foreground" style={{ fontWeight: 600 }}>Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {groupedDeliveries.map((delivery) => (
                <tr key={delivery.id}>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${statusChip(delivery.status)}`} style={{ fontWeight: 500 }}>
                      {delivery.status === "success" && <CheckCircle className="w-3 h-3 inline mr-1" />}
                      {delivery.status === "failed" && <XCircle className="w-3 h-3 inline mr-1" />}
                      {delivery.status === "pending" && <Clock className="w-3 h-3 inline mr-1" />}
                      {delivery.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-primary">{delivery.eventType}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell max-w-[260px] truncate">{delivery.endpointUrl}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{delivery.statusCode || "-"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(delivery.attemptedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && groupedDeliveries.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">No delivery logs yet.</div>
          )}
        </div>
      </div>

      {showEditor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg text-primary" style={{ fontWeight: 600 }}>
                {editEndpoint ? "Edit Endpoint" : "Add Endpoint"}
              </h2>
              <button onClick={() => setShowEditor(false)} className="p-1 hover:bg-muted rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Destination URL</label>
                <input
                  type="url"
                  value={draft.url}
                  onChange={(event) => setDraft((current) => ({ ...current, url: event.target.value }))}
                  placeholder="https://your-system.example/webhooks/getswyft"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Description</label>
                <input
                  type="text"
                  value={draft.description}
                  onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                  placeholder="CRM sync, data warehouse, Slack bridge..."
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Events</label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {supportedEvents.map((eventType) => (
                    <label key={eventType} className="flex items-center gap-2 text-sm cursor-pointer rounded-lg border border-border px-3 py-2">
                      <input
                        type="checkbox"
                        checked={draft.eventTypes.includes(eventType)}
                        onChange={(event) => {
                          setDraft((current) => ({
                            ...current,
                            eventTypes: event.target.checked
                              ? [...current.eventTypes, eventType]
                              : current.eventTypes.filter((currentEvent) => currentEvent !== eventType),
                          }));
                        }}
                        className="accent-[#14b8a6]"
                      />
                      {eventType}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Status</label>
                <select
                  value={draft.status}
                  onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as WebhookDraft["status"] }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-accent text-white py-2.5 rounded-lg hover:bg-accent/90 text-sm disabled:opacity-70 flex items-center justify-center gap-2"
                style={{ fontWeight: 600 }}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isSaving ? "Saving..." : editEndpoint ? "Save Changes" : "Create Endpoint"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
