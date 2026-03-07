import { useEffect, useMemo, useState } from "react";
import { Settings, Clock, Users, CheckCircle, Save, Loader2, AlertTriangle, MessageSquare } from "lucide-react";
import {
  getTenantSettings,
  updateTenantSettings,
  type FallbackCandidate,
  type TenantRoutingSettings,
} from "../../lib/tenant-admin";

const timezoneOptions = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Asia/Manila",
];

const routingModes: Array<{
  id: TenantRoutingSettings["routingMode"];
  label: string;
  description: string;
}> = [
  { id: "manual", label: "Manual", description: "Admins manually assign new conversations to the right teammate." },
  { id: "first_available", label: "First Available", description: "Route to the first online agent available inside office hours." },
  { id: "round_robin", label: "Round Robin", description: "Distribute new conversations evenly across the available team." },
];

export function RoutingPage() {
  const [settings, setSettings] = useState<TenantRoutingSettings | null>(null);
  const [fallbackCandidates, setFallbackCandidates] = useState<FallbackCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getTenantSettings();
        if (!mounted) {
          return;
        }

        setSettings(response.settings);
        setFallbackCandidates(response.fallbackCandidates);
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load routing settings");
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  const timezoneChoices = useMemo(() => {
    const selectedTimezone = settings?.timezone;
    if (!selectedTimezone || timezoneOptions.includes(selectedTimezone)) {
      return timezoneOptions;
    }

    return [selectedTimezone, ...timezoneOptions];
  }, [settings?.timezone]);

  async function handleSave() {
    if (!settings) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaved(false);

    try {
      const response = await updateTenantSettings(settings);
      setSettings(response.settings);
      setFallbackCandidates(response.fallbackCandidates);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save routing settings");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || !settings) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-xl border border-border p-10 text-center">
          <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading tenant routing rules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl text-primary" style={{ fontWeight: 700 }}>Routing Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Control assignment mode, office hours, and your after-hours fallback flow.</p>
      </div>

      {saved && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4" /> Routing settings saved successfully.
        </div>
      )}

      {error && (
        <div className="mb-6 bg-warning/5 border border-warning/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
          <div>
            <p className="text-primary text-sm" style={{ fontWeight: 600 }}>Routing workspace needs attention</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h2 className="text-lg text-primary mb-4 flex items-center gap-2" style={{ fontWeight: 600 }}>
          <Settings className="w-5 h-5 text-accent" /> Assignment strategy
        </h2>
        <div className="space-y-3">
          {routingModes.map((mode) => (
            <label
              key={mode.id}
              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                settings.routingMode === mode.id ? "border-accent bg-accent/5" : "border-border hover:border-accent/30"
              }`}
            >
              <input
                type="radio"
                name="routingMode"
                value={mode.id}
                checked={settings.routingMode === mode.id}
                onChange={(event) => setSettings((current) => current ? { ...current, routingMode: event.target.value as TenantRoutingSettings["routingMode"] } : current)}
                className="mt-1 accent-[#14b8a6]"
              />
              <div>
                <p className="text-sm text-primary" style={{ fontWeight: 600 }}>{mode.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{mode.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg text-primary flex items-center gap-2" style={{ fontWeight: 600 }}>
            <Clock className="w-5 h-5 text-accent" /> Office hours
          </h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-muted-foreground">{settings.officeHoursEnabled ? "Enabled" : "Disabled"}</span>
            <button
              type="button"
              onClick={() => setSettings((current) => current ? { ...current, officeHoursEnabled: !current.officeHoursEnabled } : current)}
              className={`w-11 h-6 rounded-full transition-colors relative ${settings.officeHoursEnabled ? "bg-accent" : "bg-switch-background"}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${settings.officeHoursEnabled ? "left-5.5" : "left-0.5"}`} />
            </button>
          </label>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Timezone</label>
            <select
              value={settings.timezone}
              onChange={(event) => setSettings((current) => current ? { ...current, timezone: event.target.value } : current)}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
            >
              {timezoneChoices.map((timezone) => (
                <option key={timezone} value={timezone}>{timezone}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Start</label>
              <input
                type="time"
                value={settings.officeHoursStart}
                onChange={(event) => setSettings((current) => current ? { ...current, officeHoursStart: event.target.value } : current)}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>End</label>
              <input
                type="time"
                value={settings.officeHoursEnd}
                onChange={(event) => setSettings((current) => current ? { ...current, officeHoursEnd: event.target.value } : current)}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h2 className="text-lg text-primary mb-4 flex items-center gap-2" style={{ fontWeight: 600 }}>
          <Users className="w-5 h-5 text-accent" /> Fallback owner
        </h2>
        <p className="text-sm text-muted-foreground mb-3">Choose who should receive attention first when a conversation needs a human fallback.</p>
        <select
          value={settings.fallbackUserId || ""}
          onChange={(event) => setSettings((current) => current ? { ...current, fallbackUserId: event.target.value || null } : current)}
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
        >
          <option value="">No fallback owner</option>
          {fallbackCandidates.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.name} ({candidate.role})
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h2 className="text-lg text-primary mb-4 flex items-center gap-2" style={{ fontWeight: 600 }}>
          <MessageSquare className="w-5 h-5 text-accent" /> After-hours response
        </h2>
        <textarea
          rows={4}
          value={settings.afterHoursMessage}
          onChange={(event) => setSettings((current) => current ? { ...current, afterHoursMessage: event.target.value } : current)}
          className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm resize-y"
          placeholder="Let visitors know what happens after business hours."
        />
      </div>

      <button
        type="button"
        disabled={isSaving}
        onClick={handleSave}
        className="w-full bg-accent text-white py-3 rounded-lg hover:bg-accent/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        style={{ fontWeight: 600 }}
      >
        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {isSaving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
