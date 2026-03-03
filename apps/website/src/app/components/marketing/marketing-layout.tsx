import { Outlet, Link, useLocation } from "react-router";
import { useState } from "react";
import { Menu, X, MessageCircle, Phone, Zap } from "lucide-react";

const navLinks = [
  { to: "/product", label: "Product" },
  { to: "/solutions", label: "Solutions" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
];

export function MarketingLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col font-[Inter,sans-serif]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl text-primary" style={{ fontWeight: 700 }}>SwyftUp</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm transition-colors hover:text-accent ${
                  location.pathname === link.to ? "text-accent" : "text-muted-foreground"
                }`}
                style={{ fontWeight: 500 }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-primary hover:text-accent transition-colors px-4 py-2"
              style={{ fontWeight: 500 }}
            >
              Sign In
            </Link>
            <Link
              to="/contact"
              className="text-sm bg-accent text-white px-5 py-2.5 rounded-lg hover:bg-accent/90 transition-colors"
              style={{ fontWeight: 600 }}
            >
              Book a Demo
            </Link>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-white px-4 pb-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block py-3 text-muted-foreground hover:text-accent"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-3 border-t border-border mt-2">
              <Link to="/login" className="text-center py-2 text-primary" style={{ fontWeight: 500 }}>
                Sign In
              </Link>
              <Link
                to="/contact"
                className="text-center py-2.5 bg-accent text-white rounded-lg"
                style={{ fontWeight: 600 }}
              >
                Book a Demo
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl" style={{ fontWeight: 700 }}>SwyftUp</span>
              </div>
              <p className="text-sm text-primary-foreground/70 mb-4">
                Embedded Chat + Voice for Real Estate. Convert leads faster.
              </p>
              <div className="flex gap-3">
                <MessageCircle className="w-5 h-5 text-accent" />
                <Phone className="w-5 h-5 text-accent" />
              </div>
            </div>

            <div>
              <h4 className="text-sm mb-4" style={{ fontWeight: 600 }}>Product</h4>
              <div className="space-y-2">
                <Link to="/product" className="block text-sm text-primary-foreground/70 hover:text-accent">Features</Link>
                <Link to="/pricing" className="block text-sm text-primary-foreground/70 hover:text-accent">Pricing</Link>
                <Link to="/solutions" className="block text-sm text-primary-foreground/70 hover:text-accent">Solutions</Link>
              </div>
            </div>

            <div>
              <h4 className="text-sm mb-4" style={{ fontWeight: 600 }}>Company</h4>
              <div className="space-y-2">
                <Link to="/about" className="block text-sm text-primary-foreground/70 hover:text-accent">About</Link>
                <Link to="/contact" className="block text-sm text-primary-foreground/70 hover:text-accent">Contact</Link>
              </div>
            </div>

            <div>
              <h4 className="text-sm mb-4" style={{ fontWeight: 600 }}>Legal</h4>
              <div className="space-y-2">
                <Link to="/privacy" className="block text-sm text-primary-foreground/70 hover:text-accent">Privacy Policy</Link>
                <Link to="/terms" className="block text-sm text-primary-foreground/70 hover:text-accent">Terms of Service</Link>
              </div>
            </div>
          </div>

          <div className="border-t border-primary-foreground/20 mt-12 pt-8 text-center text-sm text-primary-foreground/50">
            &copy; 2026 SwyftUp. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
