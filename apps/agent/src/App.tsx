import { useEffect, useState } from "react";
import LoginPage from "./LoginPage";
import ConversationList from "./ConversationList";
import ChatView from "./ChatView";
import { fetchConversations, type Conversation } from "./api";
import { connectSocket, disconnectSocket } from "./socket";
import "./App.css";

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const sock = connectSocket(token);
    fetchConversations(token).then(setConversations);

    const handleEvent = (evt: { type: string }) => {
      if (evt.type === "conversation.created" || evt.type === "message.created") {
        fetchConversations(token).then(setConversations);
      }
    };
    sock.on("event", handleEvent);

    return () => {
      sock.off("event", handleEvent);
      disconnectSocket();
    };
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
