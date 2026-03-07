import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL || apiBaseUrl;
const socketToken = import.meta.env.VITE_SOCKET_TOKEN as string | undefined;

type WidgetMode = "booting" | "ready" | "error";

function App() {
  const [mode, setMode] = useState<WidgetMode>("booting");
  const [details, setDetails] = useState<string>("Initializing widget runtime...");

  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        const response = await fetch(`${apiBaseUrl}/health`);
        if (!response.ok) {
          throw new Error(`API health failed (${response.status})`);
        }

        const socket = io(wsBaseUrl, {
          transports: ["websocket"],
          auth: socketToken
            ? { token: socketToken, tenantSlug: "default" }
            : {
                devUserId: "widget-local",
                devEmail: "widget@getswyft.local",
                tenantSlug: "default",
              },
        });

        socket.on("connect", () => {
          if (!mounted) {
            return;
          }
          setMode("ready");
          setDetails(`Connected to realtime with socket ${socket.id}`);
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
      }
    }

    boot();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="widget-shell">
      <section className="widget-card">
        <h1>Getswyft Widget Runtime</h1>
        <p className="muted">Embeddable runtime foundation with API and websocket bootstrapping.</p>

        <div className="pill-row">
          <span className={`pill ${mode}`}>{mode}</span>
          <code>{apiBaseUrl}</code>
        </div>

        <p className="details">{details}</p>
      </section>
    </main>
  );
}

export default App;
