import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Zap, Eye, EyeOff } from "lucide-react";

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const navigate = useNavigate();

  if (showForgot) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4 font-[Inter,sans-serif]">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 justify-center mb-8">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl text-primary" style={{ fontWeight: 700 }}>SwyftUp</span>
          </Link>
          <h1 className="text-2xl text-primary text-center mb-2" style={{ fontWeight: 700 }}>Forgot Password</h1>
          <p className="text-sm text-muted-foreground text-center mb-8">Enter your email and we'll send you a reset link.</p>
          <form onSubmit={(e) => { e.preventDefault(); setShowForgot(false); }} className="space-y-4">
            <div>
              <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Email</label>
              <input type="email" required className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50" placeholder="agent@brokerage.com" />
            </div>
            <button type="submit" className="w-full bg-accent text-white py-3 rounded-lg hover:bg-accent/90 transition-all" style={{ fontWeight: 600 }}>
              Send Reset Link
            </button>
          </form>
          <button onClick={() => setShowForgot(false)} className="block mx-auto mt-4 text-sm text-accent hover:underline">
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4 font-[Inter,sans-serif]">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl text-primary" style={{ fontWeight: 700 }}>SwyftUp</span>
        </Link>

        <h1 className="text-2xl text-primary text-center mb-2" style={{ fontWeight: 700 }}>Welcome Back</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">Sign in to your agent dashboard</p>

        {/* TODO: Replace with real authentication. This is a placeholder that navigates directly to the dashboard. */}
        <form onSubmit={(e) => { e.preventDefault(); navigate("/app"); }} className="space-y-4">
          <div>
            <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Email</label>
            <input type="email" required className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50" placeholder="agent@brokerage.com" />
          </div>
          <div>
            <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} required className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 pr-12" placeholder="Enter password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
              <input type="checkbox" className="rounded border-border" />
              Remember me
            </label>
            <button type="button" onClick={() => setShowForgot(true)} className="text-sm text-accent hover:underline">
              Forgot password?
            </button>
          </div>
          <button type="submit" className="w-full bg-accent text-white py-3 rounded-lg hover:bg-accent/90 transition-all" style={{ fontWeight: 600 }}>
            Sign In
          </button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          Don't have an account?{" "}
          <Link to="/contact" className="text-accent hover:underline" style={{ fontWeight: 500 }}>Request access</Link>
        </p>
      </div>
    </div>
  );
}
