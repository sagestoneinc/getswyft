import { useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import { Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { useAuth } from "../../providers/auth-provider";
import { BrandLogo } from "../brand/logo";
import { usePageSeo } from "../../lib/seo";
import { formatAuthError } from "../../lib/auth-errors";
import { getSupabaseClient, isSupabaseConfigured } from "../../lib/supabase";

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const invitedEmail = searchParams.get("email") || "";
  const invitedTenant = searchParams.get("tenant") || "";
  const hasInviteLink = Boolean(searchParams.get("invite"));
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState(invitedEmail);
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [socialLoadingProvider, setSocialLoadingProvider] = useState<"google" | "azure" | null>(null);
  const {
    login,
    loginWithSocialProvider,
    requestPasswordReset,
    supportsPasswordAuth,
    supportsSocialAuth,
    isAuthenticated,
    isLoading,
  } = useAuth();
  const recoveryMode = useMemo(() => {
    if (!supportsPasswordAuth) {
      return false;
    }

    const mode = searchParams.get("mode");
    const queryType = searchParams.get("type");
    const hashType =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.hash.replace(/^#/, "")).get("type")
        : null;

    return mode === "reset" || queryType === "recovery" || hashType === "recovery";
  }, [searchParams, supportsPasswordAuth]);

  usePageSeo({
    title: recoveryMode ? "Reset Password | SwyftUp" : showForgot ? "Forgot Password | SwyftUp" : "Login | SwyftUp",
    description: "Secure sign-in for the SwyftUp workspace used by real estate agents and teams.",
    path: "/login",
    noIndex: true,
  });

  if (isAuthenticated && !recoveryMode) {
    return <Navigate to="/app" replace />;
  }

  async function handleSignIn() {
    setSubmitting(true);
    setAuthError(null);
    setForgotMessage(null);

    try {
      await login("/app", supportsPasswordAuth ? { email, password } : undefined);
    } catch (error) {
      setAuthError(formatAuthError(error, "Unable to sign in"));
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
    setResetSuccess(null);

    try {
      await requestPasswordReset(email);
      setForgotMessage("Password reset instructions were sent if that email exists.");
    } catch (error) {
      setAuthError(formatAuthError(error, "Unable to request a password reset"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSocialSignIn(provider: "google" | "azure") {
    setAuthError(null);
    setForgotMessage(null);
    setResetSuccess(null);
    setSocialLoadingProvider(provider);

    try {
      await loginWithSocialProvider(provider, "/app");
    } catch (error) {
      setAuthError(formatAuthError(error, "Unable to sign in with social login"));
      setSocialLoadingProvider(null);
    }
  }

  async function handleCompletePasswordReset() {
    setSubmitting(true);
    setAuthError(null);
    setForgotMessage(null);
    setResetSuccess(null);

    try {
      if (!isSupabaseConfigured()) {
        throw new Error("Supabase environment variables are not configured");
      }

      if (newPassword.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      setResetSuccess("Password updated successfully. You can continue to your workspace.");
      if (typeof window !== "undefined") {
        const cleanUrl = `${window.location.origin}/login`;
        window.history.replaceState({}, document.title, cleanUrl);
      }
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setAuthError(formatAuthError(error, "Unable to reset password"));
    } finally {
      setSubmitting(false);
    }
  }

  if (recoveryMode) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4 font-[Inter,sans-serif]">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <Link to="/" className="flex justify-center mb-8" aria-label="SwyftUp home">
            <BrandLogo size="md" />
          </Link>
          <h1 className="text-2xl text-primary text-center mb-2" style={{ fontWeight: 700 }}>Reset Password</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Enter your new password below to complete account recovery.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50"
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50"
                placeholder="Re-enter password"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="text-sm text-accent hover:underline"
            >
              {showPassword ? "Hide password" : "Show password"}
            </button>

            {authError && <p className="text-sm text-destructive">{authError}</p>}
            {resetSuccess && (
              <div className="flex items-start gap-2 rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">
                <MailCheck className="w-4 h-4 mt-0.5" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <button
              onClick={() => void handleCompletePasswordReset()}
              disabled={submitting || isLoading}
              className="w-full bg-accent text-white py-3 rounded-lg hover:bg-accent/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ fontWeight: 600 }}
            >
              {(submitting || isLoading) && <Loader2 className="w-4 h-4 animate-spin" />}
              Update Password
            </button>

            {resetSuccess && (
              <Link
                to="/app"
                className="w-full mt-2 bg-white border border-border text-primary py-3 rounded-lg hover:bg-muted transition-all text-center block"
                style={{ fontWeight: 600 }}
              >
                Continue to App
              </Link>
            )}
          </div>
        </div>
      </div>
    );
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
              ? "Enter your email and we’ll send a secure reset link."
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
          {supportsPasswordAuth ? "Sign in to access your workspace" : "Sign in to your agent dashboard"}
        </p>

        {hasInviteLink ? (
          <div className="mb-6 rounded-lg border border-accent/20 bg-accent/10 px-3 py-2 text-sm text-accent">
            <p style={{ fontWeight: 600 }}>Invitation link detected</p>
            <p className="mt-1 text-xs">
              {invitedTenant
                ? `Sign in with the invited email to join the ${invitedTenant} workspace.`
                : "Sign in with the invited email to join your workspace."}
            </p>
          </div>
        ) : null}

        {supportsSocialAuth && (
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={() => void handleSocialSignIn("google")}
              disabled={Boolean(socialLoadingProvider) || submitting || isLoading}
              className="w-full bg-white border border-border text-primary py-3 rounded-lg hover:bg-muted transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ fontWeight: 600 }}
            >
              {(socialLoadingProvider === "google" || isLoading) && <Loader2 className="w-4 h-4 animate-spin" />}
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => void handleSocialSignIn("azure")}
              disabled={Boolean(socialLoadingProvider) || submitting || isLoading}
              className="w-full bg-white border border-border text-primary py-3 rounded-lg hover:bg-muted transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ fontWeight: 600 }}
            >
              {(socialLoadingProvider === "azure" || isLoading) && <Loader2 className="w-4 h-4 animate-spin" />}
              Continue with Microsoft / Outlook
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-muted-foreground">or use email</span>
              </div>
            </div>
          </div>
        )}

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

          <button type="submit" disabled={submitting || isLoading || Boolean(socialLoadingProvider)} className="w-full bg-accent text-white py-3 rounded-lg hover:bg-accent/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2" style={{ fontWeight: 600 }}>
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
