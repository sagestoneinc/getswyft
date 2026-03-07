import { useState } from "react";
import { Link } from "react-router";
import {
  MessageCircle, X, Send, Paperclip, PhoneOff, PhoneCall,
  Mic, MicOff, Zap, Clock, AlertTriangle, Loader2
} from "lucide-react";
import { BrandLogo } from "../brand/logo";
import { usePageSeo } from "../../lib/seo";

type WidgetState = "closed" | "prechat" | "chat" | "afterhours" | "call" | "error";
type Theme = "light" | "dark";

const chatMessages: { sender: "agent" | "visitor"; text: string; time: string }[] = [
  { sender: "agent", text: "Hi! Welcome to Pinnacle Realty. How can I help you today?", time: "10:00 AM" },
];

export function WidgetDemo() {
  const [theme, setTheme] = useState<Theme>("light");
  const [widgetState, setWidgetState] = useState<WidgetState>("closed");
  const [messages, setMessages] = useState(chatMessages);
  const [input, setInput] = useState("");
  const [callState, setCallState] = useState<"connecting" | "ringing" | "connected" | "ended">("connecting");
  const [muted, setMuted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  const isDark = theme === "dark";
  const bg = isDark ? "bg-gray-900" : "bg-white";
  const text = isDark ? "text-gray-100" : "text-gray-900";
  const subtext = isDark ? "text-gray-400" : "text-gray-500";
  const border = isDark ? "border-gray-700" : "border-gray-200";
  const inputBg = isDark ? "bg-gray-800" : "bg-gray-50";
  const msgBg = isDark ? "bg-gray-800" : "bg-gray-100";

  usePageSeo({
    title: "Widget Demo | SwyftUp",
    description: "Interactive demo of the SwyftUp chat and voice widget for business websites.",
    path: "/widget-demo",
    noIndex: true,
  });

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { sender: "visitor", text: input, time: "Now" }]);
    setInput("");
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "agent", text: "Thanks for your message! Let me look into that for you.", time: "Now" },
      ]);
    }, 1500);
  };

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => setUploading(false), 2000);
  };

  const renderWidget = () => {
    if (widgetState === "closed") return null;

    return (
      <div className={`w-[360px] max-h-[520px] rounded-2xl shadow-2xl overflow-hidden flex flex-col ${bg} ${border} border`}>
        {/* Header */}
        <div className="bg-[#1e3a5f] p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#14b8a6] rounded-full flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white text-sm" style={{ fontWeight: 600 }}>Pinnacle Realty</p>
            <p className="text-white/60 text-xs">
              {widgetState === "afterhours" ? "After hours" : "Online - Ready to help"}
            </p>
          </div>
          <button onClick={() => setWidgetState("closed")} className="text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pre-chat form */}
        {widgetState === "prechat" && (
          <div className="flex-1 p-4 space-y-4">
            <div>
              <p className={`text-sm ${text} mb-3`} style={{ fontWeight: 600 }}>Start a conversation</p>
              <p className={`text-xs ${subtext} mb-4`}>Fill in your details and we'll connect you with an agent.</p>
            </div>
            <div>
              <label className={`block text-xs ${text} mb-1`} style={{ fontWeight: 500 }}>Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${border} ${inputBg} text-sm ${text} focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/50`}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className={`block text-xs ${text} mb-1`} style={{ fontWeight: 500 }}>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${border} ${inputBg} text-sm ${text} focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/50`}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className={`block text-xs ${text} mb-1`} style={{ fontWeight: 500 }}>Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={3}
                className={`w-full px-3 py-2 rounded-lg border ${border} ${inputBg} text-sm ${text} focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/50 resize-none`}
                placeholder="How can we help?"
              />
            </div>
            <button
              onClick={() => setWidgetState("chat")}
              className="w-full bg-[#14b8a6] text-white py-2.5 rounded-lg hover:bg-[#14b8a6]/90 text-sm"
              style={{ fontWeight: 600 }}
            >
              Start Chat
            </button>
          </div>
        )}

        {/* Chat state */}
        {widgetState === "chat" && (
          <>
            <div className="flex-1 overflow-auto p-4 space-y-3 min-h-[280px]">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.sender === "visitor" ? "justify-end" : ""}`}>
                  {msg.sender === "agent" && (
                    <div className="w-6 h-6 bg-[#14b8a6] rounded-full flex-shrink-0 flex items-center justify-center">
                      <Zap className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                    msg.sender === "visitor"
                      ? "bg-[#14b8a6] text-white rounded-tr-sm"
                      : `${msgBg} ${text} rounded-tl-sm`
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {uploading && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 bg-muted rounded-full flex-shrink-0"></div>
                  <div className={`${msgBg} rounded-2xl rounded-tl-sm px-3 py-2`}>
                    <div className={`flex items-center gap-2 text-xs ${subtext}`}>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Uploading file... 67%</span>
                    </div>
                    <div className="w-32 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-[#14b8a6] rounded-full w-2/3 transition-all"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className={`border-t ${border} p-3`}>
              <div className="flex items-end gap-2">
                <button onClick={handleUpload} className={`p-1.5 ${subtext} hover:text-[#14b8a6]`}>
                  <Paperclip className="w-4 h-4" />
                </button>
                <div className="flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type a message..."
                    className={`w-full px-3 py-2 rounded-lg ${inputBg} text-sm ${text} focus:outline-none`}
                  />
                </div>
                <button onClick={handleSend} className="p-2 bg-[#14b8a6] text-white rounded-lg hover:bg-[#14b8a6]/90">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* After hours */}
        {widgetState === "afterhours" && (
          <div className="flex-1 p-4">
            <div className={`${isDark ? "bg-amber-900/30 border-amber-700" : "bg-amber-50 border-amber-200"} border rounded-lg p-3 mb-4 flex items-start gap-2`}>
              <Clock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-amber-700" style={{ fontWeight: 600 }}>We're currently offline</p>
                <p className="text-xs text-amber-600 mt-0.5">Our office hours are Mon-Fri, 9AM-6PM CT. Leave your details and we'll get back to you!</p>
              </div>
            </div>
            <div className="space-y-3">
              <input className={`w-full px-3 py-2 rounded-lg border ${border} ${inputBg} text-sm ${text} focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/50`} placeholder="Your name" />
              <input className={`w-full px-3 py-2 rounded-lg border ${border} ${inputBg} text-sm ${text} focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/50`} placeholder="Email address" />
              <input className={`w-full px-3 py-2 rounded-lg border ${border} ${inputBg} text-sm ${text} focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/50`} placeholder="Phone (optional)" />
              <textarea rows={3} className={`w-full px-3 py-2 rounded-lg border ${border} ${inputBg} text-sm ${text} focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/50 resize-none`} placeholder="Your message..." />
              <button
                onClick={() => setWidgetState("chat")}
                className="w-full bg-[#14b8a6] text-white py-2.5 rounded-lg text-sm"
                style={{ fontWeight: 600 }}
              >
                Leave Message
              </button>
            </div>
          </div>
        )}

        {/* Call UI */}
        {widgetState === "call" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-20 h-20 bg-[#14b8a6]/10 rounded-full flex items-center justify-center mb-4">
              <PhoneCall className={`w-10 h-10 text-[#14b8a6] ${callState === "ringing" || callState === "connecting" ? "animate-pulse" : ""}`} />
            </div>
            <p className={`text-lg ${text} mb-1`} style={{ fontWeight: 600 }}>
              {callState === "connecting" && "Connecting..."}
              {callState === "ringing" && "Ringing..."}
              {callState === "connected" && "Connected"}
              {callState === "ended" && "Call Ended"}
            </p>
            <p className={`text-sm ${subtext} mb-8`}>
              {callState === "connected" ? "00:42" : callState === "ended" ? "Duration: 2:15" : "Pinnacle Realty"}
            </p>
            <div className="flex items-center gap-4">
              {callState !== "ended" && (
                <>
                  <button onClick={() => setMuted(!muted)} className={`w-12 h-12 rounded-full flex items-center justify-center ${muted ? "bg-gray-200" : inputBg} ${text}`}>
                    {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => setCallState("ended")}
                    className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>
                </>
              )}
              {callState === "ended" && (
                <button
                  onClick={() => { setCallState("connecting"); setWidgetState("chat"); }}
                  className="bg-[#14b8a6] text-white px-6 py-2.5 rounded-lg text-sm"
                  style={{ fontWeight: 600 }}
                >
                  Back to Chat
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error state */}
        {widgetState === "error" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <p className={`text-lg ${text} mb-1`} style={{ fontWeight: 600 }}>Connection Error</p>
            <p className={`text-sm ${subtext} mb-6`}>Unable to connect. Please check your internet connection and try again.</p>
            <button
              onClick={() => setWidgetState("chat")}
              className="bg-[#14b8a6] text-white px-6 py-2.5 rounded-lg text-sm"
              style={{ fontWeight: 600 }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen font-[Inter,sans-serif] ${isDark ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      {/* Controls */}
      <div className={`border-b ${isDark ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"} px-4 py-3`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3" aria-label="SwyftUp home">
              <BrandLogo size="sm" />
              <span className="text-xs uppercase tracking-[0.18em] text-[#14b8a6]" style={{ fontWeight: 700 }}>
                Widget Demo
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Theme:</span>
            <button
              onClick={() => setTheme("light")}
              className={`text-xs px-3 py-1.5 rounded-lg border ${theme === "light" ? "bg-[#14b8a6] text-white border-[#14b8a6]" : `${isDark ? "border-gray-700" : "border-gray-200"}`}`}
              style={{ fontWeight: 500 }}
            >
              Light
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`text-xs px-3 py-1.5 rounded-lg border ${theme === "dark" ? "bg-[#14b8a6] text-white border-[#14b8a6]" : `${isDark ? "border-gray-700" : "border-gray-200"}`}`}
              style={{ fontWeight: 500 }}
            >
              Dark
            </button>

            <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"} ml-3`}>State:</span>
            {(["prechat", "chat", "afterhours", "call", "error"] as WidgetState[]).map((s) => (
              <button
                key={s}
                onClick={() => { setWidgetState(s); if (s === "call") setCallState("connecting"); }}
                className={`text-xs px-3 py-1.5 rounded-lg border capitalize ${widgetState === s ? "bg-[#1e3a5f] text-white border-[#1e3a5f]" : `${isDark ? "border-gray-700" : "border-gray-200"}`}`}
                style={{ fontWeight: 500 }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Demo area */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl mb-3" style={{ fontWeight: 700 }}>Embedded Widget Preview</h1>
          <p className={`${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Interactive preview of the SwyftUp chat widget. Use the controls above to switch states and themes.
          </p>
        </div>

        <div className="flex justify-center items-end min-h-[560px] relative">
          {/* Widget */}
          <div className="absolute bottom-0 right-8">
            {renderWidget()}

            {/* Launcher */}
            <button
              onClick={() => setWidgetState(widgetState === "closed" ? "prechat" : "closed")}
              className={`mt-4 ml-auto block w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 ${
                widgetState !== "closed" ? "bg-gray-600" : "bg-[#14b8a6]"
              }`}
            >
              {widgetState !== "closed" ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <MessageCircle className="w-6 h-6 text-white" />
              )}
            </button>
          </div>

          {/* Fake page content */}
          <div className={`w-full max-w-4xl ${isDark ? "bg-gray-900" : "bg-white"} rounded-xl border ${isDark ? "border-gray-800" : "border-gray-200"} p-8 min-h-[500px]`}>
            <div className={`h-8 w-48 ${isDark ? "bg-gray-800" : "bg-gray-100"} rounded mb-4`}></div>
            <div className={`h-4 w-full ${isDark ? "bg-gray-800" : "bg-gray-100"} rounded mb-2`}></div>
            <div className={`h-4 w-3/4 ${isDark ? "bg-gray-800" : "bg-gray-100"} rounded mb-6`}></div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`h-32 ${isDark ? "bg-gray-800" : "bg-gray-100"} rounded-lg`}></div>
              ))}
            </div>
            <div className={`h-4 w-full ${isDark ? "bg-gray-800" : "bg-gray-100"} rounded mb-2`}></div>
            <div className={`h-4 w-5/6 ${isDark ? "bg-gray-800" : "bg-gray-100"} rounded mb-2`}></div>
            <div className={`h-4 w-2/3 ${isDark ? "bg-gray-800" : "bg-gray-100"} rounded`}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
