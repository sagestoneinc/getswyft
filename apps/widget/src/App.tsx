import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useChat } from "./useChat";
import "./App.css";

type WidgetMode = "setup" | "connecting" | "ready" | "error";

function getRuntimeContext() {
  const params = new URLSearchParams(window.location.search);

  return {
    tenantId: params.get("tenantId")?.trim() || params.get("workspaceId")?.trim() || "",
    tenantSlug: params.get("tenantSlug")?.trim() || "",
    environment: params.get("env")?.trim() || "production",
    launcher: params.get("launcher")?.trim() || "bubble",
    position: params.get("position")?.trim() || "right",
    embedded: window.self !== window.top,
    listingAddress: params.get("listingAddress")?.trim() || "",
    listingPrice: params.get("listingPrice")?.trim() || "",
    listingBeds: params.get("listingBeds")?.trim() || "",
    listingBaths: params.get("listingBaths")?.trim() || "",
    listingSqft: params.get("listingSqft")?.trim() || "",
    listingMls: params.get("listingMls")?.trim() || "",
  };
}

function App() {
  const context = useMemo(() => getRuntimeContext(), []);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [draft, setDraft] = useState("");
  const [submittedLead, setSubmittedLead] = useState<Record<string, unknown> | null>(null);

  const listing = useMemo(
    () => ({
      address: context.listingAddress || "Website inquiry",
      price: context.listingPrice || "Undisclosed",
      beds: context.listingBeds || null,
      baths: context.listingBaths || null,
      sqft: context.listingSqft || null,
      mls: context.listingMls || null,
      url: window.location.href,
    }),
    [context],
  );

  const { messages, connected, error, afterHours, send } = useChat({
    tenantId: context.tenantId || undefined,
    tenantSlug: context.tenantSlug || undefined,
    lead: submittedLead || {},
    listing,
    enabled: Boolean(submittedLead),
  });

  const mode: WidgetMode = !submittedLead
    ? "setup"
    : error
      ? "error"
      : connected
        ? "ready"
        : "connecting";

  function handleStart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedLead({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    });
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const body = draft.trim();
    if (!body) {
      return;
    }

    setDraft("");
    await send(body);
  }

  return (
    <main className={`widget-shell ${context.embedded ? "embedded" : "standalone"}`}>
      <section className="widget-card">
        <div className="widget-header">
          <div>
            <p className="eyebrow">SwyftUp</p>
            <h1>{afterHours ? "Leave a message" : "Start the conversation"}</h1>
            <p className="muted">
              {afterHours
                ? "We are outside office hours right now, but your message will be routed to the right team."
                : "Chat with the right team, share context, and keep the thread moving."}
            </p>
          </div>
          <div className={`pill ${mode}`}>{mode}</div>
        </div>

        {!submittedLead ? (
          <form className="stack" onSubmit={handleStart}>
            <label className="field">
              <span>Name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Alex Morgan" required />
            </label>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="alex@company.com"
                required
              />
            </label>
            <label className="field">
              <span>Phone</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </label>
            <button className="primary-button" type="submit">
              Continue
            </button>
          </form>
        ) : (
          <>
            <div className="conversation-meta">
              <div className="meta-chip">
                <span className="meta-label">Workspace</span>
                <span className="meta-value">{context.tenantId || context.tenantSlug || "default"}</span>
              </div>
              <div className="meta-chip">
                <span className="meta-label">Status</span>
                <span className="meta-value">{connected ? "Connected" : "Connecting"}</span>
              </div>
            </div>

            <div className="messages">
              {messages.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-title">You are connected.</p>
                  <p className="empty-copy">
                    Send your first message and SwyftUp will keep the conversation organized for the team.
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <article key={message.id} className={`message ${message.sender}`}>
                    <p>{message.body}</p>
                    <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                  </article>
                ))
              )}
            </div>

            {error ? <p className="error-banner">{error}</p> : null}

            <form className="composer" onSubmit={(event) => void handleSend(event)}>
              <textarea
                rows={3}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={afterHours ? "Tell us what you need and we will follow up." : "Type your message..."}
              />
              <button className="primary-button" type="submit" disabled={!draft.trim()}>
                Send
              </button>
            </form>
          </>
        )}

        <div className="widget-footer">
          <span>{context.environment}</span>
          <span>{context.launcher}</span>
        </div>
      </section>
    </main>
  );
}

export default App;
