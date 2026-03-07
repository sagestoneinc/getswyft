import { useState } from "react";
import { Mail, Phone, MapPin, ArrowRight, CheckCircle } from "lucide-react";

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="py-32 text-center max-w-lg mx-auto px-4">
        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-3xl text-primary mb-4" style={{ fontWeight: 700 }}>Demo Requested!</h1>
        <p className="text-muted-foreground mb-8">
          Thanks for your interest in SwyftUp. Our team will reach out within 24 hours to schedule your personalized demo.
        </p>
        <button onClick={() => setSubmitted(false)} className="text-accent hover:underline" style={{ fontWeight: 500 }}>
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <div>
      <section className="bg-gradient-to-br from-primary to-[#0f2744] py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-accent text-sm mb-3" style={{ fontWeight: 600 }}>CONTACT</p>
          <h1 className="text-4xl md:text-5xl text-white mb-6" style={{ fontWeight: 700, lineHeight: 1.1 }}>
            Book a Demo
          </h1>
          <p className="text-lg text-white/70">See SwyftUp in action with a personalized walkthrough.</p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-12">
            <div className="md:col-span-3">
              <h2 className="text-2xl text-primary mb-6" style={{ fontWeight: 700 }}>Request a Demo</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
                className="space-y-5"
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>First Name</label>
                    <input type="text" required className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50" placeholder="Jane" />
                  </div>
                  <div>
                    <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Last Name</label>
                    <input type="text" required className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50" placeholder="Smith" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Work Email</label>
                  <input type="email" required className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50" placeholder="jane@brokerage.com" />
                </div>
                <div>
                  <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Phone</label>
                  <input type="tel" className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50" placeholder="(555) 123-4567" />
                </div>
                <div>
                  <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Company / Brokerage</label>
                  <input type="text" className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50" placeholder="Pinnacle Realty" />
                </div>
                <div>
                  <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Team Size</label>
                  <select className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50">
                    <option>1-5 agents</option>
                    <option>6-20 agents</option>
                    <option>21-50 agents</option>
                    <option>50+ agents</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Message (optional)</label>
                  <textarea rows={3} className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none" placeholder="Tell us about your needs..." />
                </div>
                <button type="submit" className="w-full bg-accent text-white py-3 rounded-lg hover:bg-accent/90 transition-all flex items-center justify-center gap-2" style={{ fontWeight: 600 }}>
                  Request Demo <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </div>

            <div className="md:col-span-2">
              <h2 className="text-2xl text-primary mb-6" style={{ fontWeight: 700 }}>Get in Touch</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-primary" style={{ fontWeight: 600 }}>Email</p>
                    <p className="text-sm text-muted-foreground">hello@swyftup.com</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-primary" style={{ fontWeight: 600 }}>Phone</p>
                    <p className="text-sm text-muted-foreground">(555) 987-6543</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-primary" style={{ fontWeight: 600 }}>Office</p>
                    <p className="text-sm text-muted-foreground">123 Innovation Blvd<br />Austin, TX 78701</p>
                  </div>
                </div>
              </div>

              <div className="mt-10 p-6 bg-muted rounded-xl">
                <h3 className="text-primary mb-3" style={{ fontWeight: 600 }}>What to Expect</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" /> 30-minute personalized walkthrough</li>
                  <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" /> Review real workflows mapped to your use case</li>
                  <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" /> Q&A with our product team</li>
                  <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" /> Custom pricing for your team</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
