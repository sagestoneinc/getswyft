import { useEffect, useState } from "react";
import { AlertTriangle, FileClock, Loader2, RefreshCw } from "lucide-react";
import { listAuditLogs, type AuditLogItem } from "../../lib/operations";

function metadataToText(metadata: unknown) {
  if (!metadata) {
    return "-";
  }

  try {
    return JSON.stringify(metadata);
  } catch {
    return "[unserializable metadata]";
  }
}

export function AuditPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadLogs() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listAuditLogs(100);
      setLogs(response.logs || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load audit logs");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadLogs();
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl text-primary flex items-center gap-2" style={{ fontWeight: 700 }}>
            <FileClock className="w-6 h-6 text-accent" /> Audit Logs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Tenant audit trail for privileged actions and system events.</p>
        </div>

        <button
          type="button"
          onClick={() => void loadLogs()}
          className="px-3 py-2 rounded-lg border border-border bg-white hover:bg-muted text-sm inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error ? (
        <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      ) : null}

      {isLoading ? (
        <div className="bg-white border border-border rounded-xl p-10 text-center">
          <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading audit logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-10 text-center">
          <FileClock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No audit logs yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs text-muted-foreground" style={{ fontWeight: 600 }}>Time</th>
                <th className="px-4 py-3 text-xs text-muted-foreground" style={{ fontWeight: 600 }}>Action</th>
                <th className="px-4 py-3 text-xs text-muted-foreground" style={{ fontWeight: 600 }}>Entity</th>
                <th className="px-4 py-3 text-xs text-muted-foreground" style={{ fontWeight: 600 }}>Actor</th>
                <th className="px-4 py-3 text-xs text-muted-foreground" style={{ fontWeight: 600 }}>Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-primary" style={{ fontWeight: 600 }}>{log.action}</td>
                  <td className="px-4 py-3 text-muted-foreground">{log.entityType}{log.entityId ? `:${log.entityId}` : ""}</td>
                  <td className="px-4 py-3 text-muted-foreground">{log.actorUserId || "system"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[360px] truncate" title={metadataToText(log.metadata)}>
                    {metadataToText(log.metadata)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
