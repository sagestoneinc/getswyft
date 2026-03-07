import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router";
import {
  ArrowLeft,
  Phone,
  MoreVertical,
  Send,
  Paperclip,
  User,
  Home,
  Clock,
  Globe,
  StickyNote,
  UserPlus,
  ArrowRightLeft,
  XCircle,
  RotateCcw,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Loader2,
  AlertTriangle,
  SmilePlus,
  Save,
} from "lucide-react";
import {
  formatMessageTimestamp,
  getConversation,
  getConversationMessages,
  markConversationRead,
  sendConversationMessage,
  toggleMessageReaction,
  type ConversationMessage,
  type ConversationSummary,
  updateConversation,
} from "../../lib/conversations";

const quickReactions = ["👍", "❤️", "👀"];

export function ConversationPage() {
  const { id } = useParams();
  const [conversation, setConversation] = useState<ConversationSummary | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [showActions, setShowActions] = useState(false);
  const [callState, setCallState] = useState<"idle" | "ringing" | "connected">("idle");
  const [muted, setMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isUpdatingConversation, setIsUpdatingConversation] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");

  useEffect(() => {
    if (!id) {
      return;
    }

    let mounted = true;

    async function loadConversation() {
      setIsLoading(true);
      setError(null);

      try {
        const [conversationResponse, messagesResponse] = await Promise.all([
          getConversation(id),
          getConversationMessages(id),
        ]);

        if (!mounted) {
          return;
        }

        setConversation(conversationResponse.conversation);
        setNotesDraft(conversationResponse.conversation.notes || "");
        setMessages(messagesResponse.messages);

        await markConversationRead(id).catch(() => null);
        if (mounted) {
          setMessages((currentMessages) =>
            currentMessages.map((currentMessage) =>
              currentMessage.sender === "visitor"
                ? { ...currentMessage, readByCurrentUser: true }
                : currentMessage,
            ),
          );
        }
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load conversation");
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadConversation();

    return () => {
      mounted = false;
    };
  }, [id]);

  const status = useMemo(() => {
    if (!conversation) {
      return "unassigned";
    }

    return conversation.status;
  }, [conversation]);

  async function refreshConversationState() {
    if (!id) {
      return;
    }

    const response = await getConversation(id);
    setConversation(response.conversation);
    setNotesDraft(response.conversation.notes || "");
  }

  async function handleConversationUpdate(payload: Parameters<typeof updateConversation>[1]) {
    if (!id) {
      return;
    }

    setIsUpdatingConversation(true);
    try {
      const response = await updateConversation(id, payload);
      setConversation(response.conversation);
      setNotesDraft(response.conversation.notes || "");
      setShowActions(false);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update conversation");
    } finally {
      setIsUpdatingConversation(false);
    }
  }

  async function handleSend() {
    if (!id || !message.trim()) {
      return;
    }

    setIsSending(true);

    try {
      const response = await sendConversationMessage(id, {
        body: message.trim(),
      });

      setMessages((currentMessages) => [...currentMessages, response.message]);
      setMessage("");
      await refreshConversationState();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Failed to send message");
    } finally {
      setIsSending(false);
    }
  }

  async function handleReaction(messageId: string, emoji: string) {
    try {
      const response = await toggleMessageReaction(messageId, emoji);
      setMessages((currentMessages) =>
        currentMessages.map((currentMessage) =>
          currentMessage.id === messageId ? response.message : currentMessage,
        ),
      );
    } catch (reactionError) {
      setError(reactionError instanceof Error ? reactionError.message : "Failed to update reaction");
    }
  }

  async function handleSaveNotes() {
    if (!id || !conversation) {
      return;
    }

    setIsSavingNotes(true);
    try {
      const response = await updateConversation(id, {
        notes: notesDraft,
      });
      setConversation(response.conversation);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save notes");
    } finally {
      setIsSavingNotes(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto mb-4" />
          <h2 className="text-primary mb-2" style={{ fontWeight: 600 }}>
            Loading conversation
          </h2>
          <p className="text-sm text-muted-foreground">Pulling real message history from the tenant API.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full px-4">
        <div className="text-center bg-white border border-border rounded-xl p-6 max-w-md">
          <AlertTriangle className="w-10 h-10 text-warning mx-auto mb-4" />
          <h2 className="text-primary mb-2" style={{ fontWeight: 600 }}>
            Conversation unavailable
          </h2>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Link to="/app/inbox" className="text-accent hover:underline text-sm">
            Back to Inbox
          </Link>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-primary mb-2" style={{ fontWeight: 600 }}>
            Conversation not found
          </h2>
          <Link to="/app/inbox" className="text-accent hover:underline text-sm">
            Back to Inbox
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white border-b border-border px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <Link to="/app/inbox" className="lg:hidden">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div className="w-9 h-9 bg-accent/10 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-primary truncate" style={{ fontWeight: 600 }}>
              {conversation.lead.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">{conversation.listing.address}</p>
          </div>
          <div className="flex items-center gap-2">
            {conversation.afterHours && (
              <span className="text-[10px] bg-warning/10 text-warning px-2 py-1 rounded" style={{ fontWeight: 600 }}>
                <Clock className="w-3 h-3 inline mr-1" />
                After Hours
              </span>
            )}
            <button
              onClick={() => {
                if (callState === "idle") {
                  setCallState("ringing");
                } else if (callState === "ringing") {
                  setCallState("connected");
                } else {
                  setCallState("idle");
                }
              }}
              className={`p-2 rounded-lg transition-colors ${
                callState !== "idle" ? "bg-green-500 text-white" : "hover:bg-muted text-muted-foreground"
              }`}
            >
              <Phone className="w-4 h-4" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowActions((currentValue) => !currentValue)}
                className="p-2 hover:bg-muted rounded-lg text-muted-foreground"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showActions && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-border py-1 w-52 z-10">
                  <button
                    onClick={() => handleConversationUpdate({ assignToMe: true })}
                    disabled={isUpdatingConversation}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left hover:bg-muted disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" /> Assign to me
                  </button>
                  <button
                    type="button"
                    disabled
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left text-muted-foreground/60 cursor-not-allowed"
                  >
                    <ArrowRightLeft className="w-4 h-4" /> Transfer (next slice)
                  </button>
                  <button
                    onClick={() => handleConversationUpdate({ status: "closed" })}
                    disabled={isUpdatingConversation}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left hover:bg-muted text-destructive disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> Close
                  </button>
                  {status === "closed" && (
                    <button
                      onClick={() => handleConversationUpdate({ status: "open" })}
                      disabled={isUpdatingConversation}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left hover:bg-muted text-accent disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" /> Reopen
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {callState !== "idle" && (
          <div className="bg-primary text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PhoneCall className="w-5 h-5 text-accent animate-pulse" />
              <div>
                <p className="text-sm" style={{ fontWeight: 600 }}>
                  {callState === "ringing" ? "Calling..." : "Connected"} - {conversation.lead.name}
                </p>
                <p className="text-xs text-white/60">{callState === "connected" ? "00:42" : "Ringing..."}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMuted((currentValue) => !currentValue)}
                className={`p-2 rounded-lg ${muted ? "bg-white/20" : "hover:bg-white/10"}`}
              >
                {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button onClick={() => setCallState("idle")} className="p-2 bg-destructive rounded-lg hover:bg-destructive/90">
                <PhoneOff className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {(status === "closed" || conversation.assignedTo) && (
          <div className="px-4 py-2 bg-muted/50 flex items-center gap-2 text-xs flex-shrink-0">
            {status === "closed" && (
              <span className="bg-muted text-muted-foreground px-2 py-1 rounded" style={{ fontWeight: 500 }}>
                Closed
              </span>
            )}
            {conversation.assignedTo && (
              <span className="bg-accent/10 text-accent px-2 py-1 rounded" style={{ fontWeight: 500 }}>
                Assigned to {conversation.assignedTo}
              </span>
            )}
          </div>
        )}

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {messages.map((currentMessage) => (
            <div key={currentMessage.id} className={`flex gap-2 ${currentMessage.sender === "agent" ? "justify-end" : ""}`}>
              {currentMessage.sender === "visitor" && (
                <div className="w-7 h-7 rounded-full bg-muted flex-shrink-0 flex items-center justify-center">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <div className={`max-w-[75%] ${currentMessage.sender === "agent" ? "order-first" : ""}`}>
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm ${
                    currentMessage.sender === "agent"
                      ? "bg-accent text-white rounded-tr-sm"
                      : currentMessage.sender === "system"
                        ? "bg-primary/10 text-primary border border-primary/10"
                        : "bg-white border border-border text-foreground rounded-tl-sm"
                  }`}
                >
                  {currentMessage.body}
                </div>
                <div className={`mt-1 flex flex-wrap gap-1 ${currentMessage.sender === "agent" ? "justify-end" : ""}`}>
                  {currentMessage.reactions.map((reaction) => (
                    <button
                      key={`${currentMessage.id}-${reaction.emoji}`}
                      onClick={() => handleReaction(currentMessage.id, reaction.emoji)}
                      className={`text-[11px] px-2 py-0.5 rounded-full border ${
                        reaction.reacted
                          ? "bg-accent/10 border-accent/30 text-accent"
                          : "bg-white border-border text-muted-foreground"
                      }`}
                    >
                      {reaction.emoji} {reaction.count}
                    </button>
                  ))}
                </div>
                <div
                  className={`text-[10px] text-muted-foreground mt-1 flex items-center gap-2 ${
                    currentMessage.sender === "agent" ? "justify-end" : ""
                  }`}
                >
                  <span>{formatMessageTimestamp(currentMessage.createdAt)}</span>
                  {currentMessage.sender === "visitor" && currentMessage.readByCurrentUser && <span>Seen</span>}
                  <span className="inline-flex items-center gap-1">
                    <SmilePlus className="w-3 h-3" />
                    {quickReactions.map((emoji) => (
                      <button
                        key={`${currentMessage.id}-${emoji}-quick`}
                        onClick={() => handleReaction(currentMessage.id, emoji)}
                        className="hover:text-primary"
                      >
                        {emoji}
                      </button>
                    ))}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border-t border-border p-3 flex-shrink-0">
          <div className="flex items-end gap-2">
            <button
              type="button"
              disabled
              className="p-2 text-muted-foreground/50 rounded-lg cursor-not-allowed"
              title="Attachment uploads are the next slice after persistent messaging."
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Type a message..."
                className="w-full resize-none bg-muted/50 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                rows={1}
              />
            </div>
            <button
              onClick={() => void handleSend()}
              disabled={isSending || !message.trim()}
              className="p-2.5 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-60"
            >
              {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-border overflow-auto flex-shrink-0">
        <div className="p-4 space-y-5">
          <div>
            <h3 className="text-sm text-primary mb-3 flex items-center gap-2" style={{ fontWeight: 600 }}>
              <User className="w-4 h-4" /> Lead Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Name</span>
                <span className="text-primary text-right" style={{ fontWeight: 500 }}>
                  {conversation.lead.name}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Email</span>
                <span className="text-primary text-xs text-right" style={{ fontWeight: 500 }}>
                  {conversation.lead.email || "Not provided"}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Phone</span>
                <span className="text-primary text-right" style={{ fontWeight: 500 }}>
                  {conversation.lead.phone || "Not provided"}
                </span>
              </div>
            </div>
          </div>

          <hr className="border-border" />

          <div>
            <h3 className="text-sm text-primary mb-3 flex items-center gap-2" style={{ fontWeight: 600 }}>
              <Home className="w-4 h-4" /> Listing
            </h3>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm text-primary" style={{ fontWeight: 600 }}>
                {conversation.listing.address}
              </p>
              <p className="text-lg text-accent" style={{ fontWeight: 700 }}>
                {conversation.listing.price}
              </p>
              <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                <span>{conversation.listing.beds ?? "-"} beds</span>
                <span>{conversation.listing.baths ?? "-"} baths</span>
                <span>{conversation.listing.sqft?.toLocaleString() || "-"} sqft</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">{conversation.listing.mls || "MLS unavailable"}</p>
            </div>
          </div>

          <hr className="border-border" />

          <div>
            <h3 className="text-sm text-primary mb-3 flex items-center gap-2" style={{ fontWeight: 600 }}>
              <Globe className="w-4 h-4" /> Source
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Channel</span>
                <span className="text-primary text-right" style={{ fontWeight: 500 }}>
                  {conversation.lead.source || "Unknown"}
                </span>
              </div>
              {conversation.lead.utm && (
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">UTM</span>
                  <span className="text-primary text-xs text-right" style={{ fontWeight: 500 }}>
                    {conversation.lead.utm}
                  </span>
                </div>
              )}
            </div>
          </div>

          <hr className="border-border" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm text-primary flex items-center gap-2" style={{ fontWeight: 600 }}>
                <StickyNote className="w-4 h-4" /> Notes
              </h3>
              <button
                onClick={() => void handleSaveNotes()}
                disabled={isSavingNotes}
                className="inline-flex items-center gap-1 text-xs text-accent disabled:opacity-60"
                style={{ fontWeight: 600 }}
              >
                {isSavingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save
              </button>
            </div>
            <textarea
              value={notesDraft}
              onChange={(event) => setNotesDraft(event.target.value)}
              placeholder="Add notes about this lead..."
              className="w-full resize-none bg-muted/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              rows={4}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
