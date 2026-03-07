import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, ShieldAlert, RefreshCw, Plus } from "lucide-react";
import {
  createModerationReport,
  listModerationReports,
  updateModerationStatus,
  type ModerationItem,
} from "../../lib/operations";

const statuses: Array<ModerationItem["status"]> = ["OPEN", "REVIEWING", "RESOLVED", "DISMISSED"];

export function ModerationPage() {
  const [reports, setReports] = useState<ModerationItem[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [targetType, setTargetType] = useState("conversation_message");
  const [targetId, setTargetId] = useState("");
  const [reason, setReason] = useState("");

  async function loadReports(status?: string) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listModerationReports(status || undefined);
      setReports(response.reports || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load moderation reports");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadReports(selectedStatus || undefined);
  }, [selectedStatus]);

  async function handleCreate() {
    if (!targetId.trim() || !reason.trim()) {
      setError("Target ID and reason are required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await createModerationReport({
        targetType,
        targetId: targetId.trim(),
        reason: reason.trim(),
      });
      setReports((current) => [response.report, ...current]);
      setTargetId("");
      setReason("");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create moderation report");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusUpdate(reportId: string, status: ModerationItem["status"]) {
    try {
      const response = await updateModerationStatus(reportId, status);
      setReports((current) => current.map((entry) => (entry.id === reportId ? response.report : entry)));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update report status");
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl text-primary flex items-center gap-2" style={{ fontWeight: 700 }}>
            <ShieldAlert className="w-6 h-6 text-accent" /> Moderation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Create reports and manage moderation lifecycle.</p>
        </div>

        <button
          type="button"
          onClick={() => void loadReports(selectedStatus || undefined)}
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

      <div className="bg-white border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-base text-primary" style={{ fontWeight: 650 }}>Create Report</h2>

        <div className="grid md:grid-cols-3 gap-4">
          <label className="text-sm text-primary" style={{ fontWeight: 500 }}>
            Target Type
            <input
              value={targetType}
              onChange={(event) => setTargetType(event.target.value)}
              className="mt-1.5 w-full px-3 py-2 rounded-lg border border-border bg-input-background"
            />
          </label>
          <label className="text-sm text-primary" style={{ fontWeight: 500 }}>
            Target ID
            <input
              value={targetId}
              onChange={(event) => setTargetId(event.target.value)}
              className="mt-1.5 w-full px-3 py-2 rounded-lg border border-border bg-input-background"
              placeholder="message_123"
            />
          </label>
          <label className="text-sm text-primary" style={{ fontWeight: 500 }}>
            Reason
            <input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="mt-1.5 w-full px-3 py-2 rounded-lg border border-border bg-input-background"
              placeholder="spam"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-lg bg-accent text-white hover:bg-accent/90 text-sm inline-flex items-center gap-2 disabled:opacity-60"
          style={{ fontWeight: 600 }}
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-primary" style={{ fontWeight: 500 }}>Filter status:</label>
        <select
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-white text-sm"
        >
          <option value="">All</option>
          {statuses.map((status) => (
            <option key={status} value={status.toLowerCase()}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="bg-white border border-border rounded-xl p-10 text-center">
          <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading moderation reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-10 text-center">
          <ShieldAlert className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No moderation reports for this filter.</p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl divide-y divide-border">
          {reports.map((report) => (
            <div key={report.id} className="p-4 md:p-5 flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <p className="text-sm text-primary" style={{ fontWeight: 650 }}>
                  {report.targetType} · {report.targetId}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Reason: {report.reason}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(report.createdAt).toLocaleString()} · reporter: {report.reporterUserId || "n/a"}
                </p>
              </div>

              <select
                value={report.status}
                onChange={(event) => void handleStatusUpdate(report.id, event.target.value as ModerationItem["status"])}
                className="px-3 py-2 rounded-lg border border-border bg-white text-xs"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
