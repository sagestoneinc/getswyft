import { useState } from "react";
import { useParams, Link } from "react-router";
import {
  ArrowLeft, Phone, MoreVertical, Send, Paperclip, User, Home,
  Clock, Globe, StickyNote, UserPlus, ArrowRightLeft, XCircle,
  RotateCcw, PhoneCall, PhoneOff, Mic, MicOff
} from "lucide-react";
import { conversations } from "./mock-data";

export function ConversationPage() {
  const { id } = useParams();
  const conv = conversations.find((c) => c.id === id);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(conv?.messages || []);
  const [showActions, setShowActions] = useState(false);
  const [status, setStatus] = useState(conv?.status || "unassigned");
  const [assigned, setAssigned] = useState(conv?.assignedTo || "");
  const [callState, setCallState] = useState<"idle" | "ringing" | "connected">("idle");
  const [muted, setMuted] = useState(false);

  if (!conv) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-primary mb-2" style={{ fontWeight: 600 }}>Conversation not found</h2>
          <Link to="/app/inbox" className="text-accent hover:underline text-sm">Back to Inbox</Link>
        </div>
      </div>
    );
  }

  const handleSend = () => {
    if (!message.trim()) return;
    setMessages([
      ...messages,
      { id: `new-${Date.now()}`, sender: "agent", text: message, time: "Just now", read: false },
    ]);
    setMessage("");
  };

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="bg-white border-b border-border px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <Link to="/app/inbox" className="lg:hidden">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div className="w-9 h-9 bg-accent/10 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-primary truncate" style={{ fontWeight: 600 }}>{conv.lead.name}</p>
            <p className="text-xs text-muted-foreground truncate">{conv.listing.address}</p>
          </div>
          <div className="flex items-center gap-2">
            {conv.afterHours && (
              <span className="text-[10px] bg-warning/10 text-warning px-2 py-1 rounded" style={{ fontWeight: 600 }}>
                <Clock className="w-3 h-3 inline mr-1" />After Hours
              </span>
            )}
            <button
              onClick={() => {
                if (callState === "idle") setCallState("ringing");
                else if (callState === "ringing") setCallState("connected");
                else setCallState("idle");
              }}
              className={`p-2 rounded-lg transition-colors ${callState !== "idle" ? "bg-green-500 text-white" : "hover:bg-muted text-muted-foreground"}`}
            >
              <Phone className="w-4 h-4" />
            </button>
            <div className="relative">
              <button onClick={() => setShowActions(!showActions)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground">
                <MoreVertical className="w-4 h-4" />
              </button>
              {showActions && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-border py-1 w-48 z-10">
                  <button
                    onClick={() => { setAssigned("Sarah Chen"); setStatus("mine"); setShowActions(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left hover:bg-muted"
                  >
                    <UserPlus className="w-4 h-4" /> Assign to me
                  </button>
                  <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left hover:bg-muted" onClick={() => setShowActions(false)}>
                    <ArrowRightLeft className="w-4 h-4" /> Transfer
                  </button>
                  <button
                    onClick={() => { setStatus("closed"); setShowActions(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left hover:bg-muted text-destructive"
                  >
                    <XCircle className="w-4 h-4" /> Close
                  </button>
                  {status === "closed" && (
                    <button
                      onClick={() => { setStatus("mine"); setShowActions(false); }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left hover:bg-muted text-accent"
                    >
                      <RotateCcw className="w-4 h-4" /> Reopen
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Call UI */}
        {callState !== "idle" && (
          <div className="bg-primary text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PhoneCall className="w-5 h-5 text-accent animate-pulse" />
              <div>
                <p className="text-sm" style={{ fontWeight: 600 }}>
                  {callState === "ringing" ? "Calling..." : "Connected"} - {conv.lead.name}
                </p>
                <p className="text-xs text-white/60">{callState === "connected" ? "00:42" : "Ringing..."}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMuted(!muted)}
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

        {/* Status badges */}
        {(status === "closed" || assigned) && (
          <div className="px-4 py-2 bg-muted/50 flex items-center gap-2 text-xs flex-shrink-0">
            {status === "closed" && (
              <span className="bg-muted text-muted-foreground px-2 py-1 rounded" style={{ fontWeight: 500 }}>Closed</span>
            )}
            {assigned && (
              <span className="bg-accent/10 text-accent px-2 py-1 rounded" style={{ fontWeight: 500 }}>Assigned to {assigned}</span>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2 ${msg.sender === "agent" ? "justify-end" : ""}`}>
              {msg.sender === "visitor" && (
                <div className="w-7 h-7 rounded-full bg-muted flex-shrink-0 flex items-center justify-center">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <div className={`max-w-[70%] ${msg.sender === "agent" ? "order-first" : ""}`}>
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm ${
                    msg.sender === "agent"
                      ? "bg-accent text-white rounded-tr-sm"
                      : "bg-white border border-border text-foreground rounded-tl-sm"
                  }`}
                >
                  {msg.text}
                </div>
                <p className={`text-[10px] text-muted-foreground mt-1 ${msg.sender === "agent" ? "text-right" : ""}`}>
                  {msg.time} {msg.sender === "agent" && msg.read && "· Read"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Composer */}
        <div className="bg-white border-t border-border p-3 flex-shrink-0">
          <div className="flex items-end gap-2">
            <button className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg">
              <Paperclip className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message..."
                className="w-full resize-none bg-muted/50 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                rows={1}
              />
            </div>
            <button onClick={handleSend} className="p-2.5 bg-accent text-white rounded-lg hover:bg-accent/90">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Context Panel */}
      <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-border overflow-auto flex-shrink-0">
        <div className="p-4 space-y-5">
          {/* Lead Details */}
          <div>
            <h3 className="text-sm text-primary mb-3 flex items-center gap-2" style={{ fontWeight: 600 }}>
              <User className="w-4 h-4" /> Lead Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="text-primary" style={{ fontWeight: 500 }}>{conv.lead.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="text-primary text-xs" style={{ fontWeight: 500 }}>{conv.lead.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span className="text-primary" style={{ fontWeight: 500 }}>{conv.lead.phone}</span>
              </div>
            </div>
          </div>

          <hr className="border-border" />

          {/* Listing Card */}
          <div>
            <h3 className="text-sm text-primary mb-3 flex items-center gap-2" style={{ fontWeight: 600 }}>
              <Home className="w-4 h-4" /> Listing
            </h3>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm text-primary" style={{ fontWeight: 600 }}>{conv.listing.address}</p>
              <p className="text-lg text-accent" style={{ fontWeight: 700 }}>{conv.listing.price}</p>
              <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                <span>{conv.listing.beds} beds</span>
                <span>{conv.listing.baths} baths</span>
                <span>{conv.listing.sqft.toLocaleString()} sqft</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">{conv.listing.mls}</p>
            </div>
          </div>

          <hr className="border-border" />

          {/* Source */}
          <div>
            <h3 className="text-sm text-primary mb-3 flex items-center gap-2" style={{ fontWeight: 600 }}>
              <Globe className="w-4 h-4" /> Source
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Channel</span>
                <span className="text-primary" style={{ fontWeight: 500 }}>{conv.lead.source}</span>
              </div>
              {conv.lead.utm && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">UTM</span>
                  <span className="text-primary text-xs" style={{ fontWeight: 500 }}>{conv.lead.utm}</span>
                </div>
              )}
            </div>
          </div>

          <hr className="border-border" />

          {/* Notes */}
          <div>
            <h3 className="text-sm text-primary mb-3 flex items-center gap-2" style={{ fontWeight: 600 }}>
              <StickyNote className="w-4 h-4" /> Notes
            </h3>
            <textarea
              defaultValue={conv.notes}
              placeholder="Add notes about this lead..."
              className="w-full resize-none bg-muted/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
