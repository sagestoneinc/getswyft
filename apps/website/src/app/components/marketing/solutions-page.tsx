import { Link } from "react-router";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { ArrowRight, CheckCircle, Building2, Home, Users, TrendingUp } from "lucide-react";

const useCases = [
  {
    icon: Building2,
    title: "Brokerages",
    description: "Centralize all agent communications. Route leads to the right team member and track performance across your entire office.",
  },
  {
    icon: Home,
    title: "Property Management",
    description: "Handle tenant inquiries, maintenance requests, and leasing questions all from one platform.",
  },
  {
    icon: Users,
    title: "Real Estate Teams",
    description: "Round-robin distribution ensures fair lead assignment. Transfer conversations when agents are unavailable.",
  },
  {
    icon: TrendingUp,
    title: "New Development Sales",
    description: "Engage prospects browsing new construction listings. Share floor plans, pricing, and availability in real-time.",
  },
];

const benefits = [
  "47% higher lead conversion rate",
  "Sub-30-second average response time",
  "24/7 lead capture with after-hours forms",
  "Property listing context in every conversation",
  "Lead source and UTM tracking",
  "Agent performance analytics",
  "CRM integration via webhooks",
  "Brand-customizable widget",
];

export function SolutionsPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-primary to-[#0f2744] py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-accent text-sm mb-3" style={{ fontWeight: 600 }}>SOLUTIONS</p>
          <h1 className="text-4xl md:text-5xl text-white mb-6" style={{ fontWeight: 700, lineHeight: 1.1 }}>
            Purpose-Built for Real Estate
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            SwyftUp understands real estate. From listing context cards to lead routing, every feature is designed for how agents actually work.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1723110994499-df46435aa4b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob21lJTIwZXh0ZXJpb3J8ZW58MXx8fHwxNzcyMzkzODI2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Luxury home"
                className="w-full h-80 object-cover"
              />
            </div>
            <div>
              <h2 className="text-3xl text-primary mb-6" style={{ fontWeight: 700 }}>
                Turn Website Visitors Into Closed Deals
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {benefits.map((b) => (
                  <div key={b} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center mb-12">
            <h2 className="text-3xl text-primary mb-4" style={{ fontWeight: 700 }}>Who Uses SwyftUp</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((uc) => (
              <div key={uc.title} className="p-6 bg-white rounded-xl border border-border hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                  <uc.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-primary mb-2" style={{ fontWeight: 600 }}>{uc.title}</h3>
                <p className="text-sm text-muted-foreground">{uc.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-accent">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl text-white mb-4" style={{ fontWeight: 700 }}>Ready to Get Started?</h2>
          <p className="text-white/80 mb-8">See how SwyftUp can work for your specific real estate use case.</p>
          <Link to="/contact" className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3.5 rounded-lg hover:bg-white/90 transition-all" style={{ fontWeight: 600 }}>
            Book a Demo <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
