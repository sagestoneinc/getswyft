import { useState } from "react";
import { Link, Navigate } from "react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../../providers/auth-provider";
import { BrandLogo } from "../brand/logo";
import { usePageSeo } from "../../lib/seo";

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { login, isAuthenticated, isLoading } = useAuth();

  usePageSeo({
    title: showForgot ? "Forgot Password | SwyftUp" : "Login | SwyftUp",
    description: "Secure sign-in for the SwyftUp workspace used by real estate agents and teams.",
    path: "/login",
    noIndex: true,
  });

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  async function handleSignIn() {
    setSubmitting(true);
    setAuthError(null);

    try {
      await login("/app");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to sign in");
      setSubmitting(false);
    }
  }

  if (showForgot) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4 font-[Inter,sans-serif]">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <Link to="/" className="flex justify-center mb-8" aria-label="SwyftUp home">
            <BrandLogo size="md" />
          </Link>
          <h1 className="text-2xl text-primary text-center mb-2" style={{ fontWeight: 700 }}>Forgot Password</h1>
          <p className="text-sm text-muted-foreground text-center mb-8">Password resets are handled by your identity provider.</p>
          <button
            onClick={() => setShowForgot(false)}
            className="w-full bg-accent text-white py-3 rounded-lg hover:bg-accent/90 transition-all"
            style={{ fontWeight: 600 }}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4 font-[Inter,sans-serif]">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <Link to="/" className="flex justify-center mb-8" aria-label="SwyftUp home">
          <BrandLogo size="md" />
        </Link>

        <h1 className="text-2xl text-primary text-center mb-2" style={{ fontWeight: 700 }}>Welcome Back</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">Sign in to your agent dashboard</p>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await handleSignIn();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Email</label>
            <input type="email" className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50" placeholder="agent@brokerage.com" />
          </div>
          <div>
            <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 pr-12" placeholder="Enter password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {authError && <p className="text-sm text-destructive">{authError}</p>}

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
              <input type="checkbox" className="rounded border-border" />
              Remember me
            </label>
            <button type="button" onClick={() => setShowForgot(true)} className="text-sm text-accent hover:underline">
              Forgot password?
            </button>
          </div>

          <button type="submit" disabled={submitting || isLoading} className="w-full bg-accent text-white py-3 rounded-lg hover:bg-accent/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2" style={{ fontWeight: 600 }}>
            {(submitting || isLoading) && <Loader2 className="w-4 h-4 animate-spin" />}
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
