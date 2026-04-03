import { useEffect, useState, type FormEvent } from "react";
import {
  fetchRoutingSettings,
  updateRoutingSettings,
  type FallbackCandidate,
  type TenantRoutingSettings,
} from "./api";

export default function RoutingSettingsPage() {
  const [settings, setSettings] = useState<TenantRoutingSettings | null>(null);
  const [fallbackCandidates, setFallbackCandidates] = useState<FallbackCandidate[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRoutingSettings()
      .then((response) => {
        setSettings(response.settings);
        setFallbackCandidates(response.fallbackCandidates);
        setError("");
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Failed to load routing settings");
      });
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!settings) {
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await updateRoutingSettings(settings);
      setSettings(response.settings);
      setFallbackCandidates(response.fallbackCandidates);
      setMessage("Routing settings saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save routing settings");
    } finally {
      setSaving(false);
    }
  }

  function updateField<K extends keyof TenantRoutingSettings>(field: K, value: TenantRoutingSettings[K]) {
    setSettings((current) => (current ? { ...current, [field]: value } : current));
  }

  if (!settings) {
    return (
      <div className="settings-page">
        <p>{error || "Loading routing settings..."}</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <p className="eyebrow">Routing</p>
          <h2>Coverage rules</h2>
        </div>
        <p className="settings-copy">Tune how new conversations are routed when the standalone agent console is managing coverage.</p>
      </div>
      <form onSubmit={handleSave}>
        <label>
          Mode
          <select
            value={settings.routingMode}
            onChange={(e) => updateField("routingMode", e.target.value as TenantRoutingSettings["routingMode"])}
          >
            <option value="manual">Manual</option>
            <option value="first_available">First Available</option>
            <option value="round_robin">Round Robin</option>
          </select>
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={settings.officeHoursEnabled}
            onChange={(e) => updateField("officeHoursEnabled", e.target.checked)}
          />
          Enforce office hours before routing live chats
        </label>

        <label>
          Timezone
          <input
            value={settings.timezone}
            onChange={(e) => updateField("timezone", e.target.value)}
            placeholder="America/New_York"
          />
        </label>

        <label>
          Office hours start
          <input
            type="time"
            value={settings.officeHoursStart}
            onChange={(e) => updateField("officeHoursStart", e.target.value)}
          />
        </label>

        <label>
          Office hours end
          <input
            type="time"
            value={settings.officeHoursEnd}
            onChange={(e) => updateField("officeHoursEnd", e.target.value)}
          />
        </label>

        <label>
          Fallback teammate
          <select
            value={settings.fallbackUserId || ""}
            onChange={(e) => updateField("fallbackUserId", e.target.value || null)}
          >
            <option value="">No fallback</option>
            {fallbackCandidates.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name} ({candidate.email})
              </option>
            ))}
          </select>
        </label>

        <label>
          After-hours message
          <textarea
            value={settings.afterHoursMessage || ""}
            onChange={(e) => updateField("afterHoursMessage", e.target.value)}
            rows={4}
            placeholder="Thanks for reaching out. We'll follow up as soon as office hours reopen."
          />
        </label>

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save settings"}
        </button>
      </form>
    </div>
  );
}
