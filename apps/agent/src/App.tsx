import { useEffect, useRef, useState } from "react";
import LoginPage from "./LoginPage";
import ConversationList from "./ConversationList";
import ChatView from "./ChatView";
import RoutingSettingsPage from "./RoutingSettingsPage";
import { fetchConversations, assignConversation, closeConversation, reopenConversation, type Conversation } from "./api";
import { connectSocket, disconnectSocket } from "./socket";
import "./App.css";

type Tab = "unassigned" | "mine" | "closed";
type Page = "inbox" | "settings";

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("mine");
  const [page, setPage] = useState<Page>("inbox");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function loadConversations() {
    if (!token) return;
    const params: { status?: string; assigned?: string } = {};
    if (tab === "mine") { params.assigned = "me"; params.status = "open"; }
    if (tab === "unassigned") { params.assigned = "unassigned"; params.status = "open"; }
    if (tab === "closed") { params.status = "closed"; }
    fetchConversations(token, params).then(setConversations);
  }

  useEffect(() => {
    if (!token) return;
    const sock = connectSocket(token);
    loadConversations();

    const handleEvent = (evt: { type: string }) => {
      if (evt.type === "conversation.created" || evt.type === "message.created" || evt.type === "conversation.assigned") {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          loadConversations();
        }, 500);
      }
    };
    sock.on("event", handleEvent);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      sock.off("event", handleEvent);
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function handleLogin(jwt: string, id: string) {
    setToken(jwt);
    setAgentId(id);
  }

  async function handleAssignToMe(conversationId: string) {
    if (!token || !agentId) return;
    await assignConversation(token, conversationId, agentId);
    loadConversations();
  }

  async function handleClose(conversationId: string) {
    if (!token) return;
    await closeConversation(token, conversationId);
    loadConversations();
  }

  async function handleReopen(conversationId: string) {
    if (!token) return;
    await reopenConversation(token, conversationId);
    loadConversations();
  }

  if (!token) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (page === "settings") {
    return (
      <div className="agent-shell">
        <aside className="conversation-list">
          <h2>Settings</h2>
          <button className="nav-btn" onClick={() => setPage("inbox")}>← Back to Inbox</button>
        </aside>
        <RoutingSettingsPage token={token} />
      </div>
    );
  }

  return (
    <div className="agent-shell">
      <ConversationList
        conversations={conversations}
        activeId={activeConvId}
        onSelect={setActiveConvId}
        tab={tab}
        onTabChange={setTab}
        onAssignToMe={handleAssignToMe}
        agentId={agentId}
      />
      <div className="main-area">
        <div className="top-bar">
          <button className="nav-btn" onClick={() => setPage("settings")}>⚙ Routing Settings</button>
        </div>
        {activeConvId ? (
          <ChatView
            conversationId={activeConvId}
            token={token}
            agentId={agentId}
            tab={tab}
            onAssignToMe={handleAssignToMe}
            onClose={handleClose}
            onReopen={handleReopen}
          />
        ) : (
          <div className="empty-state">Select a conversation</div>
        )}
      </div>
    </div>
  );
}

export default App;
