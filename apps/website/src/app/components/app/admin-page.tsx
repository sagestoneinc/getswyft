import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Shield, Plus, Save, UserMinus } from "lucide-react";
import { getTeamState, removeTeamMember, updateTeamMemberRole, type TeamMember } from "../../lib/team";
import { createTenant, getBillingWorkspace, getTenantSettings, getWebhookWorkspace } from "../../lib/tenant-admin";
import { getAuthMemberships, getSystemAlerts, type RequestAlertsSnapshot, type TenantMembershipItem } from "../../lib/operations";

type AdminSnapshot = {
  memberships: TenantMembershipItem[];
  activeTenantSlug: string | null;
  alerts: RequestAlertsSnapshot | null;
  teamCount: number;
  pendingInvites: number;
  webhookCount: number;
  failingWebhooks: number;
  billingPlan: string;
  routingMode: string;
  timezone: string;
  teamMembers: TeamMember[];
};

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function AdminPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<AdminSnapshot | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [tenantNameDraft, setTenantNameDraft] = useState("");
  const [tenantSlugDraft, setTenantSlugDraft] = useState("");
  const [tenantActionMessage, setTenantActionMessage] = useState<string | null>(null);
  const [isCreatingTenant, setIsCreatingTenant] = useState(false);
  const [isUpdatingMemberId, setIsUpdatingMemberId] = useState<string | null>(null);
  const [memberRoleDrafts, setMemberRoleDrafts] = useState<Record<string, "admin" | "agent">>({});

  async function loadSnapshot() {
    setError(null);

    const [membershipsRes, alertsRes, teamRes, webhooksRes, billingRes, settingsRes] = await Promise.allSettled([
      getAuthMemberships(),
      getSystemAlerts(),
      getTeamState(),
      getWebhookWorkspace(),
      getBillingWorkspace(),
      getTenantSettings(),
    ]);

    if (
      membershipsRes.status === "rejected" &&
      alertsRes.status === "rejected" &&
      teamRes.status === "rejected" &&
      webhooksRes.status === "rejected" &&
      billingRes.status === "rejected" &&
      settingsRes.status === "rejected"
    ) {
      throw new Error("Unable to load admin workspace");
    }

    const memberships = membershipsRes.status === "fulfilled" ? membershipsRes.value.memberships : [];
    const activeTenantSlug = membershipsRes.status === "fulfilled" ? membershipsRes.value.activeTenant?.tenantSlug || null : null;
    const alerts = alertsRes.status === "fulfilled" ? alertsRes.value.alerts : null;
    const teamCount = teamRes.status === "fulfilled" ? teamRes.value.members.length : 0;
    const pendingInvites = teamRes.status === "fulfilled" ? teamRes.value.invitations.length : 0;
    const teamMembers = teamRes.status === "fulfilled" ? teamRes.value.members : [];
    const webhookCount = webhooksRes.status === "fulfilled" ? webhooksRes.value.endpoints.length : 0;
    const failingWebhooks =
      webhooksRes.status === "fulfilled"
        ? webhooksRes.value.deliveries.filter((delivery) => delivery.status === "failed").length
        : 0;
    const billingPlan = billingRes.status === "fulfilled" ? billingRes.value.billing.subscription?.planName || "No plan" : "Unavailable";
    const routingMode = settingsRes.status === "fulfilled" ? settingsRes.value.settings.routingMode : "unknown";
    const timezone = settingsRes.status === "fulfilled" ? settingsRes.value.settings.timezone : "unknown";

    setSnapshot({
      memberships,
      activeTenantSlug,
      alerts,
      teamCount,
      pendingInvites,
      webhookCount,
      failingWebhooks,
      billingPlan,
      routingMode,
      timezone,
      teamMembers,
    });
    setLastUpdated(new Date().toISOString());
  }

  useEffect(() => {
    let mounted = true;

    async function init() {
      setIsLoading(true);
      try {
        await loadSnapshot();
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load admin workspace");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void init();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!snapshot?.teamMembers?.length) {
      setMemberRoleDrafts({});
      return;
    }

    setMemberRoleDrafts(
      Object.fromEntries(snapshot.teamMembers.map((member) => [member.id, member.role])),
    );
  }, [snapshot?.teamMembers]);

  const readinessBadge = useMemo(() => {
    if (!snapshot?.alerts) {
      return {
        label: "Unknown",
        className: "bg-slate-100 text-slate-700",
      };
    }

    if (snapshot.alerts.ready) {
      return {
        label: "Healthy",
        className: "bg-green-50 text-green-700",
      };
    }

    return {
      label: "Degraded",
      className: "bg-amber-50 text-amber-700",
    };
  }, [snapshot?.alerts]);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await loadSnapshot();
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Unable to refresh admin workspace");
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleCreateTenant() {
    if (!tenantNameDraft.trim()) {
      setError("Tenant name is required");
      return;
    }

    setIsCreatingTenant(true);
    setError(null);
    setTenantActionMessage(null);

    try {
      const response = await createTenant({
        name: tenantNameDraft.trim(),
        slug: tenantSlugDraft.trim() || undefined,
      });
      setTenantActionMessage(`Tenant "${response.tenant.name}" created (${response.tenant.slug}).`);
      setTenantNameDraft("");
      setTenantSlugDraft("");
      await loadSnapshot();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create tenant");
    } finally {
      setIsCreatingTenant(false);
    }
  }

  async function handleSaveMemberRole(memberId: string) {
    const role = memberRoleDrafts[memberId];
    if (!role || !snapshot) {
      return;
    }

    setIsUpdatingMemberId(memberId);
    setError(null);
    try {
      const response = await updateTeamMemberRole(memberId, { role });
      setSnapshot({
        ...snapshot,
        teamMembers: snapshot.teamMembers.map((member) => (member.id === response.member.id ? response.member : member)),
      });
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update member role");
    } finally {
      setIsUpdatingMemberId(null);
    }
  }

  async function handleRevokeMember(memberId: string) {
    if (!snapshot) {
      return;
    }
    const targetMember = snapshot.teamMembers.find((member) => member.id === memberId);
    const shouldContinue = window.confirm(`Remove ${targetMember?.name || "this member"} from the current tenant?`);
    if (!shouldContinue) {
      return;
    }

    setIsUpdatingMemberId(memberId);
    setError(null);
    try {
      await removeTeamMember(memberId);
      const nextMembers = snapshot.teamMembers.filter((member) => member.id !== memberId);
      setSnapshot({
        ...snapshot,
        teamMembers: nextMembers,
        teamCount: nextMembers.length,
      });
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Unable to revoke team member");
    } finally {
      setIsUpdatingMemberId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-white border border-border rounded-xl p-10 text-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading admin controls...</p>
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
          <div>
            <p className="text-sm text-primary" style={{ fontWeight: 600 }}>Admin workspace unavailable</p>
            <p className="text-sm text-muted-foreground">{error || "Unable to load workspace snapshot."}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl text-primary flex items-center gap-2" style={{ fontWeight: 700 }}>
            <Shield className="w-6 h-6 text-accent" />
            Admin Control Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tenant operations, system health alerts, and Phase 2 readiness in one place.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm text-primary hover:bg-muted disabled:opacity-60"
          style={{ fontWeight: 600 }}
        >
          {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <section className="bg-white border border-border rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">System Health</p>
          <p className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs ${readinessBadge.className}`}>
            {snapshot.alerts?.ready ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {readinessBadge.label}
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            {snapshot.alerts
              ? `${snapshot.alerts.serverErrors} server errors from ${snapshot.alerts.totalRequests} requests (${formatPercent(snapshot.alerts.errorRate)}).`
              : "No request monitor data available yet."}
          </p>
        </section>

        <section className="bg-white border border-border rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Tenant Access</p>
          <p className="text-lg text-primary" style={{ fontWeight: 700 }}>
            {snapshot.memberships.length}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Accessible tenants. Active tenant: <span className="text-primary">{snapshot.activeTenantSlug || "none"}</span>
          </p>
        </section>

        <section className="bg-white border border-border rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Team Readiness</p>
          <p className="text-lg text-primary" style={{ fontWeight: 700 }}>
            {snapshot.teamCount}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Team members, {snapshot.pendingInvites} pending invitation(s).
          </p>
        </section>

        <section className="bg-white border border-border rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Webhook Health</p>
          <p className="text-lg text-primary" style={{ fontWeight: 700 }}>
            {snapshot.webhookCount}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Endpoints configured, {snapshot.failingWebhooks} failed delivery event(s).
          </p>
        </section>

        <section className="bg-white border border-border rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Billing Plan</p>
          <p className="text-lg text-primary" style={{ fontWeight: 700 }}>
            {snapshot.billingPlan}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Current tenant subscription plan.</p>
        </section>

        <section className="bg-white border border-border rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Routing Policy</p>
          <p className="text-lg text-primary" style={{ fontWeight: 700 }}>
            {snapshot.routingMode}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Timezone: {snapshot.timezone}</p>
        </section>
      </div>

      <section className="bg-white border border-border rounded-xl p-4">
        <p className="text-sm text-primary mb-3" style={{ fontWeight: 600 }}>Failing Endpoints</p>
        {snapshot.alerts?.topFailingEndpoints?.length ? (
          <div className="space-y-2">
            {snapshot.alerts.topFailingEndpoints.map((endpoint) => (
              <div key={`${endpoint.method}-${endpoint.path}`} className="rounded-lg border border-border px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-primary" style={{ fontWeight: 600 }}>
                    {endpoint.method} {endpoint.path}
                  </p>
                  <span className="text-xs text-muted-foreground">{endpoint.count} error(s)</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last status {endpoint.lastStatusCode} at {new Date(endpoint.lastSeenAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No failing endpoints detected in the current monitor window.</p>
        )}
      </section>

      <section className="bg-white border border-border rounded-xl p-4 space-y-3">
        <p className="text-sm text-primary" style={{ fontWeight: 600 }}>Create Tenant Workspace</p>
        <p className="text-sm text-muted-foreground">Create a new tenant and assign yourself as tenant admin immediately.</p>
        <div className="flex flex-wrap gap-2">
          <input
            value={tenantNameDraft}
            onChange={(event) => setTenantNameDraft(event.target.value)}
            placeholder="Tenant name"
            className="min-w-[220px] flex-1 rounded-lg border border-border bg-input-background px-3 py-2 text-sm"
          />
          <input
            value={tenantSlugDraft}
            onChange={(event) => setTenantSlugDraft(event.target.value)}
            placeholder="Slug (optional)"
            className="min-w-[200px] flex-1 rounded-lg border border-border bg-input-background px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void handleCreateTenant()}
            disabled={isCreatingTenant}
            className="rounded-lg bg-accent px-3 py-2 text-sm text-white hover:bg-accent/90 disabled:opacity-60 inline-flex items-center gap-2"
            style={{ fontWeight: 600 }}
          >
            {isCreatingTenant ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create tenant
          </button>
        </div>
        {tenantActionMessage && (
          <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">{tenantActionMessage}</p>
        )}
      </section>

      <section className="bg-white border border-border rounded-xl p-4">
        <p className="text-sm text-primary mb-3" style={{ fontWeight: 600 }}>Team Access Controls</p>
        {snapshot.teamMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No team members available for admin actions.</p>
        ) : (
          <div className="space-y-2">
            {snapshot.teamMembers.map((member) => (
              <div key={member.id} className="rounded-lg border border-border px-3 py-2 flex flex-wrap items-center gap-2 justify-between">
                <div>
                  <p className="text-sm text-primary" style={{ fontWeight: 600 }}>{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={memberRoleDrafts[member.id] || member.role}
                    onChange={(event) =>
                      setMemberRoleDrafts((current) => ({
                        ...current,
                        [member.id]: event.target.value as "admin" | "agent",
                      }))
                    }
                    className="rounded-lg border border-border bg-white px-2 py-1.5 text-xs"
                  >
                    <option value="admin">admin</option>
                    <option value="agent">agent</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => void handleSaveMemberRole(member.id)}
                    disabled={isUpdatingMemberId === member.id}
                    className="rounded-lg border border-border bg-white px-2 py-1.5 text-xs text-primary hover:bg-muted disabled:opacity-60 inline-flex items-center gap-1"
                  >
                    {isUpdatingMemberId === member.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleRevokeMember(member.id)}
                    disabled={isUpdatingMemberId === member.id}
                    className="rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700 hover:bg-red-100 disabled:opacity-60 inline-flex items-center gap-1"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {lastUpdated && (
        <p className="text-xs text-muted-foreground">
          Updated {new Date(lastUpdated).toLocaleString()}
        </p>
      )}
    </div>
  );
}
