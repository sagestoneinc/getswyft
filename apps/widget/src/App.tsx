import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL || apiBaseUrl;
const socketToken = import.meta.env.VITE_SOCKET_TOKEN as string | undefined;

type WidgetMode = "booting" | "ready" | "error";

function getRuntimeContext() {
  const params = new URLSearchParams(window.location.search);

  return {
    tenantId: params.get("tenantId")?.trim() || params.get("workspaceId")?.trim() || "",
    tenantSlug: params.get("tenantSlug")?.trim() || "",
    environment: params.get("env")?.trim() || "production",
    launcher: params.get("launcher")?.trim() || "bubble",
    position: params.get("position")?.trim() || "right",
    embedded: window.self !== window.top,
  };
}

function App() {
  const context = useMemo(() => getRuntimeContext(), []);
  const [mode, setMode] = useState<WidgetMode>("booting");
  const [details, setDetails] = useState<string>("Connecting to SwyftUp services...");

  useEffect(() => {
    let mounted = true;
    const tenantContext =
      context.tenantId
        ? { tenantId: context.tenantId }
        : context.tenantSlug
          ? { tenantSlug: context.tenantSlug }
          : { tenantSlug: "default" };
    let heartbeatTimer: number | null = null;
    const socket = io(wsBaseUrl, {
      transports: ["websocket"],
      auth: socketToken
        ? { token: socketToken, ...tenantContext }
        : {
            devUserId: "widget-local",
            devEmail: "widget@getswyft.local",
            ...tenantContext,
          },
    });

    async function boot() {
      try {
        const response = await fetch(`${apiBaseUrl}/health`);
        if (!response.ok) {
          throw new Error(`API health failed (${response.status})`);
        }

        socket.on("connect", () => {
          if (!mounted) {
            return;
          }
          setMode("ready");
          setDetails("Connected. Your widget runtime is online.");
        });

        socket.on("connect_error", (error) => {
          if (!mounted) {
            return;
          }
          setMode("error");
          setDetails(error.message || "Realtime connection failed");
        });
      } catch (error) {
        if (!mounted) {
          return;
        }
        setMode("error");
        setDetails(error instanceof Error ? error.message : "Widget bootstrap failed");
        socket.disconnect();
      }
    }

    boot();
    heartbeatTimer = window.setInterval(async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/health`);
        if (!response.ok && mounted) {
          setMode("error");
          setDetails("Health check failed. Verify API and socket connectivity.");
        }
      } catch (_error) {
        if (mounted) {
          setMode("error");
          setDetails("Health check failed. Verify API and socket connectivity.");
        }
      }
    }, 30000);

    return () => {
      mounted = false;
      socket.disconnect();
      if (heartbeatTimer) {
        window.clearInterval(heartbeatTimer);
      }
    };
  }, [context.tenantId, context.tenantSlug]);

  return (
    <main className={`widget-shell ${context.embedded ? "embedded" : "standalone"}`}>
      <section className="widget-card">
        <p className="eyebrow">SwyftUp Widget</p>
        <h1>Customer communication is ready</h1>
        <p className="muted">Live chat and voice routing can run from this embedded runtime.</p>

        <div className="pill-row">
          <span className={`pill ${mode}`}>{mode}</span>
          <code>{context.environment}</code>
        </div>

        <div className="meta-grid">
          <div className="meta-block">
            <p className="meta-label">API</p>
            <p className="meta-value">{apiBaseUrl}</p>
          </div>
          <div className="meta-block">
            <p className="meta-label">Websocket</p>
            <p className="meta-value">{wsBaseUrl}</p>
          </div>
          <div className="meta-block">
            <p className="meta-label">Workspace</p>
            <p className="meta-value">{context.tenantId || context.tenantSlug || "default"}</p>
          </div>
          <div className="meta-block">
            <p className="meta-label">Launcher</p>
            <p className="meta-value">{context.launcher}</p>
          </div>
          <div className="meta-block">
            <p className="meta-label">Position</p>
            <p className="meta-value">{context.position}</p>
          </div>
        </div>

        <p className="details">{details}</p>
      </section>
    </main>
  );
}

export default App;
