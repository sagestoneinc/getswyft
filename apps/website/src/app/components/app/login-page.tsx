import { useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import { Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { useAuth } from "../../providers/auth-provider";
import { BrandLogo } from "../brand/logo";
import { usePageSeo } from "../../lib/seo";

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const invitedEmail = searchParams.get("email") || "";
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState(invitedEmail);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const { login, requestPasswordReset, supportsPasswordAuth, isAuthenticated, isLoading } = useAuth();

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
    setForgotMessage(null);

    try {
      await login("/app", supportsPasswordAuth ? { email, password } : undefined);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to sign in");
      setSubmitting(false);
      return;
    }

    if (supportsPasswordAuth) {
      setSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    setSubmitting(true);
    setAuthError(null);
    setForgotMessage(null);

    try {
      await requestPasswordReset(email);
      setForgotMessage("Password reset instructions were sent if that email exists in Supabase Auth.");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to request a password reset");
    } finally {
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
          <p className="text-sm text-muted-foreground text-center mb-6">
            {supportsPasswordAuth
              ? "Enter your email and we’ll send a reset link through Supabase Auth."
              : "Password resets are handled by your identity provider."}
          </p>

          {supportsPasswordAuth ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50"
                  placeholder="agent@brokerage.com"
                />
              </div>

              {authError && <p className="text-sm text-destructive">{authError}</p>}
              {forgotMessage && (
                <div className="flex items-start gap-2 rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">
                  <MailCheck className="w-4 h-4 mt-0.5" />
                  <span>{forgotMessage}</span>
                </div>
              )}

              <button
                onClick={() => void handleForgotPassword()}
                disabled={submitting || isLoading}
                className="w-full bg-accent text-white py-3 rounded-lg hover:bg-accent/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ fontWeight: 600 }}
              >
                {(submitting || isLoading) && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Reset Link
              </button>
            </div>
          ) : (
            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground mb-4">
              Use your managed identity provider portal to reset your password, then return here to sign in.
            </div>
          )}

          <button
            onClick={() => {
              setShowForgot(false);
              setAuthError(null);
              setForgotMessage(null);
            }}
            className="w-full mt-4 bg-white border border-border text-primary py-3 rounded-lg hover:bg-muted transition-all"
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
        <p className="text-sm text-muted-foreground text-center mb-8">
          {supportsPasswordAuth ? "Sign in with your Supabase account to access your workspace" : "Sign in to your agent dashboard"}
        </p>

        <form
          onSubmit={async (event) => {
            event.preventDefault();
            await handleSignIn();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="agent@brokerage.com"
            />
          </div>
          <div>
            <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 pr-12"
                placeholder={supportsPasswordAuth ? "Enter your password" : "Continue with your identity provider"}
                disabled={!supportsPasswordAuth}
              />
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
            {supportsPasswordAuth ? "Sign In" : "Continue"}
          </button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          Need access?{" "}
          <Link to="/contact" className="text-accent hover:underline" style={{ fontWeight: 500 }}>Request access</Link>
        </p>
      </div>
    </div>
  );
}
