import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Copy,
  ExternalLink,
  HelpCircle,
  Loader2,
  Save,
  Shield,
  User,
} from "lucide-react";
import { getProfile, type UserProfile, updateProfile } from "../../lib/profile";
import { getSupabaseClient, isSupabaseConfigured } from "../../lib/supabase";
import { useAuth } from "../../providers/auth-provider";
import { useTenant } from "../../providers/tenant-provider";

const fallbackTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Manila";
const timezoneOptions = Array.from(
  new Set([
    fallbackTimezone,
    "Asia/Manila",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
  ]),
);

function splitDisplayName(displayName: string | null | undefined, email: string | null | undefined, metadata: Record<string, unknown>) {
  const firstNameFromMetadata = typeof metadata.firstName === "string" ? metadata.firstName : "";
  const lastNameFromMetadata = typeof metadata.lastName === "string" ? metadata.lastName : "";

  if (firstNameFromMetadata || lastNameFromMetadata) {
    return {
      firstName: firstNameFromMetadata,
      lastName: lastNameFromMetadata,
    };
  }

  const source = (displayName || email || "").trim();
  if (!source) {
    return {
      firstName: "",
      lastName: "",
    };
  }

  const [firstName = "", ...rest] = source.split(/\s+/);
  return {
    firstName,
    lastName: rest.join(" "),
  };
}

function buildInitials(firstName: string, lastName: string, email: string) {
  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.trim();
  if (initials) {
    return initials.toUpperCase();
  }

  return email.slice(0, 2).toUpperCase();
}

export function ProfilePage() {
  const { provider, requestPasswordReset, supportsPasswordAuth, user } = useAuth();
  const { tenant } = useTenant();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState(fallbackTimezone);
  const [locale, setLocale] = useState(typeof navigator !== "undefined" ? navigator.language : "en-US");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);
  const [workspaceCopyStatus, setWorkspaceCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    let mounted = true;

    async function loadCurrentProfile() {
      setIsLoading(true);
      setError(null);

      try {
        const nextProfile = await getProfile();
        if (!mounted) {
          return;
        }

        const metadata =
          nextProfile.metadata && typeof nextProfile.metadata === "object" && !Array.isArray(nextProfile.metadata)
            ? nextProfile.metadata
            : {};
        const names = splitDisplayName(nextProfile.displayName, nextProfile.email, metadata);

        setProfile(nextProfile);
        setFirstName(names.firstName);
        setLastName(names.lastName);
        setPhone(nextProfile.phone || "");
        setTimezone(nextProfile.timezone || fallbackTimezone);
        setLocale(nextProfile.locale || (typeof navigator !== "undefined" ? navigator.language : "en-US"));
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load your profile");
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadCurrentProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const email = profile?.email || user?.email || "";
  const avatarText = useMemo(() => buildInitials(firstName, lastName, email), [email, firstName, lastName]);

  async function handleSave() {
    if (!profile) {
      return;
    }

    const nextFirstName = firstName.trim();
    const nextLastName = lastName.trim();
    const displayName = [nextFirstName, nextLastName].filter(Boolean).join(" ").trim() || profile.displayName || email;

    setIsSaving(true);
    setSaved(false);
    setError(null);
    setPasswordNotice(null);

    try {
      if (provider === "supabase" && isSupabaseConfigured()) {
        const supabase = getSupabaseClient();
        const { error: authError } = await supabase.auth.updateUser({
          data: {
            name: displayName,
            full_name: displayName,
            first_name: nextFirstName || undefined,
            last_name: nextLastName || undefined,
            phone: phone.trim() || undefined,
          },
        });

        if (authError) {
          throw authError;
        }
      }

      const updatedProfile = await updateProfile({
        displayName,
        phone: phone.trim(),
        timezone,
        locale,
        metadata: {
          firstName: nextFirstName,
          lastName: nextLastName,
        },
      });

      setProfile(updatedProfile);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update your profile");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePasswordReset() {
    if (!email) {
      setError("We could not determine your account email");
      return;
    }

    setError(null);
    setPasswordNotice(null);

    try {
      await requestPasswordReset(email);
      setPasswordNotice("Password reset instructions have been sent to your email.");
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : "Failed to send password reset instructions");
    }
  }

  async function handleCopyWorkspaceId() {
    if (!tenant?.id) {
      return;
    }

    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setWorkspaceCopyStatus("failed");
      window.setTimeout(() => setWorkspaceCopyStatus("idle"), 3000);
      return;
    }

    try {
      await navigator.clipboard.writeText(tenant.id);
      setWorkspaceCopyStatus("copied");
      window.setTimeout(() => setWorkspaceCopyStatus("idle"), 2500);
    } catch (_error) {
      setWorkspaceCopyStatus("failed");
      window.setTimeout(() => setWorkspaceCopyStatus("idle"), 3000);
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-xl border border-border p-10 text-center">
          <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
          <div>
            <p className="text-primary text-sm" style={{ fontWeight: 600 }}>Profile unavailable</p>
            <p className="text-sm text-muted-foreground">{error || "We couldn't load your profile right now."}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl text-primary" style={{ fontWeight: 700 }}>Profile & Account</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your identity, workspace defaults, and account recovery.</p>
      </div>

      {saved && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4" /> Profile saved successfully.
        </div>
      )}

      {error && (
        <div className="mb-6 bg-warning/5 border border-warning/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
          <div>
            <p className="text-primary text-sm" style={{ fontWeight: 600 }}>Profile update needs attention</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {passwordNotice && (
        <div className="mb-6 bg-accent/10 border border-accent/20 text-accent px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4" /> {passwordNotice}
        </div>
      )}

      {tenant ? (
        <div className="bg-white rounded-xl border border-border p-6 mb-6">
          <h2 className="text-lg text-primary mb-2 flex items-center gap-2" style={{ fontWeight: 600 }}>
            <Shield className="w-5 h-5 text-accent" /> Workspace
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Use this Workspace ID for widget setup (`VITE_SWYFT_WIDGET_WORKSPACE_ID`).
          </p>

          <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Workspace ID</label>
              <input
                type="text"
                readOnly
                value={tenant.id}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted/60 text-sm text-primary"
              />
            </div>
            <button
              type="button"
              onClick={() => void handleCopyWorkspaceId()}
              className="h-[42px] px-4 rounded-lg border border-border text-sm text-primary hover:bg-muted flex items-center justify-center gap-2"
              style={{ fontWeight: 600 }}
            >
              <Copy className="w-4 h-4" />
              Copy ID
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-xs text-muted-foreground">Workspace slug</p>
              <p className="text-sm text-primary mt-1" style={{ fontWeight: 500 }}>{tenant.slug}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Workspace name</p>
              <p className="text-sm text-primary mt-1" style={{ fontWeight: 500 }}>{tenant.name}</p>
            </div>
          </div>

          {workspaceCopyStatus === "copied" ? (
            <p className="text-xs text-accent mt-3">Workspace ID copied to clipboard.</p>
          ) : null}
          {workspaceCopyStatus === "failed" ? (
            <p className="text-xs text-warning mt-3">Copy failed. Please copy the Workspace ID manually.</p>
          ) : null}
        </div>
      ) : null}

      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h2 className="text-lg text-primary mb-6 flex items-center gap-2" style={{ fontWeight: 600 }}>
          <User className="w-5 h-5 text-accent" /> Personal Information
        </h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-white text-xl" style={{ fontWeight: 700 }}>
            {avatarText}
          </div>
          <div>
            <p className="text-sm text-primary" style={{ fontWeight: 600 }}>{profile.displayName || email}</p>
            <p className="text-xs text-muted-foreground">Avatar uploads are next on the roadmap.</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted/60 text-sm text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">Email changes are handled through your authentication provider.</p>
          </div>
          <div>
            <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
              placeholder="+63 912 345 6789"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Timezone</label>
              <select
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
              >
                {timezoneOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Locale</label>
              <input
                type="text"
                value={locale}
                onChange={(event) => setLocale(event.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
                placeholder="en-US"
              />
            </div>
          </div>
        </div>
        <button
          onClick={() => void handleSave()}
          disabled={isSaving}
          className="mt-6 bg-accent text-white px-6 py-2.5 rounded-lg hover:bg-accent/90 transition-all flex items-center gap-2 text-sm disabled:opacity-60"
          style={{ fontWeight: 600 }}
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h2 className="text-lg text-primary mb-4 flex items-center gap-2" style={{ fontWeight: 600 }}>
          <Shield className="w-5 h-5 text-accent" /> Security
        </h2>
        <div className="space-y-3">
          <button
            onClick={() => void handlePasswordReset()}
            className="w-full text-left p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-sm flex items-center justify-between"
          >
            <span>Change password</span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </button>
          <button className="w-full text-left p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-sm flex items-center justify-between" disabled>
            <span>Two-factor authentication</span>
            <span className="text-xs text-muted-foreground">Coming soon</span>
          </button>
          <div className="text-xs text-muted-foreground">
            {supportsPasswordAuth
              ? "We’ll email you a secure password reset link."
              : "Security settings are managed by your identity provider."}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-lg text-primary mb-4 flex items-center gap-2" style={{ fontWeight: 600 }}>
          <HelpCircle className="w-5 h-5 text-accent" /> Help & Support
        </h2>
        <div className="space-y-3">
          <a href="/contact" className="block p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-sm flex items-center justify-between">
            <span>Contact Support</span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </a>
          <a href="/privacy" className="block p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-sm flex items-center justify-between">
            <span>Privacy Policy</span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </a>
          <a href="/terms" className="block p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-sm flex items-center justify-between">
            <span>Terms of Service</span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </a>
        </div>
      </div>
    </div>
  );
}
