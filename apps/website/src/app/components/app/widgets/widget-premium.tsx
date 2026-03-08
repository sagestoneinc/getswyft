import { useState } from "react";
import {
  X, Minus, Paperclip, Smile, Send, CheckCheck,
  AlertCircle, RefreshCw, ArrowRight, Shield, Clock
} from "lucide-react";
import { LogoMark, BrandLogo } from "../../brand/logo";
import type { WidgetState, ChatMessage } from "./widget-shared";

const chatMessages: ChatMessage[] = [
  { id: 1, sender: "agent", name: "Alex from SwyftUp", text: "Hi! I'm Alex. How can I assist you today?", time: "10:23 AM" },
  { id: 2, sender: "customer", name: "You", text: "Hi Alex — I want to upgrade my plan but I'm not sure which tier is the best fit.", time: "10:25 AM" },
  { id: 3, sender: "agent", name: "Alex from SwyftUp", text: "Great question! Could you tell me a bit about your team size and which features you use most? That'll help me recommend the right plan.", time: "10:26 AM" },
  { id: 4, sender: "customer", name: "You", text: "We have about 15 agents and primarily use chat + analytics features.", time: "10:28 AM" },
  { id: 5, sender: "agent", name: "Alex from SwyftUp", text: "For 15 agents with those needs, I'd recommend the Business plan — unlimited chats, advanced analytics, and priority support. Want me to walk you through the upgrade?", time: "10:30 AM" },
];

export function WidgetPremium() {
  const [state, setState] = useState<WidgetState>("collapsed");
  const [input, setInput] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });

  if (state === "collapsed") {
    return (
      <div className="flex flex-col items-end gap-3">
        {/* Proactive greeting */}
        <div className="bg-white rounded-2xl rounded-br-sm shadow-lg shadow-black/8 px-4 py-3 max-w-[220px] border border-gray-100">
          <p className="text-[12px] text-gray-700 leading-relaxed">Hey! Need help? We're online and ready to chat.</p>
          <div className="flex items-center gap-1 mt-1.5">
            <Clock className="w-3 h-3 text-blue-500" />
            <span className="text-[10px] text-blue-600" style={{ fontWeight: 500 }}>Replies in ~2 min</span>
          </div>
        </div>
        <button
          onClick={() => setState("form")}
          className="w-[60px] h-[60px] rounded-2xl bg-[#f8f7f4] flex items-center justify-center shadow-lg shadow-black/10 hover:shadow-xl hover:scale-105 transition-all relative border border-[#e5e2dc]"
        >
          <LogoMark className="w-9 h-9" />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-[10px] text-white flex items-center justify-center border-2 border-white" style={{ fontWeight: 700 }}>1</div>
        </button>
      </div>
    );
  }

  return (
    <div className="w-[380px] bg-[#faf9f6] rounded-2xl shadow-2xl shadow-black/10 overflow-hidden border border-[#e5e2dc] flex flex-col" style={{ height: "540px" }}>
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-[#eae7e1] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo size="sm" />
          <div className="w-px h-5 bg-[#e5e2dc]" />
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="text-[10px] text-gray-500" style={{ fontWeight: 500 }}>Online now</span>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={() => setState("collapsed")} className="p-1.5 rounded-lg hover:bg-[#f5f3ef] transition-colors text-gray-400">
            <Minus className="w-4 h-4" />
          </button>
          <button onClick={() => setState("collapsed")} className="p-1.5 rounded-lg hover:bg-[#f5f3ef] transition-colors text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {state === "form" && (
          <div className="flex-1 p-5 flex flex-col bg-white">
            <div className="text-center mb-5">
              <LogoMark className="w-11 h-11 mx-auto mb-3" />
              <h3 className="text-[16px] text-[#1b1b1f]" style={{ fontWeight: 600 }}>Chat with us</h3>
              <p className="text-[12px] text-gray-500 mt-1">We're here to help. Start a conversation below.</p>
            </div>
            <div className="space-y-3 flex-1">
              {[
                { key: "name", label: "Full name", placeholder: "Sarah Chen", type: "text" },
                { key: "email", label: "Email address", placeholder: "sarah@acmecorp.com", type: "email" },
                { key: "phone", label: "Phone number", placeholder: "+1 (555) 123-4567", type: "tel" },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-[11px] text-gray-500 mb-1 block" style={{ fontWeight: 500 }}>{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={formData[field.key as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#faf9f6] border border-[#e5e2dc] rounded-xl text-[13px] text-[#1b1b1f] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-400/40 transition-all"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => setState("chat")}
              className="w-full py-2.5 bg-[#1b1b1f] text-white rounded-xl text-[13px] flex items-center justify-center gap-2 hover:bg-[#2a2a35] transition-colors mt-4 shadow-sm" style={{ fontWeight: 500 }}
            >
              Begin Conversation <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex items-center justify-center gap-1 mt-3">
              <Shield className="w-3 h-3 text-gray-400" />
              <p className="text-[10px] text-gray-400">Your data is encrypted and secure</p>
            </div>
          </div>
        )}

        {state === "chat" && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#faf9f6]">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex gap-2 ${msg.sender === "customer" ? "flex-row-reverse" : ""}`}>
                  <div className="max-w-[280px]">
                    <div className={`flex items-center gap-1.5 mb-1 ${msg.sender === "customer" ? "justify-end" : ""}`}>
                      <span className="text-[10px] text-gray-400" style={{ fontWeight: 500 }}>{msg.name}</span>
                      <span className="text-[9px] text-gray-300">{msg.time}</span>
                    </div>
                    <div className={`px-3.5 py-2.5 text-[13px] leading-relaxed ${
                      msg.sender === "customer"
                        ? "bg-[#1b1b1f] text-white rounded-2xl rounded-tr-sm shadow-sm"
                        : "bg-white text-[#1b1b1f] border border-[#e5e2dc] rounded-2xl rounded-tl-sm shadow-sm"
                    }`}>
                      {msg.text}
                    </div>
                    {msg.sender === "customer" && (
                      <div className="flex items-center gap-1 mt-0.5 justify-end">
                        <CheckCheck className="w-3 h-3 text-blue-500" />
                        <span className="text-[9px] text-gray-400">seen</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {/* Typing */}
              <div className="flex gap-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] text-gray-400" style={{ fontWeight: 500 }}>Alex is typing</span>
                  </div>
                  <div className="bg-white border border-[#e5e2dc] rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Composer */}
            <div className="p-3 bg-white border-t border-[#eae7e1]">
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-lg hover:bg-[#f5f3ef] transition-colors text-gray-400"><Paperclip className="w-4 h-4" /></button>
                <button className="p-1.5 rounded-lg hover:bg-[#f5f3ef] transition-colors text-gray-400"><Smile className="w-4 h-4" /></button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 px-3 py-2 bg-[#faf9f6] border border-[#e5e2dc] rounded-xl text-[12px] text-[#1b1b1f] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all"
                />
                <button className="w-9 h-9 bg-[#1b1b1f] text-white rounded-xl flex items-center justify-center hover:bg-[#2a2a35] transition-colors shadow-sm">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {state === "error" && (
          <div className="flex-1 p-5 flex flex-col items-center justify-center text-center bg-white">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200/50 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-[15px] text-[#1b1b1f] mb-1" style={{ fontWeight: 600 }}>Message failed to send</h3>
            <p className="text-[12px] text-gray-500 mb-4 max-w-[250px]">Don't worry — your message has been saved. We'll try sending it again automatically.</p>
            {/* Failed message preview */}
            <div className="w-full max-w-[280px] px-3.5 py-2.5 bg-[#faf9f6] border border-red-200/60 rounded-xl mb-4 text-left">
              <p className="text-[12px] text-gray-700">I want to upgrade my plan but I'm unsure which tier fits best.</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <AlertCircle className="w-3 h-3 text-red-400" />
                <span className="text-[10px] text-red-400" style={{ fontWeight: 500 }}>Failed to send &bull; Tap to retry</span>
              </div>
            </div>
            <button
              onClick={() => setState("chat")}
              className="px-5 py-2.5 bg-[#1b1b1f] text-white rounded-xl text-[13px] flex items-center gap-2 hover:bg-[#2a2a35] transition-colors shadow-sm" style={{ fontWeight: 500 }}
            >
              <RefreshCw className="w-4 h-4" /> Resend Message
            </button>
          </div>
        )}
      </div>

      {/* Demo switcher */}
      <div className="px-3 py-2 bg-white border-t border-[#eae7e1] flex items-center gap-1">
        {(["form", "chat", "error"] as const).map(s => (
          <button
            key={s}
            onClick={() => setState(s)}
            className={`px-2.5 py-1 rounded-md text-[10px] transition-all ${state === s ? "bg-[#1b1b1f] text-white" : "text-gray-500 hover:bg-[#f0ede8]"}`}
            style={{ fontWeight: 500 }}
          >
            {s === "form" ? "Setup" : s === "chat" ? "Chat" : "Error"}
          </button>
        ))}
      </div>
    </div>
  );
}
