import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  Phone,
  PhoneCall,
  Plus,
  Server,
  Trash2,
  X,
} from "lucide-react";
import {
  formatCurrency,
  getAddons,
  provisionPhoneNumber,
  releasePhoneNumber,
  createSipTrunk,
  deleteSipTrunk,
  type TenantPhoneNumber,
  type TenantSipTrunk,
} from "../../lib/tenant-admin";

type FormMode = "idle" | "add-phone" | "add-sip";

export function AddonsPage() {
  const [phoneNumbers, setPhoneNumbers] = useState<TenantPhoneNumber[]>([]);
  const [sipTrunks, setSipTrunks] = useState<TenantSipTrunk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>("idle");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Phone number form
  const [phoneValue, setPhoneValue] = useState("");
  const [phoneLabel, setPhoneLabel] = useState("");

  // SIP trunk form
  const [sipName, setSipName] = useState("");
  const [sipHost, setSipHost] = useState("");
  const [sipPort, setSipPort] = useState("5060");
  const [sipTransport, setSipTransport] = useState("udp");
  const [sipUsername, setSipUsername] = useState("");
  const [sipPassword, setSipPassword] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getAddons();
        if (!mounted) return;

        setPhoneNumbers(response.addons.phoneNumbers);
        setSipTrunks(response.addons.sipTrunks);
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load add-ons");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  function resetForm() {
    setFormMode("idle");
    setFormError(null);
    setPhoneValue("");
    setPhoneLabel("");
    setSipName("");
    setSipHost("");
    setSipPort("5060");
    setSipTransport("udp");
    setSipUsername("");
    setSipPassword("");
  }

  async function handleAddPhone(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setFormError(null);

    try {
      const response = await provisionPhoneNumber({
        phoneNumber: phoneValue.trim(),
        label: phoneLabel.trim() || undefined,
      });
      setPhoneNumbers((prev) => [response.phoneNumber, ...prev]);
      resetForm();
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : "Failed to add phone number");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReleasePhone(id: string) {
    try {
      await releasePhoneNumber(id);
      setPhoneNumbers((prev) => prev.filter((p) => p.id !== id));
    } catch (releaseError) {
      setError(releaseError instanceof Error ? releaseError.message : "Failed to release phone number");
    }
  }

  async function handleAddSipTrunk(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setFormError(null);

    try {
      const response = await createSipTrunk({
        name: sipName.trim(),
        host: sipHost.trim(),
        port: Number(sipPort) || 5060,
        transport: sipTransport,
        username: sipUsername.trim() || undefined,
        password: sipPassword || undefined,
      });
      setSipTrunks((prev) => [response.sipTrunk, ...prev]);
      resetForm();
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : "Failed to add SIP trunk");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteSipTrunk(id: string) {
    try {
      await deleteSipTrunk(id);
      setSipTrunks((prev) => prev.filter((t) => t.id !== id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to remove SIP trunk");
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl text-primary flex items-center gap-2" style={{ fontWeight: 700 }}>
          <PhoneCall className="w-6 h-6 text-accent" />
          Add-ons
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Purchase phone numbers and integrate your own SIP or PSTN trunks for telephony.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-warning/5 border border-warning/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
          <div>
            <p className="text-primary text-sm" style={{ fontWeight: 600 }}>Something went wrong</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-xl border border-border p-10 text-center">
          <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading add-ons...</p>
        </div>
      ) : (
        <>
          {/* ── Phone Numbers ─────────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg text-primary flex items-center gap-2" style={{ fontWeight: 600 }}>
                <Phone className="w-5 h-5 text-accent" /> Phone Numbers
              </h2>
              <button
                type="button"
                onClick={() => { resetForm(); setFormMode("add-phone"); }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs text-primary hover:bg-muted"
                style={{ fontWeight: 600 }}
              >
                <Plus className="w-4 h-4" /> Add Number
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Provision phone numbers for inbound/outbound calling and SMS. Numbers are billed as add-ons to your plan.
            </p>

            {formMode === "add-phone" && (
              <form onSubmit={(e) => void handleAddPhone(e)} className="mb-4 rounded-lg border border-accent/30 bg-accent/5 p-4">
                <p className="text-sm text-primary mb-3" style={{ fontWeight: 600 }}>Add a Phone Number</p>
                {formError && (
                  <p className="text-sm text-red-600 mb-3">{formError}</p>
                )}
                <div className="grid sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Phone Number (E.164)</label>
                    <input
                      type="text"
                      value={phoneValue}
                      onChange={(e) => setPhoneValue(e.target.value)}
                      placeholder="+15551234567"
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Label (optional)</label>
                    <input
                      type="text"
                      value={phoneLabel}
                      onChange={(e) => setPhoneLabel(e.target.value)}
                      placeholder="Support line"
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-primary"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-accent text-white px-4 py-2 rounded-lg text-sm disabled:opacity-60"
                    style={{ fontWeight: 600 }}
                  >
                    {isSaving ? "Adding..." : "Add Number"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {phoneNumbers.map((pn) => (
                <div key={pn.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-sm text-primary" style={{ fontWeight: 500 }}>
                      {pn.phoneNumber}
                      {pn.label && <span className="text-muted-foreground ml-2">· {pn.label}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pn.provider} · {formatCurrency(pn.monthlyCostCents, pn.currency)}/mo
                      {pn.capabilities?.voice && " · Voice"}
                      {pn.capabilities?.sms && " · SMS"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded" style={{ fontWeight: 500 }}>
                      {pn.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleReleasePhone(pn.id)}
                      className="text-muted-foreground hover:text-red-600"
                      title="Release number"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {phoneNumbers.length === 0 && formMode !== "add-phone" && (
                <div className="p-6 rounded-lg border border-border text-sm text-muted-foreground text-center">
                  No phone numbers provisioned yet. Click "Add Number" to get started.
                </div>
              )}
            </div>
          </div>

          {/* ── SIP / PSTN Trunks ─────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg text-primary flex items-center gap-2" style={{ fontWeight: 600 }}>
                <Server className="w-5 h-5 text-accent" /> SIP / PSTN Trunks
              </h2>
              <button
                type="button"
                onClick={() => { resetForm(); setFormMode("add-sip"); }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs text-primary hover:bg-muted"
                style={{ fontWeight: 600 }}
              >
                <Plus className="w-4 h-4" /> Add Trunk
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Connect your own SIP provider or PSTN trunk for enterprise-grade telephony integration.
            </p>

            {formMode === "add-sip" && (
              <form onSubmit={(e) => void handleAddSipTrunk(e)} className="mb-4 rounded-lg border border-accent/30 bg-accent/5 p-4">
                <p className="text-sm text-primary mb-3" style={{ fontWeight: 600 }}>Add a SIP Trunk</p>
                {formError && (
                  <p className="text-sm text-red-600 mb-3">{formError}</p>
                )}
                <div className="grid sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Name</label>
                    <input
                      type="text"
                      value={sipName}
                      onChange={(e) => setSipName(e.target.value)}
                      placeholder="Primary SIP Trunk"
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Host</label>
                    <input
                      type="text"
                      value={sipHost}
                      onChange={(e) => setSipHost(e.target.value)}
                      placeholder="sip.provider.com"
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Port</label>
                    <input
                      type="number"
                      value={sipPort}
                      onChange={(e) => setSipPort(e.target.value)}
                      min={1}
                      max={65535}
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Transport</label>
                    <select
                      value={sipTransport}
                      onChange={(e) => setSipTransport(e.target.value)}
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-primary"
                    >
                      <option value="udp">UDP</option>
                      <option value="tcp">TCP</option>
                      <option value="tls">TLS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Username (optional)</label>
                    <input
                      type="text"
                      value={sipUsername}
                      onChange={(e) => setSipUsername(e.target.value)}
                      placeholder="sip_user"
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Password (optional)</label>
                    <input
                      type="password"
                      value={sipPassword}
                      onChange={(e) => setSipPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-primary"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-accent text-white px-4 py-2 rounded-lg text-sm disabled:opacity-60"
                    style={{ fontWeight: 600 }}
                  >
                    {isSaving ? "Adding..." : "Add Trunk"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {sipTrunks.map((trunk) => (
                <div key={trunk.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-sm text-primary" style={{ fontWeight: 500 }}>
                      {trunk.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {trunk.host}:{trunk.port} · {trunk.transport.toUpperCase()}
                      {trunk.username && ` · ${trunk.username}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${trunk.status === "active" ? "bg-green-50 text-green-700" : "bg-muted text-muted-foreground"}`}
                      style={{ fontWeight: 500 }}
                    >
                      {trunk.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleDeleteSipTrunk(trunk.id)}
                      className="text-muted-foreground hover:text-red-600"
                      title="Remove trunk"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {sipTrunks.length === 0 && formMode !== "add-sip" && (
                <div className="p-6 rounded-lg border border-border text-sm text-muted-foreground text-center">
                  No SIP trunks configured. Click "Add Trunk" to connect your own telephony provider.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
