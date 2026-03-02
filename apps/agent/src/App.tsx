import { useEffect, useRef, useState } from "react";
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!token) return;
    const sock = connectSocket(token);
    fetchConversations(token).then(setConversations);

    const handleEvent = (evt: { type: string }) => {
      if (evt.type === "conversation.created" || evt.type === "message.created") {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          fetchConversations(token).then(setConversations);
        }, 500);
      }
    };
    sock.on("event", handleEvent);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
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
