import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Copy, ExternalLink, Plug, Server, Settings2 } from "lucide-react";
import { Link } from "react-router";
import { useTenant } from "../../providers/tenant-provider";

type CopyStatus = "idle" | "copied" | "failed";

async function copyText(value: string, setStatus: (status: CopyStatus) => void) {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    setStatus("failed");
    window.setTimeout(() => setStatus("idle"), 2500);
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    setStatus("copied");
  } catch (_error) {
    setStatus("failed");
  }

  window.setTimeout(() => setStatus("idle"), 2500);
}

function CopyButton({
  value,
  status,
  onCopy,
}: {
  value: string;
  status: CopyStatus;
  onCopy: () => Promise<void>;
}) {
  return (
    <button
      type="button"
      onClick={() => void onCopy()}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-xs text-primary hover:bg-muted"
      style={{ fontWeight: 600 }}
      aria-label="Copy integration snippet"
    >
      {status === "copied" ? <CheckCircle2 className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
      {status === "copied" ? "Copied" : status === "failed" ? "Retry copy" : "Copy"}
      <span className="sr-only">{value}</span>
    </button>
  );
}

export function IntegrationsPage() {
  const { tenant } = useTenant();
  const [envCopyStatus, setEnvCopyStatus] = useState<CopyStatus>("idle");
  const [embedCopyStatus, setEmbedCopyStatus] = useState<CopyStatus>("idle");

  const workspaceSlug = tenant?.slug || "<workspace-slug>";
  const widgetScriptUrl =
    (import.meta.env.VITE_SWYFT_WIDGET_SCRIPT_URL as string | undefined) || "https://widget.getswyftup.com/embed.js";
  const widgetLauncher = (import.meta.env.VITE_SWYFT_WIDGET_LAUNCHER as string | undefined) || "bubble";
  const widgetEnvironment = (import.meta.env.VITE_SWYFT_WIDGET_ENV as string | undefined) || "production";
  const [widgetPosition, setWidgetPosition] = useState<"left" | "right">(() => {
    const configured = ((import.meta.env.VITE_SWYFT_WIDGET_POSITION as string | undefined) || "right")
      .trim()
      .toLowerCase();
    return configured.includes("left") ? "left" : "right";
  });
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "https://api.getswyftup.com";
  const realtimeBaseUrl = (import.meta.env.VITE_WS_BASE_URL as string | undefined) || apiBaseUrl;

  const envSnippet = useMemo(
    () =>
      [
        `VITE_SWYFT_WIDGET_SCRIPT_URL=${widgetScriptUrl}`,
        `VITE_SWYFT_WIDGET_WORKSPACE_SLUG=${workspaceSlug}`,
        `VITE_SWYFT_WIDGET_LAUNCHER=${widgetLauncher}`,
        `VITE_SWYFT_WIDGET_ENV=${widgetEnvironment}`,
        `VITE_SWYFT_WIDGET_POSITION=${widgetPosition}`,
      ].join("\n"),
    [widgetEnvironment, widgetLauncher, widgetPosition, widgetScriptUrl, workspaceSlug],
  );

  const embedSnippet = useMemo(
    () =>
      [
        "<script",
        "  async",
        `  src="${widgetScriptUrl}"`,
        '  data-swyft-widget-script="true"',
        `  data-workspace-slug="${workspaceSlug}"`,
        `  data-launcher="${widgetLauncher}"`,
        `  data-environment="${widgetEnvironment}"`,
        `  data-position="${widgetPosition === "left" ? "bottom-left" : "bottom-right"}"`,
        "></script>",
      ].join("\n"),
    [widgetEnvironment, widgetLauncher, widgetPosition, widgetScriptUrl, workspaceSlug],
  );

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl text-primary flex items-center gap-2" style={{ fontWeight: 700 }}>
          <Plug className="w-6 h-6 text-accent" />
          Integrations
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect the widget and realtime APIs to your client website with tenant-safe defaults.
        </p>
      </header>

      {!tenant ? (
        <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
          <div>
            <p className="text-sm text-primary" style={{ fontWeight: 600 }}>Tenant context unavailable</p>
            <p className="text-sm text-muted-foreground">
              Load a tenant workspace first, then return to this page for copy-ready snippets.
            </p>
          </div>
        </div>
      ) : null}

      <section className="bg-white border border-border rounded-xl p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Quick setup</p>
        <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-5">
          <li>Add the widget env vars to your website service deployment.</li>
          <li>Deploy the website and confirm the embed script loads on your marketing pages.</li>
          <li>Use `/app/webhooks` for outbound tools and `/app/admin` for tenant readiness checks.</li>
        </ol>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <article className="bg-white border border-border rounded-xl p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
            <Settings2 className="w-3.5 h-3.5" />
            Tenant
          </p>
          <p className="text-sm text-primary" style={{ fontWeight: 600 }}>Workspace slug</p>
          <p className="text-xs text-muted-foreground mt-1 break-all">{workspaceSlug}</p>
          <p className="text-xs text-muted-foreground mt-3">
            This value maps directly to `VITE_SWYFT_WIDGET_WORKSPACE_SLUG`.
          </p>
        </article>

        <article className="bg-white border border-border rounded-xl p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5" />
            Runtime Endpoints
          </p>
          <div className="space-y-2 text-sm">
            <p className="text-primary" style={{ fontWeight: 600 }}>API</p>
            <p className="text-xs text-muted-foreground break-all">{apiBaseUrl}</p>
            <p className="text-primary mt-3" style={{ fontWeight: 600 }}>Realtime</p>
            <p className="text-xs text-muted-foreground break-all">{realtimeBaseUrl}</p>
            <div className="pt-2">
              <label className="block text-primary mb-1.5" style={{ fontWeight: 600 }}>
                Launcher position
              </label>
              <select
                value={widgetPosition}
                onChange={(event) => setWidgetPosition(event.target.value === "left" ? "left" : "right")}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-primary"
                aria-label="Widget launcher position"
              >
                <option value="right">Lower right</option>
                <option value="left">Lower left</option>
              </select>
            </div>
          </div>
        </article>
      </section>

      <section className="bg-white border border-border rounded-xl p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-sm text-primary" style={{ fontWeight: 600 }}>Website environment variables</p>
          <CopyButton
            value={envSnippet}
            status={envCopyStatus}
            onCopy={() => copyText(envSnippet, setEnvCopyStatus)}
          />
        </div>
        <pre className="rounded-lg border border-border bg-muted/30 p-3 text-xs overflow-x-auto">{envSnippet}</pre>
      </section>

      <section className="bg-white border border-border rounded-xl p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-sm text-primary" style={{ fontWeight: 600 }}>Direct embed snippet</p>
          <CopyButton
            value={embedSnippet}
            status={embedCopyStatus}
            onCopy={() => copyText(embedSnippet, setEmbedCopyStatus)}
          />
        </div>
        <pre className="rounded-lg border border-border bg-muted/30 p-3 text-xs overflow-x-auto">{embedSnippet}</pre>
      </section>

      <section className="bg-white border border-border rounded-xl p-5">
        <p className="text-sm text-primary mb-3" style={{ fontWeight: 600 }}>Next tools</p>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link
            to="/app/webhooks"
            className="rounded-lg border border-border p-3 text-sm text-primary hover:bg-muted flex items-center justify-between gap-2"
          >
            Webhooks <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </Link>
          <Link
            to="/app/admin"
            className="rounded-lg border border-border p-3 text-sm text-primary hover:bg-muted flex items-center justify-between gap-2"
          >
            Admin <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </Link>
          <Link
            to="/app/profile"
            className="rounded-lg border border-border p-3 text-sm text-primary hover:bg-muted flex items-center justify-between gap-2"
          >
            Profile <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </Link>
        </div>
      </section>
    </div>
  );
}
