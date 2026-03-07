import { useEffect, useMemo, useState } from "react";
import { Bot, Loader2, Plus, RefreshCw, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { deleteAiConfig, listAiConfigs, upsertAiConfig, type AIConfigItem } from "../../lib/operations";

const defaultConfigText = '{\n  "model": "gpt-4o-mini",\n  "temperature": 0.2\n}';

function prettyJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "{}";
  }
}

export function AiPage() {
  const [configs, setConfigs] = useState<AIConfigItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [key, setKey] = useState("CHATBOT");
  const [provider, setProvider] = useState("openai");
  const [configText, setConfigText] = useState(defaultConfigText);
  const [isEnabled, setIsEnabled] = useState(true);

  async function loadConfigs() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listAiConfigs();
      setConfigs(response.configs || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load AI config");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadConfigs();
  }, []);

  async function handleSaveConfig() {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const parsed = JSON.parse(configText);
      await upsertAiConfig({
        key,
        provider,
        config: parsed,
        isEnabled,
      });
      setSuccess(`Saved ${key} configuration.`);
      await loadConfigs();
    } catch (saveError) {
      if (saveError instanceof SyntaxError) {
        setError("Config JSON is invalid.");
      } else {
        setError(saveError instanceof Error ? saveError.message : "Failed to save AI config");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteConfig(configKey: string) {
    setError(null);
    setSuccess(null);

    try {
      await deleteAiConfig(configKey);
      setConfigs((current) => current.filter((entry) => entry.key !== configKey));
      setSuccess(`Deleted ${configKey}.`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete AI config");
    }
  }

  const sortedConfigs = useMemo(
    () => [...configs].sort((left, right) => left.key.localeCompare(right.key)),
    [configs],
  );

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl text-primary flex items-center gap-2" style={{ fontWeight: 700 }}>
            <Bot className="w-6 h-6 text-accent" /> AI Config
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Configure tenant AI providers and enable runtime modes.</p>
        </div>

        <button
          type="button"
          onClick={() => void loadConfigs()}
          className="px-3 py-2 rounded-lg border border-border bg-white hover:bg-muted text-sm inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error ? (
        <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      ) : null}

      {success ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-700 mt-0.5" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      ) : null}

      <div className="bg-white border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-base text-primary" style={{ fontWeight: 650 }}>Upsert Configuration</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm text-primary" style={{ fontWeight: 500 }}>
            Key
            <input
              value={key}
              onChange={(event) => setKey(event.target.value.toUpperCase())}
              className="mt-1.5 w-full px-3 py-2 rounded-lg border border-border bg-input-background"
              placeholder="CHATBOT"
            />
          </label>

          <label className="text-sm text-primary" style={{ fontWeight: 500 }}>
            Provider
            <input
              value={provider}
              onChange={(event) => setProvider(event.target.value)}
              className="mt-1.5 w-full px-3 py-2 rounded-lg border border-border bg-input-background"
              placeholder="openai"
            />
          </label>
        </div>

        <label className="text-sm text-primary block" style={{ fontWeight: 500 }}>
          Config JSON
          <textarea
            rows={8}
            value={configText}
            onChange={(event) => setConfigText(event.target.value)}
            className="mt-1.5 w-full px-3 py-2 rounded-lg border border-border bg-input-background font-mono text-xs"
          />
        </label>

        <label className="inline-flex items-center gap-2 text-sm text-primary" style={{ fontWeight: 500 }}>
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(event) => setIsEnabled(event.target.checked)}
            className="accent-[#14b8a6]"
          />
          Enabled
        </label>

        <button
          type="button"
          onClick={() => void handleSaveConfig()}
          disabled={isSaving}
          className="px-4 py-2.5 rounded-lg bg-accent text-white hover:bg-accent/90 text-sm inline-flex items-center gap-2 disabled:opacity-60"
          style={{ fontWeight: 600 }}
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Save Config
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white border border-border rounded-xl p-10 text-center">
          <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading AI configs...</p>
        </div>
      ) : sortedConfigs.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-10 text-center">
          <Bot className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No AI configuration yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl divide-y divide-border">
          {sortedConfigs.map((entry) => (
            <div key={entry.id} className="p-4 md:p-5 flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <p className="text-sm text-primary" style={{ fontWeight: 650 }}>
                  {entry.key}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Provider: {entry.provider} · Enabled: {entry.isEnabled ? "yes" : "no"}</p>
                <pre className="text-xs text-muted-foreground mt-2 bg-muted rounded-lg p-2 overflow-x-auto">
                  {prettyJson(entry.config)}
                </pre>
              </div>

              <button
                type="button"
                onClick={() => void handleDeleteConfig(entry.key)}
                className="px-3 py-2 rounded-lg border border-border bg-white hover:bg-muted text-xs inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
