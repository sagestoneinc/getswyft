import { useState, type FormEvent } from "react";

interface Props {
  provider: "keycloak" | "supabase";
  supportsPasswordAuth: boolean;
  isLoading: boolean;
  authError: string | null;
  onLogin: (credentials?: { email: string; password: string }) => Promise<void>;
}

export default function LoginPage({
  provider,
  supportsPasswordAuth,
  isLoading,
  authError,
  onLogin,
}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onLogin(supportsPasswordAuth ? { email, password } : undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <form onSubmit={handleSubmit} className="login-form">
        <p className="eyebrow">Getswyft Agent Console</p>
        <h1>Stay on the live conversation.</h1>
        <p className="login-copy">
          Sign in with the same identity provider your workspace already uses so API calls and realtime updates share one valid session.
        </p>
        {(authError || error) && <p className="error">{authError || error}</p>}

        {supportsPasswordAuth ? (
          <>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@brokerage.com"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </label>
            <button type="submit" disabled={loading || isLoading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </>
        ) : (
          <>
            <div className="provider-pill">Provider: {provider}</div>
            <button type="submit" disabled={loading || isLoading}>
              {loading ? "Redirecting..." : "Continue to secure sign in"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
