import { useState } from "react";
import { Settings, Clock, Users, CheckCircle, Save } from "lucide-react";
import { agents } from "./mock-data";

export function RoutingPage() {
  const [routingMode, setRoutingMode] = useState("round_robin");
  const [officeHoursEnabled, setOfficeHoursEnabled] = useState(true);
  const [timezone, setTimezone] = useState("America/Chicago");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [fallbackAgent, setFallbackAgent] = useState("1");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const routingModes = [
    { id: "manual", label: "Manual", description: "Admins manually assign conversations to agents." },
    { id: "first_available", label: "First Available", description: "Route to the first agent who is online and available." },
    { id: "round_robin", label: "Round Robin", description: "Distribute conversations evenly across online agents." },
  ];

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl text-primary" style={{ fontWeight: 700 }}>Routing Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure how conversations are routed to agents</p>
      </div>

      {saved && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4" /> Settings saved successfully!
        </div>
      )}

      {/* Routing Mode */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h2 className="text-lg text-primary mb-4 flex items-center gap-2" style={{ fontWeight: 600 }}>
          <Settings className="w-5 h-5 text-accent" /> Routing Mode
        </h2>
        <div className="space-y-3">
          {routingModes.map((mode) => (
            <label
              key={mode.id}
              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                routingMode === mode.id ? "border-accent bg-accent/5" : "border-border hover:border-accent/30"
              }`}
            >
              <input
                type="radio"
                name="routing"
                value={mode.id}
                checked={routingMode === mode.id}
                onChange={(e) => setRoutingMode(e.target.value)}
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

      {/* Office Hours */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg text-primary flex items-center gap-2" style={{ fontWeight: 600 }}>
            <Clock className="w-5 h-5 text-accent" /> Office Hours
          </h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-muted-foreground">{officeHoursEnabled ? "Enabled" : "Disabled"}</span>
            <button
              onClick={() => setOfficeHoursEnabled(!officeHoursEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative ${officeHoursEnabled ? "bg-accent" : "bg-switch-background"}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${officeHoursEnabled ? "left-5.5" : "left-0.5"}`} />
            </button>
          </label>
        </div>

        {officeHoursEnabled && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
              >
                <option value="America/New_York">Eastern (ET)</option>
                <option value="America/Chicago">Central (CT)</option>
                <option value="America/Denver">Mountain (MT)</option>
                <option value="America/Los_Angeles">Pacific (PT)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Start</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>End</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Outside of office hours, visitors will see an after-hours lead capture form.</p>
          </div>
        )}
      </div>

      {/* Fallback Agent */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h2 className="text-lg text-primary mb-4 flex items-center gap-2" style={{ fontWeight: 600 }}>
          <Users className="w-5 h-5 text-accent" /> Fallback Agent
        </h2>
        <p className="text-sm text-muted-foreground mb-3">When no agents are available, route conversations to this agent.</p>
        <select
          value={fallbackAgent}
          onChange={(e) => setFallbackAgent(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
        >
          {agents.map((a) => (
            <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-accent text-white py-3 rounded-lg hover:bg-accent/90 transition-all flex items-center justify-center gap-2"
        style={{ fontWeight: 600 }}
      >
        <Save className="w-5 h-5" /> Save Settings
      </button>
    </div>
  );
}
