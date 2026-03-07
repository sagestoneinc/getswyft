import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
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
  Upload,
  Check,
} from "lucide-react";
import {
  formatMessageTimestamp,
  getConversation,
  getConversationMessages,
  markConversationRead,
  sendConversationMessage,
  startConversationCall,
  toggleMessageReaction,
  type ConversationMessage,
  type ConversationSummary,
  updateConversation,
} from "../../lib/conversations";
import { createUploadTarget } from "../../lib/storage";
import { getAssignableMembers, type TeamMember } from "../../lib/team";
import { useAuth } from "../../providers/auth-provider";

const quickReactions = ["👍", "❤️", "👀"];

type PendingAttachment = {
  storageKey: string;
  filename: string;
  contentType: string | null;
  sizeBytes: number | null;
};

export function ConversationPage() {
  const { id } = useParams();
  const { getAccessToken } = useAuth();
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
  const [assignableMembers, setAssignableMembers] = useState<TeamMember[]>([]);
  const [transferUserId, setTransferUserId] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
        setTransferUserId(conversationResponse.conversation.assignedUserId || "");
        setMessages(messagesResponse.messages);

        getAssignableMembers()
          .then((response) => {
            if (!mounted) {
              return;
            }

            setAssignableMembers(response.members);
          })
          .catch(() => null);

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
      setTransferUserId(response.conversation.assignedUserId || "");
      setShowActions(false);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update conversation");
    } finally {
      setIsUpdatingConversation(false);
    }
  }

  async function handleSend() {
    if (!id || (!message.trim() && pendingAttachments.length === 0)) {
      return;
    }

    setIsSending(true);

    try {
      const response = await sendConversationMessage(id, {
        body: message.trim() || "Shared attachments",
        attachments: pendingAttachments,
      });

      setMessages((currentMessages) => [...currentMessages, response.message]);
      setMessage("");
      setPendingAttachments([]);
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

  async function handleCallAction() {
    if (!id || !conversation) {
      return;
    }

    if (callState === "idle") {
      setError(null);

      try {
        await startConversationCall(id);
        setCallState("ringing");
      } catch (callError) {
        setError(callError instanceof Error ? callError.message : "Failed to start outbound call");
      }
      return;
    }

    if (callState === "ringing") {
      setCallState("connected");
      return;
    }

    setCallState("idle");
  }

  async function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }

    setIsUploadingAttachment(true);
    setError(null);

    try {
      const uploadedAttachments: PendingAttachment[] = [];

      for (const file of files.slice(0, 5)) {
        const presigned = await createUploadTarget({
          filename: file.name,
          contentType: file.type || "application/octet-stream",
        });
        const uploadUrl = presigned.uploadUrl.startsWith("/")
          ? `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}${presigned.uploadUrl}`
          : presigned.uploadUrl;
        const token = await getAccessToken();
        const uploadHeaders = new Headers({
          "Content-Type": file.type || "application/octet-stream",
        });

        if (token) {
          uploadHeaders.set("Authorization", `Bearer ${token}`);
        } else if ((import.meta.env.VITE_DEV_AUTH_BYPASS as string | undefined) !== "false") {
          uploadHeaders.set("x-dev-user-id", (import.meta.env.VITE_DEV_USER_ID as string | undefined) || "local-user");
          uploadHeaders.set("x-dev-user-email", (import.meta.env.VITE_DEV_USER_EMAIL as string | undefined) || "admin@getswyft.local");
          uploadHeaders.set("x-tenant-slug", (import.meta.env.VITE_DEV_TENANT_SLUG as string | undefined) || "default");
        }

        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          headers: uploadHeaders,
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        uploadedAttachments.push({
          storageKey: presigned.key,
          filename: file.name,
          contentType: file.type || null,
          sizeBytes: file.size,
        });
      }

      setPendingAttachments((currentAttachments) => [...currentAttachments, ...uploadedAttachments].slice(0, 5));
      event.target.value = "";
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload attachment");
    } finally {
      setIsUploadingAttachment(false);
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
              onClick={() => void handleCallAction()}
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
                  <div className="px-4 py-2 border-t border-border/60 mt-1">
                    <label className="text-[11px] uppercase tracking-wide text-muted-foreground" style={{ fontWeight: 600 }}>
                      Transfer to teammate
                    </label>
                    <div className="mt-2 flex items-center gap-2">
                      <select
                        value={transferUserId}
                        onChange={(event) => setTransferUserId(event.target.value)}
                        className="flex-1 px-2.5 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                      >
                        <option value="">Unassigned</option>
                        {assignableMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleConversationUpdate({ assignedUserId: transferUserId || null })}
                        disabled={isUpdatingConversation}
                        className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-primary disabled:opacity-50"
                        title="Transfer conversation"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
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
                {currentMessage.attachments.length > 0 && (
                  <div className={`mt-2 space-y-2 ${currentMessage.sender === "agent" ? "text-right" : ""}`}>
                    {currentMessage.attachments.map((attachment) => (
                      <div key={attachment.id} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-white text-xs text-primary">
                        <Paperclip className="w-3 h-3 text-accent" />
                        <span>{attachment.filename}</span>
                        {attachment.sizeBytes ? <span className="text-muted-foreground">({Math.round(attachment.sizeBytes / 1024)} KB)</span> : null}
                      </div>
                    ))}
                  </div>
                )}
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
          {pendingAttachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {pendingAttachments.map((attachment) => (
                <div key={attachment.storageKey} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-muted/40 text-xs text-primary">
                  <Check className="w-3 h-3 text-green-600" />
                  <span>{attachment.filename}</span>
                  <button
                    type="button"
                    onClick={() => setPendingAttachments((currentAttachments) => currentAttachments.filter((currentAttachment) => currentAttachment.storageKey !== attachment.storageKey))}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <XCircle className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAttachment}
              className="p-2 text-muted-foreground rounded-lg hover:bg-muted disabled:opacity-50"
              title="Upload attachment"
            >
              {isUploadingAttachment ? <Upload className="w-5 h-5 animate-pulse" /> : <Paperclip className="w-5 h-5" />}
            </button>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(event) => void handleFileSelection(event)} />
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
              disabled={isSending || (!message.trim() && pendingAttachments.length === 0)}
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
