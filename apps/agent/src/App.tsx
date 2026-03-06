import { useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";
import "./App.css";

type HealthResponse = {
  ok: boolean;
  uptimeSeconds: number;
  timestamp: string;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL || apiBaseUrl;
const socketToken = import.meta.env.VITE_SOCKET_TOKEN as string | undefined;

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [socketState, setSocketState] = useState("disconnected");

  const socketAuth = useMemo(() => {
    if (socketToken) {
      return {
        token: socketToken,
        tenantSlug: "default",
      };
    }

    return {
      devUserId: "agent-local",
      devEmail: "agent@getswyft.local",
      tenantSlug: "default",
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadHealth() {
      try {
        const response = await fetch(`${apiBaseUrl}/health`);
        if (!response.ok) {
          throw new Error(`Health check failed with ${response.status}`);
        }

        const data = (await response.json()) as HealthResponse;
        if (mounted) {
          setHealth(data);
          setHealthError(null);
        }
      } catch (error) {
        if (mounted) {
          setHealthError(error instanceof Error ? error.message : "Health check failed");
        }
      }
    }

    loadHealth();

    const socket: Socket = io(wsBaseUrl, {
      transports: ["websocket"],
      auth: socketAuth,
    });

    socket.on("connect", () => setSocketState("connected"));
    socket.on("disconnect", () => setSocketState("disconnected"));
    socket.on("connect_error", () => setSocketState("error"));

    return () => {
      mounted = false;
      socket.disconnect();
    };
  }, [socketAuth]);

  return (
    <main className="shell">
      <section className="card">
        <h1>Getswyft Agent Console (Phase 1)</h1>
        <p className="muted">Production shell is now wired for API + realtime readiness.</p>

        <div className="row">
          <span>API base URL</span>
          <code>{apiBaseUrl}</code>
        </div>
        <div className="row">
          <span>Realtime URL</span>
          <code>{wsBaseUrl}</code>
        </div>

        <div className="status-grid">
          <div>
            <p className="label">Health</p>
            <p>{health ? `ok (uptime ${health.uptimeSeconds}s)` : healthError || "loading..."}</p>
          </div>
          <div>
            <p className="label">Socket</p>
            <p>{socketState}</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
