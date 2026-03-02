import { Link } from "react-router";
import { CheckCircle, ArrowRight, X } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    description: "Perfect for solo agents getting started",
    features: ["1 agent seat", "100 conversations/mo", "Live chat widget", "Basic routing", "Email support"],
    notIncluded: ["Voice calls", "Webhooks", "Analytics", "Custom branding"],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "$49",
    period: "/agent/mo",
    description: "For growing teams that need more power",
    features: ["Unlimited conversations", "Voice calls", "Smart routing", "Office hours", "Webhooks & integrations", "Analytics dashboard", "Custom branding", "Priority support"],
    notIncluded: [],
    cta: "Book a Demo",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large brokerages with custom needs",
    features: ["Everything in Pro", "Unlimited agents", "SSO / SAML", "Dedicated account manager", "Custom integrations", "SLA guarantees", "White-label option", "Phone support"],
    notIncluded: [],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const faqs = [
  { q: "Can I try SwyftUp for free?", a: "Yes! Our Starter plan is free forever with up to 100 conversations per month. No credit card required." },
  { q: "How does per-agent pricing work?", a: "You only pay for agents who actively use the platform. You can add or remove seats at any time." },
  { q: "Is there a long-term contract?", a: "No. All plans are month-to-month. You can cancel anytime with no penalties." },
  { q: "What counts as a conversation?", a: "A conversation is a complete thread between a visitor and an agent, regardless of the number of messages exchanged." },
];

export function PricingPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-primary to-[#0f2744] py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-accent text-sm mb-3" style={{ fontWeight: 600 }}>PRICING</p>
          <h1 className="text-4xl md:text-5xl text-white mb-6" style={{ fontWeight: 700, lineHeight: 1.1 }}>
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-white/70">Start free. Upgrade as you grow. No surprises.</p>
        </div>
      </section>

      <section className="py-20 -mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border ${
                  plan.highlighted
                    ? "bg-white border-accent shadow-xl shadow-accent/10 ring-2 ring-accent relative"
                    : "bg-white border-border"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs px-4 py-1 rounded-full" style={{ fontWeight: 600 }}>
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg text-primary mb-2" style={{ fontWeight: 600 }}>{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl text-primary" style={{ fontWeight: 700 }}>{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                <Link
                  to="/contact"
                  className={`block text-center py-3 rounded-lg transition-all mb-8 ${
                    plan.highlighted
                      ? "bg-accent text-white hover:bg-accent/90"
                      : "bg-primary text-white hover:bg-primary/90"
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  {plan.cta}
                </Link>
                <div className="space-y-3">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                  {plan.notIncluded.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground/50">
                      <X className="w-4 h-4 flex-shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl text-primary text-center mb-12" style={{ fontWeight: 700 }}>Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-white rounded-xl p-6 border border-border">
                <h3 className="text-primary mb-2" style={{ fontWeight: 600 }}>{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
