import { Link } from "react-router";
import {
  MessageCircle, Phone, Users, Clock, Webhook, BarChart3,
  ArrowRight, Zap
} from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "Real-Time Chat",
    description: "Send and receive messages instantly with typing indicators, read receipts, and rich media attachments. Your visitors get immediate responses.",
    details: ["Typing indicators & read receipts", "Image & file attachments", "Message history & search", "Emoji reactions"],
  },
  {
    icon: Phone,
    title: "Voice Calls",
    description: "Built-in voice calling lets agents connect with leads directly from the chat interface. No app switching required.",
    details: ["One-click calling from chat", "Call recording & transcription", "Hold & transfer controls", "Call quality monitoring"],
  },
  {
    icon: Users,
    title: "Intelligent Routing",
    description: "Automatically route conversations to the right agent based on availability, round-robin, or manual assignment rules.",
    details: ["Round-robin distribution", "First-available routing", "Manual assignment", "Fallback agent selection"],
  },
  {
    icon: Clock,
    title: "Office Hours & After-Hours",
    description: "Set business hours with timezone support. Capture leads after hours with automated forms so you never miss an opportunity.",
    details: ["Timezone-aware scheduling", "After-hours lead capture forms", "Auto-response messages", "SLA timers"],
  },
  {
    icon: Webhook,
    title: "Webhooks & Integrations",
    description: "Connect SwyftUp to your CRM, MLS, and marketing tools. Real-time event delivery with retry logic and delivery logs.",
    details: ["REST webhook endpoints", "Event filtering", "Delivery logs & retry", "CRM integrations"],
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track key metrics like response times, conversation volume, agent performance, and lead conversion rates in real-time.",
    details: ["Response time tracking", "Conversion analytics", "Agent leaderboards", "Custom date ranges"],
  },
];

export function ProductPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-primary to-[#0f2744] py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-accent text-sm mb-3" style={{ fontWeight: 600 }}>PRODUCT</p>
          <h1 className="text-4xl md:text-5xl text-white mb-6" style={{ fontWeight: 700, lineHeight: 1.1 }}>
            The Complete Communication Platform for Real Estate
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Chat, voice, routing, and analytics - everything your team needs to engage visitors and convert leads, in one embeddable widget.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-20">
            {features.map((f, i) => (
              <div key={f.title} className={`grid md:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? "md:direction-rtl" : ""}`}>
                <div className={i % 2 === 1 ? "md:order-2" : ""}>
                  <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mb-5">
                    <f.icon className="w-7 h-7 text-accent" />
                  </div>
                  <h2 className="text-2xl md:text-3xl text-primary mb-4" style={{ fontWeight: 700 }}>{f.title}</h2>
                  <p className="text-muted-foreground mb-6">{f.description}</p>
                  <ul className="space-y-2">
                    {f.details.map((d) => (
                      <li key={d} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Zap className="w-4 h-4 text-accent flex-shrink-0" /> {d}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`bg-muted rounded-2xl h-64 flex items-center justify-center ${i % 2 === 1 ? "md:order-1" : ""}`}>
                  <f.icon className="w-20 h-20 text-accent/20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-accent">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl text-white mb-4" style={{ fontWeight: 700 }}>See It In Action</h2>
          <p className="text-white/80 mb-8">Schedule a personalized demo with our team and see how SwyftUp can transform your lead engagement.</p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3.5 rounded-lg hover:bg-white/90 transition-all"
            style={{ fontWeight: 600 }}
          >
            Book a Demo <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
