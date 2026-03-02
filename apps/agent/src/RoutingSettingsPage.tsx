import { useEffect, useState, type FormEvent } from "react";
import { fetchRoutingSettings, updateRoutingSettings, type RoutingSettings } from "./api";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

interface Props {
  token: string;
}

export default function RoutingSettingsPage({ token }: Props) {
  const [settings, setSettings] = useState<RoutingSettings | null>(null);
  const [mode, setMode] = useState("first_available");
  const [timezone, setTimezone] = useState("Asia/Manila");
  const [officeHours, setOfficeHours] = useState<Record<string, { start: string; end: string }>>({});
  const [fallbackAgentId, setFallbackAgentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchRoutingSettings(token)
      .then((s) => {
        setSettings(s);
        setMode(s.mode);
        setTimezone(s.timezone);
        setOfficeHours(s.officeHours || {});
        setFallbackAgentId(s.fallbackAgentId || "");
      })
      .catch(() => setMessage("Failed to load settings"));
  }, [token]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const updated = await updateRoutingSettings(token, {
        mode,
        timezone,
        officeHours,
        fallbackAgentId: fallbackAgentId || null,
      });
      setSettings(updated);
      setMessage("Settings saved!");
    } catch {
      setMessage("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  function updateDayHours(day: string, field: "start" | "end", value: string) {
    setOfficeHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  }

  function toggleDay(day: string, enabled: boolean) {
    if (enabled) {
      setOfficeHours((prev) => ({
        ...prev,
        [day]: { start: "09:00", end: "18:00" },
      }));
    } else {
      setOfficeHours((prev) => {
        const next = { ...prev };
        delete next[day];
        return next;
      });
    }
  }

  if (!settings) {
    return <div className="settings-page"><p>Loading settings…</p></div>;
  }

  return (
    <div className="settings-page">
      <h2>Routing Settings</h2>
      <form onSubmit={handleSave}>
        <label>
          Mode
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="manual">Manual</option>
            <option value="first_available">First Available</option>
            <option value="round_robin">Round Robin</option>
          </select>
        </label>

        <label>
          Timezone
          <input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="Asia/Manila" />
        </label>

        <label>
          Fallback Agent ID
          <input value={fallbackAgentId} onChange={(e) => setFallbackAgentId(e.target.value)} placeholder="Agent ID (optional)" />
        </label>

        <fieldset>
          <legend>Office Hours</legend>
          {DAYS.map((day) => {
            const enabled = !!officeHours[day];
            return (
              <div key={day} className="office-hours-row">
                <label className="day-toggle">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => toggleDay(day, e.target.checked)}
                  />
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </label>
                {enabled && (
                  <>
                    <input
                      type="time"
                      value={officeHours[day]?.start || "09:00"}
                      onChange={(e) => updateDayHours(day, "start", e.target.value)}
                    />
                    <span>to</span>
                    <input
                      type="time"
                      value={officeHours[day]?.end || "18:00"}
                      onChange={(e) => updateDayHours(day, "end", e.target.value)}
                    />
                  </>
                )}
              </div>
            );
          })}
        </fieldset>

        {message && <p className={message.includes("Failed") ? "error" : "success"}>{message}</p>}

        <button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
