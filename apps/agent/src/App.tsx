import { useEffect, useState } from "react";
import LoginPage from "./LoginPage";
import ConversationList from "./ConversationList";
import ChatView from "./ChatView";
import { fetchConversations } from "./api";
import { connectSocket, disconnectSocket } from "./socket";
import "./App.css";

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
}

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    connectSocket(token);
    fetchConversations(token).then((data) =>
      setConversations(data.conversations),
    );
    return () => disconnectSocket();
  }, [token]);

  if (!token) {
    return <LoginPage onLogin={setToken} />;
  }

  return (
    <div className="agent-shell">
      <ConversationList
        conversations={conversations}
        activeId={activeConvId}
        onSelect={setActiveConvId}
      />
      {activeConvId ? (
        <ChatView conversationId={activeConvId} token={token} />
      ) : (
        <div className="empty-state">Select a conversation</div>
      )}
    </div>
  );
}

export default App;
