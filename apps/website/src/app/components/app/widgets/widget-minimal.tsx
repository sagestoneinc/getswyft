import { useState } from "react";
import {
  X, Minus, Paperclip, Smile, Send, CheckCheck,
  AlertCircle, RefreshCw
} from "lucide-react";
import { LogoMark, BrandLogo } from "../../brand/logo";
import type { WidgetState, ChatMessage } from "./widget-shared";

const chatMessages: ChatMessage[] = [
  { id: 1, sender: "agent", text: "Hi there! Welcome to SwyftUp support. How can I help you today?", time: "10:23 AM" },
  { id: 2, sender: "customer", text: "I'm having trouble setting up the API integration with our CRM system.", time: "10:25 AM" },
  { id: 3, sender: "agent", text: "I'd be happy to help! You can find the webhook configuration under Settings > Integrations > Webhooks. Let me walk you through it.", time: "10:26 AM" },
  { id: 4, sender: "customer", text: "Found it — but I'm getting an 'Invalid endpoint' error when I try to save.", time: "10:28 AM" },
  { id: 5, sender: "agent", text: "That usually means the endpoint returns a redirect. Try removing the trailing slash from your webhook URL and saving again.", time: "10:30 AM" },
];

export function WidgetMinimal() {
  const [state, setState] = useState<WidgetState>("collapsed");
  const [input, setInput] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });

  if (state === "collapsed") {
    return (
      <button
        onClick={() => setState("form")}
        className="w-[60px] h-[60px] rounded-full bg-white flex items-center justify-center shadow-lg shadow-black/10 hover:shadow-xl hover:scale-105 transition-all relative border border-gray-200/80 group"
      >
        <LogoMark className="w-9 h-9 group-hover:scale-110 transition-transform" />
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center border-2 border-white" style={{ fontWeight: 700 }}>2</div>
      </button>
    );
  }

  return (
    <div className="w-[380px] bg-white rounded-2xl shadow-2xl shadow-black/12 overflow-hidden border border-gray-200/70 flex flex-col" style={{ height: "520px" }}>
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo size="sm" />
          <div className="w-px h-5 bg-gray-200" />
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="text-[11px] text-gray-500">Online</span>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={() => setState("collapsed")} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400">
            <Minus className="w-4 h-4" />
          </button>
          <button onClick={() => setState("collapsed")} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {state === "form" && (
          <div className="flex-1 p-5 flex flex-col">
            <div className="mb-5">
              <h3 className="text-[16px] text-gray-900" style={{ fontWeight: 600 }}>Start a conversation</h3>
              <p className="text-[12px] text-gray-500 mt-1">Fill in your details and we'll connect you with our team right away.</p>
            </div>
            <div className="space-y-3 flex-1">
              {[
                { key: "name", label: "Name", placeholder: "Your full name", type: "text" },
                { key: "email", label: "Email", placeholder: "you@company.com", type: "email" },
                { key: "phone", label: "Phone", placeholder: "+1 (555) 000-0000", type: "tel" },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-[11px] text-gray-500 mb-1 block" style={{ fontWeight: 500 }}>{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={formData[field.key as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-400/40 transition-all"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => setState("chat")}
              className="w-full py-2.5 bg-[#1a1a2e] text-white rounded-xl text-[13px] hover:bg-[#2a2a40] transition-colors mt-4" style={{ fontWeight: 500 }}
            >
              Start Chat
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-3">By continuing, you agree to our Privacy Policy</p>
          </div>
        )}

        {state === "chat" && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/40">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === "customer" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[280px]">
                    <div className={`px-3.5 py-2.5 text-[13px] leading-relaxed ${
                      msg.sender === "customer"
                        ? "bg-[#1a1a2e] text-white rounded-2xl rounded-br-sm"
                        : "bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-sm shadow-sm"
                    }`}>
                      {msg.text}
                    </div>
                    <div className={`flex items-center gap-1 mt-1 ${msg.sender === "customer" ? "justify-end" : ""}`}>
                      <span className="text-[9px] text-gray-400">{msg.time}</span>
                      {msg.sender === "customer" && <CheckCheck className="w-3 h-3 text-blue-500" />}
                    </div>
                  </div>
                </div>
              ))}
              {/* Typing */}
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            </div>
            {/* Composer */}
            <div className="p-3 bg-white border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"><Paperclip className="w-4 h-4" /></button>
                  <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"><Smile className="w-4 h-4" /></button>
                </div>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[12px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all"
                />
                <button className="w-9 h-9 bg-[#1a1a2e] text-white rounded-xl flex items-center justify-center hover:bg-[#2a2a40] transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {state === "error" && (
          <div className="flex-1 p-5 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-[15px] text-gray-900 mb-1" style={{ fontWeight: 600 }}>Something went wrong</h3>
            <p className="text-[12px] text-gray-500 mb-5 max-w-[240px]">We're having trouble connecting right now. Please try again in a moment.</p>
            <button
              onClick={() => setState("chat")}
              className="px-5 py-2.5 bg-[#1a1a2e] text-white rounded-xl text-[13px] flex items-center gap-2 hover:bg-[#2a2a40] transition-colors" style={{ fontWeight: 500 }}
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
            <button onClick={() => setState("form")} className="mt-2.5 text-[11px] text-gray-400 hover:text-gray-600 transition-colors">Start a new conversation</button>
          </div>
        )}
      </div>

      {/* Demo state switcher */}
      <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-1">
        {(["form", "chat", "error"] as const).map(s => (
          <button
            key={s}
            onClick={() => setState(s)}
            className={`px-2.5 py-1 rounded-md text-[10px] transition-all ${state === s ? "bg-[#1a1a2e] text-white" : "text-gray-500 hover:bg-gray-200"}`}
            style={{ fontWeight: 500 }}
          >
            {s === "form" ? "Setup" : s === "chat" ? "Chat" : "Error"}
          </button>
        ))}
      </div>
    </div>
  );
}
