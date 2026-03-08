import { useState } from "react";
import {
  X, Minus, Paperclip, Smile, Send, CheckCheck,
  RefreshCw, Sparkles, WifiOff
} from "lucide-react";
import { LogoMark, BrandLogo } from "../../brand/logo";
import type { WidgetState, ChatMessage } from "./widget-shared";

const chatMessages: ChatMessage[] = [
  { id: 1, sender: "agent", text: "Hey! Welcome to SwyftUp. What can I help you with today?", time: "10:23 AM" },
  { id: 2, sender: "customer", text: "I need help connecting our Zapier integration to the platform.", time: "10:25 AM" },
  { id: 3, sender: "agent", text: "Sure thing! Head over to Settings > Integrations and you'll see Zapier listed. Click 'Connect' and follow the OAuth flow.", time: "10:26 AM" },
  { id: 4, sender: "customer", text: "Got it — but it's asking for an API key. Where do I find that?", time: "10:28 AM" },
  { id: 5, sender: "agent", text: "Your API key is under Settings > Developer > API Keys. Copy the production key and paste it into the Zapier setup.", time: "10:30 AM" },
];

export function WidgetGradient() {
  const [state, setState] = useState<WidgetState>("collapsed");
  const [input, setInput] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });

  if (state === "collapsed") {
    return (
      <button
        onClick={() => setState("form")}
        className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[#4a6cf7] to-[#1fb6f6] flex items-center justify-center shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 transition-all relative"
      >
        <LogoMark className="w-9 h-9 brightness-0 invert" />
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-[10px] text-white flex items-center justify-center border-2 border-white" style={{ fontWeight: 700 }}>2</div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#4a6cf7] to-[#1fb6f6] animate-ping opacity-15" />
      </button>
    );
  }

  return (
    <div className="w-[380px] rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/15 flex flex-col border border-white/10" style={{ height: "530px" }}>
      {/* Header - Gradient */}
      <div className="px-4 py-3.5 bg-gradient-to-r from-[#2d1b69] via-[#3b2f8a] to-[#1a4a7a] text-white flex items-center justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)" }} />
        <div className="flex items-center gap-3 relative z-10">
          <BrandLogo size="sm" theme="dark" />
          <div className="w-px h-5 bg-white/20" />
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-sm shadow-emerald-400/50" />
            <span className="text-[10px] text-white/70">Online</span>
          </div>
        </div>
        <div className="flex items-center gap-0.5 relative z-10">
          <button onClick={() => setState("collapsed")} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/70">
            <Minus className="w-4 h-4" />
          </button>
          <button onClick={() => setState("collapsed")} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/70">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex flex-col bg-[#0e0e1c]">
        {state === "form" && (
          <div className="flex-1 p-5 flex flex-col">
            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] text-blue-400 tracking-wide" style={{ fontWeight: 600 }}>AI-POWERED SUPPORT</span>
              </div>
              <h3 className="text-[16px] text-white" style={{ fontWeight: 600 }}>Let's get you started</h3>
              <p className="text-[12px] text-gray-500 mt-1">Tell us a bit about yourself so we can help faster.</p>
            </div>
            <div className="space-y-3 flex-1">
              {[
                { key: "name", label: "Name", placeholder: "Your full name", type: "text" },
                { key: "email", label: "Email", placeholder: "you@company.com", type: "email" },
                { key: "phone", label: "Phone (optional)", placeholder: "+1 (555) 000-0000", type: "tel" },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-[11px] text-gray-500 mb-1 block" style={{ fontWeight: 500 }}>{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={formData[field.key as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition-all"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => setState("chat")}
              className="w-full py-2.5 bg-gradient-to-r from-[#4a6cf7] to-[#1fb6f6] text-white rounded-xl text-[13px] hover:shadow-lg hover:shadow-blue-500/25 transition-all mt-4" style={{ fontWeight: 600 }}
            >
              Start Conversation
            </button>
            <p className="text-[10px] text-gray-600 text-center mt-3">Protected by SwyftUp &bull; Privacy Policy</p>
          </div>
        )}

        {state === "chat" && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === "customer" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[280px]">
                    <div className={`px-3.5 py-2.5 text-[13px] leading-relaxed ${
                      msg.sender === "customer"
                        ? "bg-gradient-to-br from-[#4a6cf7] to-[#3588e8] text-white rounded-2xl rounded-br-sm shadow-sm shadow-blue-500/15"
                        : "bg-[#1a1a30] text-gray-200 border border-white/5 rounded-2xl rounded-bl-sm"
                    }`}>
                      {msg.text}
                    </div>
                    <div className={`flex items-center gap-1 mt-1 ${msg.sender === "customer" ? "justify-end" : ""}`}>
                      <span className="text-[9px] text-gray-600">{msg.time}</span>
                      {msg.sender === "customer" && <CheckCheck className="w-3 h-3 text-blue-400" />}
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-start">
                <div className="bg-[#1a1a30] border border-white/5 rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            </div>
            {/* Composer */}
            <div className="p-3 border-t border-white/5 bg-[#0e0e1c]">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  <button className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-gray-500"><Paperclip className="w-4 h-4" /></button>
                  <button className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-gray-500"><Smile className="w-4 h-4" /></button>
                </div>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[12px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                <button className="w-9 h-9 bg-gradient-to-r from-[#4a6cf7] to-[#1fb6f6] text-white rounded-xl flex items-center justify-center hover:shadow-lg hover:shadow-blue-500/25 transition-all">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {state === "error" && (
          <div className="flex-1 p-5 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500/15 to-orange-500/10 border border-rose-500/15 flex items-center justify-center mb-4">
              <WifiOff className="w-6 h-6 text-rose-400" />
            </div>
            <h3 className="text-[15px] text-white mb-1" style={{ fontWeight: 600 }}>Connection lost</h3>
            <p className="text-[12px] text-gray-500 mb-5 max-w-[240px]">We're having trouble reaching our servers. This usually resolves in a moment.</p>
            <div className="w-full max-w-[260px] px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/15 flex items-center gap-2 mb-4">
              <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span className="text-[11px] text-amber-400" style={{ fontWeight: 500 }}>Reconnecting...</span>
            </div>
            <button
              onClick={() => setState("chat")}
              className="px-5 py-2.5 bg-gradient-to-r from-[#4a6cf7] to-[#1fb6f6] text-white rounded-xl text-[13px] flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-all" style={{ fontWeight: 500 }}
            >
              <RefreshCw className="w-4 h-4" /> Retry Now
            </button>
          </div>
        )}
      </div>

      {/* Demo switcher */}
      <div className="px-3 py-2 bg-[#09091a] border-t border-white/5 flex items-center gap-1">
        {(["form", "chat", "error"] as const).map(s => (
          <button
            key={s}
            onClick={() => setState(s)}
            className={`px-2.5 py-1 rounded-md text-[10px] transition-all ${state === s ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-white/5"}`}
            style={{ fontWeight: 500 }}
          >
            {s === "form" ? "Setup" : s === "chat" ? "Chat" : "Error"}
          </button>
        ))}
      </div>
    </div>
  );
}
