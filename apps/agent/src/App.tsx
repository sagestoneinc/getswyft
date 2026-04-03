import { useCallback, useEffect, useEffectEvent, useMemo, useState } from "react";
import type { Socket } from "socket.io-client";
import "./App.css";
import {
  assignConversationToMe,
  closeConversation,
  fetchAuthContext,
  fetchConversations,
  fetchMemberships,
  fetchMessages,
  formatSocketMessage,
  markConversationRead,
  postMessage,
  reopenConversation,
  type AuthMembership,
  type AuthContext,
  type ConversationMessage,
  type ConversationSummary,
  type ConversationTab,
  type RealtimeConversationMessage,
} from "./api";
import ConversationList from "./ConversationList";
import ChatView from "./ChatView";
import LoginPage from "./LoginPage";
import RoutingSettingsPage from "./RoutingSettingsPage";
import { useAgentAuth } from "./auth";
import { apiClient } from "./api-client";
import { connectSocket, disconnectSocket, getSocket } from "./socket";

type WorkspaceView = "inbox" | "routing";

const TENANT_STORAGE_KEY = "getswyft.agent.activeTenantSlug";

function readStoredTenantSlug() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TENANT_STORAGE_KEY);
}

function persistTenantSlug(tenantSlug: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!tenantSlug) {
    window.localStorage.removeItem(TENANT_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(TENANT_STORAGE_KEY, tenantSlug);
}

function upsertMessage(messages: ConversationMessage[], nextMessage: ConversationMessage) {
  if (messages.some((message) => message.id === nextMessage.id)) {
    return messages;
  }

  return [...messages, nextMessage];
}

function resolveTenantSlug(memberships: AuthMembership[], currentTenantSlug: string | null) {
  const storedTenantSlug = readStoredTenantSlug();
  const hasCurrentTenant = currentTenantSlug
    ? memberships.some((membership) => membership.tenantSlug === currentTenantSlug)
    : false;
  const hasStoredTenant = storedTenantSlug
    ? memberships.some((membership) => membership.tenantSlug === storedTenantSlug)
    : false;

  if (hasCurrentTenant) {
    return currentTenantSlug;
  }

  if (hasStoredTenant) {
    return storedTenantSlug;
  }

  return memberships[0]?.tenantSlug || null;
}

function App() {
  const auth = useAgentAuth();
  const [view, setView] = useState<WorkspaceView>("inbox");
  const [memberships, setMemberships] = useState<AuthMembership[]>([]);
  const [activeTenantSlug, setActiveTenantSlug] = useState<string | null>(readStoredTenantSlug());
  const [authContext, setAuthContext] = useState<AuthContext | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [tab, setTab] = useState<ConversationTab>("unassigned");
  const [counts, setCounts] = useState<Record<ConversationTab, number>>({
    unassigned: 0,
    mine: 0,
    closed: 0,
  });
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [socketStatus, setSocketStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected");
  const [socketError, setSocketError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.setTenantSlugProvider(() => activeTenantSlug);
  }, [activeTenantSlug]);

  useEffect(() => {
    if (auth.isLoading) {
      return;
    }

    if (!auth.isAuthenticated) {
      setMemberships([]);
      setActiveTenantSlug(null);
      setAuthContext(null);
      setConversations([]);
      setActiveConversationId(null);
      setMessages([]);
      setWorkspaceError(null);
      setSocketError(null);
      persistTenantSlug(null);
      disconnectSocket();
      return;
    }

    let cancelled = false;

    async function loadMemberships() {
      try {
        const response = await fetchMemberships();
        if (cancelled) {
          return;
        }

        const nextMemberships = response.memberships || [];
        const nextTenantSlug = resolveTenantSlug(nextMemberships, activeTenantSlug);
        setMemberships(nextMemberships);
        setWorkspaceError(null);

        if (nextTenantSlug !== activeTenantSlug) {
          setActiveTenantSlug(nextTenantSlug);
          persistTenantSlug(nextTenantSlug);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setWorkspaceError(error instanceof Error ? error.message : "Failed to load tenant memberships");
      }
    }

    void loadMemberships();

    return () => {
      cancelled = true;
    };
  }, [activeTenantSlug, auth.isAuthenticated, auth.isLoading]);

  const loadAuthContext = useCallback(async () => {
    try {
      const response = await fetchAuthContext();
      setAuthContext(response);
      setWorkspaceError(null);
    } catch (error) {
      setWorkspaceError(error instanceof Error ? error.message : "Failed to load workspace context");
    }
  }, []);

  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    setConversationError(null);

    try {
      const response = await fetchConversations(tab);
      setCounts(response.counts);
      setConversations(response.conversations);
      setActiveConversationId((currentId) => {
        if (currentId && response.conversations.some((conversation) => conversation.id === currentId)) {
          return currentId;
        }

        return response.conversations[0]?.id || null;
      });
    } catch (error) {
      setConversationError(error instanceof Error ? error.message : "Failed to load conversations");
      setConversations([]);
      setActiveConversationId(null);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [tab]);

  const loadMessages = useCallback(async (conversationId: string) => {
    setIsLoadingMessages(true);
    setConversationError(null);

    try {
      const response = await fetchMessages(conversationId);
      setMessages(response.messages);
      await markConversationRead(conversationId).catch(() => null);
    } catch (error) {
      setConversationError(error instanceof Error ? error.message : "Failed to load messages");
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (!auth.isAuthenticated || auth.isLoading || !activeTenantSlug) {
      return;
    }

    void loadAuthContext();
    void loadConversations();
  }, [activeTenantSlug, auth.isAuthenticated, auth.isLoading, loadAuthContext, loadConversations]);

  useEffect(() => {
    if (!auth.isAuthenticated || !activeConversationId) {
      setMessages([]);
      return;
    }

    void loadMessages(activeConversationId);
  }, [activeConversationId, auth.isAuthenticated, loadMessages]);

  const handleRealtimeMessage = useEffectEvent((message: RealtimeConversationMessage) => {
    const normalizedMessage = formatSocketMessage(message);

    if (message.conversationId === activeConversationId) {
      setMessages((currentMessages) => upsertMessage(currentMessages, normalizedMessage));
    }

    setConversations((currentConversations) =>
      currentConversations.map((conversation) => {
        if (conversation.id !== message.conversationId) {
          return conversation;
        }

        const unreadIncrement =
          normalizedMessage.senderType === "agent" || message.conversationId === activeConversationId ? 0 : 1;

        return {
          ...conversation,
          lastMessage: normalizedMessage.body,
          lastMessageAt: normalizedMessage.createdAt,
          unreadCount: conversation.unreadCount + unreadIncrement,
        };
      }),
    );
  });

  useEffect(() => {
    if (auth.isLoading || !auth.isAuthenticated || !activeTenantSlug) {
      return;
    }

    let mounted = true;
    let socket: Socket | null = null;

    async function connect() {
      try {
        setSocketStatus("connecting");
        setSocketError(null);

        const token = await auth.getAccessToken();
        if (!mounted) {
          return;
        }

        socket = connectSocket({
          token,
          tenantSlug: activeTenantSlug,
        });

        socket.on("connect", () => {
          setSocketStatus("connected");
          setSocketError(null);
        });
        socket.on("disconnect", () => {
          setSocketStatus("disconnected");
        });
        socket.on("connect_error", (error) => {
          setSocketStatus("error");
          setSocketError(error.message || "Socket connection failed");
        });
        socket.on("message:new", (message: RealtimeConversationMessage) => {
          handleRealtimeMessage(message);
        });
        socket.on("event", (event: { type?: string; conversationId?: string; payload?: unknown }) => {
          if (event.type === "message.created" && event.payload) {
            handleRealtimeMessage(event.payload as RealtimeConversationMessage);
          }

          if (event.type === "conversation.history" && event.conversationId === activeConversationId) {
            const payload = event.payload as { messages?: RealtimeConversationMessage[] };
            setMessages((payload.messages || []).map(formatSocketMessage));
          }
        });
      } catch (error) {
        if (!mounted) {
          return;
        }

        setSocketStatus("error");
        setSocketError(error instanceof Error ? error.message : "Socket connection failed");
      }
    }

    void connect();

    return () => {
      mounted = false;
      disconnectSocket();
    };
  }, [activeConversationId, activeTenantSlug, auth]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || socket.disconnected || !activeConversationId) {
      return;
    }

    let disposed = false;

    socket.emit("conversation:join", { conversationId: activeConversationId }, (payload: { ok?: boolean; history?: RealtimeConversationMessage[]; error?: string }) => {
      if (disposed) {
        return;
      }

      if (!payload?.ok) {
        setConversationError(payload?.error || "Failed to join conversation room");
        return;
      }

      setMessages((payload.history || []).map(formatSocketMessage));
      void markConversationRead(activeConversationId).catch(() => null);
    });

    return () => {
      disposed = true;
      socket.emit("conversation:leave", { conversationId: activeConversationId });
    };
  }, [activeConversationId, socketStatus]);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) || null,
    [activeConversationId, conversations],
  );

  const activeMembership = useMemo(
    () => memberships.find((membership) => membership.tenantSlug === activeTenantSlug) || null,
    [activeTenantSlug, memberships],
  );

  const currentUserName =
    authContext?.user.displayName || auth.user?.name || auth.user?.email || "Agent";
  const tenantName = activeMembership?.tenantName || authContext?.tenant.name || "Workspace";
  const canWrite = Boolean(authContext?.permissions.includes("conversation.write"));
  const canManageTenant = Boolean(authContext?.permissions.includes("tenant.manage"));

  async function handleTenantSwitch(nextTenantSlug: string) {
    if (!nextTenantSlug || nextTenantSlug === activeTenantSlug) {
      return;
    }

    persistTenantSlug(nextTenantSlug);
    setActiveTenantSlug(nextTenantSlug);
    setActiveConversationId(null);
    setMessages([]);
    setView("inbox");
  }

  async function handleSendMessage(body: string) {
    if (!activeConversationId) {
      return;
    }

    setIsSendingMessage(true);
    setConversationError(null);

    try {
      const response = await postMessage(activeConversationId, body);
      setMessages((currentMessages) => upsertMessage(currentMessages, response.message));
      await loadConversations();
    } catch (error) {
      setConversationError(error instanceof Error ? error.message : "Send message failed");
      throw error;
    } finally {
      setIsSendingMessage(false);
    }
  }

  async function handleAssignConversation(conversationId = activeConversationId) {
    if (!conversationId) {
      return;
    }

    setConversationError(null);

    try {
      await assignConversationToMe(conversationId);
      await loadConversations();
      if (conversationId === activeConversationId) {
        await loadMessages(conversationId);
      }
    } catch (error) {
      setConversationError(error instanceof Error ? error.message : "Failed to assign conversation");
    }
  }

  async function handleCloseConversation() {
    if (!activeConversationId) {
      return;
    }

    setConversationError(null);

    try {
      await closeConversation(activeConversationId);
      await loadConversations();
    } catch (error) {
      setConversationError(error instanceof Error ? error.message : "Failed to close conversation");
    }
  }

  async function handleReopenConversation() {
    if (!activeConversationId) {
      return;
    }

    setConversationError(null);

    try {
      await reopenConversation(activeConversationId);
      await loadConversations();
      await loadMessages(activeConversationId);
    } catch (error) {
      setConversationError(error instanceof Error ? error.message : "Failed to reopen conversation");
    }
  }

  if (auth.isLoading) {
    return (
      <main className="shell shell--centered">
        <section className="card">
          <p className="eyebrow">Getswyft Agent Console</p>
          <h1>Connecting your workspace...</h1>
          <p className="muted">Checking for an existing session and loading tenant access.</p>
        </section>
      </main>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <main className="shell shell--centered">
        <LoginPage
          provider={auth.provider}
          supportsPasswordAuth={auth.supportsPasswordAuth}
          isLoading={auth.isLoading}
          authError={auth.error}
          onLogin={auth.login}
        />
      </main>
    );
  }

  return (
    <main className="agent-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Getswyft Agent Console</p>
          <h1>{tenantName}</h1>
        </div>

        <div className="topbar-controls">
          <div className="select-wrap">
            <label htmlFor="tenant-select">Tenant</label>
            <select
              id="tenant-select"
              value={activeTenantSlug || ""}
              onChange={(event) => void handleTenantSwitch(event.target.value)}
            >
              {memberships.map((membership) => (
                <option key={membership.tenantId} value={membership.tenantSlug}>
                  {membership.tenantName}
                </option>
              ))}
            </select>
          </div>

          <div className="status-cluster">
            <span className={`status-badge status-badge--${socketStatus}`}>
              Socket: {socketStatus}
            </span>
            <span className="status-badge status-badge--muted">{currentUserName}</span>
          </div>

          <button className="ghost-button" onClick={() => void auth.logout()}>
            Sign out
          </button>
        </div>
      </header>

      {(workspaceError || socketError) && (
        <div className="banner banner-error">
          {workspaceError || socketError}
        </div>
      )}

      <nav className="workspace-nav">
        <button className={view === "inbox" ? "workspace-tab active" : "workspace-tab"} onClick={() => setView("inbox")}>
          Inbox
        </button>
        {canManageTenant && (
          <button className={view === "routing" ? "workspace-tab active" : "workspace-tab"} onClick={() => setView("routing")}>
            Routing
          </button>
        )}
      </nav>

      {view === "routing" ? (
        <section className="workspace-panel">
          <RoutingSettingsPage />
        </section>
      ) : (
        <section className="workspace-grid">
          <ConversationList
            conversations={conversations}
            counts={counts}
            activeId={activeConversationId}
            onSelect={setActiveConversationId}
            tab={tab}
            onTabChange={setTab}
            onAssignToMe={(conversationId) => void handleAssignConversation(conversationId)}
            canAssign={canWrite}
            isLoading={isLoadingConversations}
          />

          <ChatView
            key={activeConversationId || "empty"}
            conversation={activeConversation}
            messages={messages}
            isLoading={isLoadingMessages}
            isSending={isSendingMessage}
            error={conversationError}
            canWrite={canWrite}
            canManage={canWrite}
            onSendMessage={handleSendMessage}
            onAssignToMe={handleAssignConversation}
            onCloseConversation={handleCloseConversation}
            onReopenConversation={handleReopenConversation}
          />
        </section>
      )}
    </main>
  );
}

export default App;
