import { Link } from "react-router";
import {
  MessageCircle, Phone, Users, Clock, ArrowRight, CheckCircle,
  BarChart3, Shield, Zap, Globe, Star, ChevronRight
} from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

const socialProof = [
  { label: "Active Agents", value: "2,500+" },
  { label: "Messages/Month", value: "1.2M+" },
  { label: "Avg Response", value: "<30s" },
  { label: "Lead Conversion", value: "+47%" },
];

const steps = [
  { icon: Globe, title: "Embed in Minutes", description: "Drop a single script tag on your website. Instant chat widget, customized to your brand." },
  { icon: MessageCircle, title: "Engage Every Lead", description: "Chat and voice connect agents to visitors in real-time. Office hours routing keeps leads warm 24/7." },
  { icon: BarChart3, title: "Close More Deals", description: "Lead context cards, listing data, and analytics help your team convert faster than ever." },
];

const features = [
  { icon: MessageCircle, title: "Live Chat", description: "Real-time messaging with typing indicators, read receipts, and file attachments." },
  { icon: Phone, title: "Voice Calls", description: "Built-in voice UI lets agents call leads directly from the conversation view." },
  { icon: Users, title: "Smart Routing", description: "Route conversations by availability, round-robin, or manual assignment." },
  { icon: Clock, title: "Office Hours", description: "Capture leads after hours with automated forms and follow-up workflows." },
  { icon: Shield, title: "Webhooks & APIs", description: "Integrate with your CRM, MLS, and marketing tools via webhooks." },
  { icon: BarChart3, title: "Analytics", description: "Track response times, conversion rates, and agent performance." },
];

const testimonials = [
  { name: "Sarah Chen", role: "Broker, Pinnacle Realty", quote: "SwyftUp increased our lead response rate by 3x. The listing context cards are a game-changer.", rating: 5 },
  { name: "Marcus Johnson", role: "Team Lead, Urban Homes", quote: "We went from missing 40% of inquiries to capturing every single one. The after-hours feature is brilliant.", rating: 5 },
  { name: "Emily Rodriguez", role: "Agent, Coastal Properties", quote: "The voice feature lets me call leads right from chat. I've closed 12 deals directly from widget conversations.", rating: 5 },
];

export function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-[#1a3352] to-[#0f2744]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-accent/20 text-accent px-4 py-1.5 rounded-full text-sm mb-6" style={{ fontWeight: 500 }}>
                <Zap className="w-4 h-4" /> Built for Real Estate
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl text-white mb-6" style={{ fontWeight: 700, lineHeight: 1.1 }}>
                Never Miss a
                <span className="text-accent"> Lead</span> Again
              </h1>
              <p className="text-lg text-white/70 mb-8 max-w-lg">
                Embedded chat and voice for real estate websites. Connect agents with potential buyers instantly, capture leads 24/7, and close deals faster.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-accent text-white px-8 py-3.5 rounded-lg hover:bg-accent/90 transition-all text-base"
                  style={{ fontWeight: 600 }}
                >
                  Book a Demo <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/product"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-8 py-3.5 rounded-lg hover:bg-white/20 transition-all border border-white/20 text-base"
                  style={{ fontWeight: 500 }}
                >
                  See How It Works
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-4 max-w-sm mx-auto">
                <div className="bg-primary rounded-xl p-4 mb-3">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white text-sm" style={{ fontWeight: 600 }}>SwyftUp Chat</p>
                      <p className="text-white/60 text-xs">Online - 3 agents available</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 p-2">
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-muted flex-shrink-0"></div>
                    <div className="bg-muted rounded-lg rounded-tl-none px-3 py-2 text-sm max-w-[200px]">
                      Hi! I'm interested in the listing at 123 Oak Street.
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <div className="bg-accent text-white rounded-lg rounded-tr-none px-3 py-2 text-sm max-w-[200px]">
                      Great choice! That's a 3BR/2BA listed at $485,000. Would you like to schedule a tour?
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-muted flex-shrink-0"></div>
                    <div className="bg-muted rounded-lg rounded-tl-none px-3 py-2 text-sm">
                      Yes, this Saturday works!
                    </div>
                  </div>
                </div>
                <div className="border-t border-border mt-3 pt-3 flex items-center gap-2 px-2">
                  <div className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground">Type a message...</div>
                  <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-muted py-8 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {socialProof.map((item) => (
              <div key={item.label}>
                <p className="text-2xl md:text-3xl text-primary" style={{ fontWeight: 700 }}>{item.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-accent text-sm mb-2" style={{ fontWeight: 600 }}>HOW IT WORKS</p>
            <h2 className="text-3xl md:text-4xl text-primary mb-4" style={{ fontWeight: 700 }}>
              Three Steps to More Closings
            </h2>
            <p className="text-muted-foreground">
              Get up and running in minutes, not months. SwyftUp integrates seamlessly with any real estate website.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.title} className="relative text-center p-8 rounded-2xl bg-white border border-border hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <step.icon className="w-7 h-7 text-accent" />
                </div>
                <div className="absolute top-4 right-4 text-accent/20 text-4xl" style={{ fontWeight: 700 }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="text-xl text-primary mb-3" style={{ fontWeight: 600 }}>{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-accent text-sm mb-2" style={{ fontWeight: 600 }}>FEATURES</p>
            <h2 className="text-3xl md:text-4xl text-primary mb-4" style={{ fontWeight: 700 }}>
              Everything You Need to Convert
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white p-6 rounded-xl border border-border hover:border-accent/30 transition-colors">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg text-primary mb-2" style={{ fontWeight: 600 }}>{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Case */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-accent text-sm mb-2" style={{ fontWeight: 600 }}>FOR REAL ESTATE</p>
              <h2 className="text-3xl md:text-4xl text-primary mb-6" style={{ fontWeight: 700 }}>
                Built for the Way Agents Actually Work
              </h2>
              <div className="space-y-4">
                {[
                  "Listing context cards show property details right in the chat",
                  "Lead source and UTM tracking for every conversation",
                  "Smart routing ensures the right agent gets the right lead",
                  "After-hours capture means you never lose a late-night inquiry",
                  "Voice calls directly from the conversation view"
                ].map((item) => (
                  <div key={item} className="flex gap-3 items-start">
                    <CheckCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <Link
                to="/solutions"
                className="inline-flex items-center gap-2 text-accent mt-8 hover:gap-3 transition-all"
                style={{ fontWeight: 600 }}
              >
                Learn More <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1729855637715-99192904aac5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWFsJTIwZXN0YXRlJTIwYWdlbnQlMjBzaG93aW5nJTIwaG9tZXxlbnwxfHx8fDE3NzI0OTA0MzF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Real estate agent"
                className="w-full h-80 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-accent text-sm mb-2" style={{ fontWeight: 600 }}>TESTIMONIALS</p>
            <h2 className="text-3xl md:text-4xl text-white mb-4" style={{ fontWeight: 700 }}>
              Trusted by Top Agents
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-white/90 mb-6 text-sm italic">"{t.quote}"</p>
                <div>
                  <p className="text-white text-sm" style={{ fontWeight: 600 }}>{t.name}</p>
                  <p className="text-white/60 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-accent text-sm mb-2" style={{ fontWeight: 600 }}>PRICING</p>
          <h2 className="text-3xl md:text-4xl text-primary mb-4" style={{ fontWeight: 700 }}>
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Start free, upgrade as you grow. No hidden fees, no long-term contracts.
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-lg hover:bg-primary/90 transition-all"
            style={{ fontWeight: 600 }}
          >
            View Pricing <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-accent to-[#0d9488]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl text-white mb-4" style={{ fontWeight: 700 }}>
            Ready to Convert More Leads?
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of real estate professionals using SwyftUp to engage visitors, capture leads, and close deals.
          </p>
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
