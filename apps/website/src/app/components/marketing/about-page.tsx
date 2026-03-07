import { Link } from "react-router";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { ArrowRight, Target, Heart, Zap, Users } from "lucide-react";

const values = [
  { icon: Target, title: "Customer-First", description: "Every feature is designed around how real teams handle customer conversations in daily operations." },
  { icon: Zap, title: "Speed Matters", description: "Response speed and handoff quality are core to the product experience." },
  { icon: Heart, title: "Simplicity", description: "Powerful doesn't mean complicated. SwyftUp is easy to set up, easy to use, and easy to love." },
  { icon: Users, title: "Partnership", description: "We succeed when our customers succeed. We work closely with teams from rollout through long-term optimization." },
];

const team = [
  { name: "Leadership Team", role: "Executive Team", bio: "Focused on product clarity, operational reliability, and long-term customer outcomes." },
  { name: "Product Leadership", role: "Product", bio: "Designs communication workflows that connect chat, voice, AI, and routing." },
  { name: "Engineering Leadership", role: "Engineering", bio: "Builds and operates the platform infrastructure, APIs, and integrations." },
  { name: "Customer Success Leadership", role: "Customer Success", bio: "Partners with customers on rollout, adoption, and measurable improvement." },
];

export function AboutPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-primary to-[#0f2744] py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-accent text-sm mb-3" style={{ fontWeight: 600 }}>ABOUT US</p>
          <h1 className="text-4xl md:text-5xl text-white mb-6" style={{ fontWeight: 700, lineHeight: 1.1 }}>
            We're on a Mission to Modernize Customer Communication
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            SwyftUp was built to help teams respond faster, route smarter, and keep customer context visible from first contact to final follow-up.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1758691736843-90f58dce465e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtJTIwY29sbGFib3JhdGlvbiUyMHdvcmtzcGFjZXxlbnwxfHx8fDE3NzI0ODQzNzl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="SwyftUp team collaborating on customer communication workflows"
                className="w-full h-80 object-cover"
              />
            </div>
            <div>
              <h2 className="text-3xl text-primary mb-6" style={{ fontWeight: 700 }}>Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>SwyftUp started when the founding team saw how often customer conversations broke down during handoff between tools and teams.</p>
                <p>Most communication stacks handled one channel well but left teams to stitch together routing, ownership, and follow-up manually.</p>
                <p>The platform was built as one system for chat, voice, AI automation, and operational workflows so communication stays clear as volume grows.</p>
              </div>
            </div>
          </div>

          <div className="text-center mb-12">
            <h2 className="text-3xl text-primary mb-4" style={{ fontWeight: 700 }}>Our Values</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {values.map((v) => (
              <div key={v.title} className="text-center p-6">
                <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <v.icon className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-primary mb-2" style={{ fontWeight: 600 }}>{v.title}</h3>
                <p className="text-sm text-muted-foreground">{v.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mb-12">
            <h2 className="text-3xl text-primary mb-4" style={{ fontWeight: 700 }}>Leadership Team</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((t) => (
              <div key={t.name} className="bg-white rounded-xl border border-border p-6 text-center">
                <div className="w-20 h-20 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-primary" style={{ fontWeight: 600 }}>{t.name}</h3>
                <p className="text-accent text-sm mb-2">{t.role}</p>
                <p className="text-xs text-muted-foreground">{t.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-accent">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl text-white mb-4" style={{ fontWeight: 700 }}>Join Us</h2>
          <p className="text-white/80 mb-8">We're always looking for talented people who are passionate about real estate and technology.</p>
          <Link to="/contact" className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3.5 rounded-lg hover:bg-white/90 transition-all" style={{ fontWeight: 600 }}>
            Get in Touch <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
