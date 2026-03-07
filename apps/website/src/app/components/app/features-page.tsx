import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  LayoutGrid,
  Loader2,
  Lock,
  ServerCrash,
  ShieldCheck,
  Unplug,
} from "lucide-react";
import { useAuth } from "../../providers/auth-provider";

type EndpointCheckStatus =
  | "checking"
  | "available"
  | "protected"
  | "missing"
  | "offline"
  | "error"
  | "skipped";

type FeatureSurface = {
  id: string;
  domain: string;
  title: string;
  description: string;
  uiPath?: string;
  endpoint?: string;
  method?: "GET" | "POST";
  requiredPermission?: string;
  checkable?: boolean;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const DEV_AUTH_BYPASS = (import.meta.env.VITE_DEV_AUTH_BYPASS as string | undefined)?.toLowerCase() === "true";
const DEV_USER_ID = (import.meta.env.VITE_DEV_USER_ID as string | undefined) || "local-user";
const DEV_USER_EMAIL = (import.meta.env.VITE_DEV_USER_EMAIL as string | undefined) || "admin@getswyft.local";
const DEV_TENANT_SLUG = (import.meta.env.VITE_DEV_TENANT_SLUG as string | undefined) || "default";

const featureSurfaces: FeatureSurface[] = [
  {
    id: "tenant-core",
    domain: "Tenant Core",
    title: "Tenant context, branding, and feature flags",
    description: "Tenant identity and workspace context used across all app modules.",
    endpoint: "/v1/tenants/current",
    method: "GET",
    checkable: true,
  },
  {
    id: "rbac",
    domain: "RBAC",
    title: "Role and permission resolution",
    description: "Role-based access control for route gates, admin actions, and policy checks.",
    uiPath: "/app/team",
    endpoint: "/v1/auth/me",
    method: "GET",
    checkable: true,
  },
  {
    id: "presence",
    domain: "Presence",
    title: "Realtime presence and socket session updates",
    description: "Socket-driven online/away/busy/offline status powering assignment and collaboration.",
    endpoint: "/health",
    method: "GET",
    checkable: true,
  },
  {
    id: "conversations",
    domain: "Conversations",
    title: "Conversations, messages, receipts, and reactions",
    description: "Tenant-scoped inbox, conversation threading, read receipts, and realtime message flow.",
    uiPath: "/app/inbox",
    endpoint: "/v1/conversations?limit=1",
    method: "GET",
    checkable: true,
  },
  {
    id: "invitations",
    domain: "Invitations",
    title: "Team invitations and role assignment",
    description: "Invite teammates, assign roles, and track pending invitation state.",
    uiPath: "/app/team",
    endpoint: "/v1/users/team",
    method: "GET",
    checkable: true,
  },
  {
    id: "webhooks",
    domain: "Webhooks",
    title: "Endpoint registration and delivery logs",
    description: "Manage webhook destinations, event subscriptions, and delivery diagnostics.",
    uiPath: "/app/webhooks",
    endpoint: "/v1/tenants/current/webhooks",
    method: "GET",
    checkable: true,
  },
  {
    id: "billing",
    domain: "Billing",
    title: "Subscriptions, invoices, and seat accounting",
    description: "Billing workspace and plan/invoice linkage for tenant subscriptions.",
    uiPath: "/app/billing",
    endpoint: "/v1/tenants/current/billing",
    method: "GET",
    checkable: true,
  },
  {
    id: "notifications",
    domain: "Notifications",
    title: "Notification inbox and device registration",
    description: "Firebase push registration plus in-app notification delivery and read status.",
    endpoint: "/v1/notifications?limit=1",
    method: "GET",
    checkable: true,
  },
  {
    id: "analytics",
    domain: "Audit and Analytics",
    title: "Analytics summaries and event tracking",
    description: "Tenant analytics for activity, usage, and operational KPIs.",
    uiPath: "/app/analytics",
    endpoint: "/v1/analytics/summary",
    method: "GET",
    checkable: true,
  },
  {
    id: "audit",
    domain: "Audit and Analytics",
    title: "Audit log timeline",
    description: "Immutable tenant audit events for sensitive actions and compliance tracking.",
    endpoint: "/v1/audit-logs?limit=1",
    method: "GET",
    checkable: true,
  },
  {
    id: "ai-config",
    domain: "AI Config",
    title: "AI configuration and interactions",
    description: "Tenant AI provider configuration, chat, and summarization workflow plumbing.",
    endpoint: "/v1/ai/config",
    method: "GET",
    checkable: true,
  },
  {
    id: "moderation",
    domain: "Moderation",
    title: "Moderation reports and status workflow",
    description: "Create and manage moderation reports with lifecycle tracking.",
    endpoint: "/v1/moderation",
    method: "GET",
    checkable: true,
  },
  {
    id: "channels",
    domain: "Channels",
    title: "Internal channels and channel messages",
    description: "Multi-channel team threads with membership, reactions, and message history.",
    endpoint: "/v1/channels",
    method: "GET",
    checkable: true,
  },
  {
    id: "calling",
    domain: "Calling",
    title: "Voice/video call sessions",
    description: "Call session creation, participant lifecycle, and call status management.",
    endpoint: "/v1/calls/sessions?limit=1",
    method: "GET",
    checkable: true,
  },
  {
    id: "feed",
    domain: "Feed",
    title: "Tenant feed posts, comments, and reactions",
    description: "Internal feed with post visibility, comments, and reaction summaries.",
    endpoint: "/v1/feed?limit=1",
    method: "GET",
    checkable: true,
  },
  {
    id: "compliance",
    domain: "Compliance",
    title: "Compliance exports",
    description: "Data export lifecycle for full-data, conversations, logs, and user datasets.",
    endpoint: "/v1/compliance/exports",
    method: "GET",
    checkable: true,
  },
  {
    id: "storage",
    domain: "Storage",
    title: "Upload presign and object storage",
    description: "Tenant-safe attachment upload flow via presigned URLs (local/S3 providers).",
    endpoint: "/v1/storage/presign-upload",
    method: "POST",
    checkable: false,
  },
];

function toStatusLabel(status: EndpointCheckStatus) {
  switch (status) {
    case "checking":
      return "Checking";
    case "available":
      return "Available";
    case "protected":
      return "Protected";
    case "missing":
      return "Missing";
    case "offline":
      return "Offline";
    case "error":
      return "Error";
    case "skipped":
      return "Manual";
    default:
      return "Unknown";
  }
}

function statusClassName(status: EndpointCheckStatus) {
  switch (status) {
    case "available":
      return "bg-green-50 text-green-700";
    case "protected":
      return "bg-sky-50 text-sky-700";
    case "missing":
      return "bg-red-50 text-red-700";
    case "offline":
      return "bg-amber-50 text-amber-700";
    case "error":
      return "bg-orange-50 text-orange-700";
    case "checking":
      return "bg-muted text-muted-foreground";
    case "skipped":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function statusIcon(status: EndpointCheckStatus) {
  switch (status) {
    case "available":
      return <CheckCircle2 className="w-3.5 h-3.5" />;
    case "protected":
      return <Lock className="w-3.5 h-3.5" />;
    case "offline":
      return <Unplug className="w-3.5 h-3.5" />;
    case "missing":
      return <AlertTriangle className="w-3.5 h-3.5" />;
    case "error":
      return <ServerCrash className="w-3.5 h-3.5" />;
    case "checking":
      return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
    default:
      return <ShieldCheck className="w-3.5 h-3.5" />;
  }
}

export function FeaturesPage() {
  const { getAccessToken } = useAuth();
  const [statusMap, setStatusMap] = useState<Record<string, EndpointCheckStatus>>({});

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function probeEndpoints() {
      const token = await getAccessToken().catch(() => null);

      const headers = new Headers({
        Accept: "application/json",
      });

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      } else if (DEV_AUTH_BYPASS) {
        headers.set("x-dev-user-id", DEV_USER_ID);
        headers.set("x-dev-user-email", DEV_USER_EMAIL);
        headers.set("x-tenant-slug", DEV_TENANT_SLUG);
      }

      const initial: Record<string, EndpointCheckStatus> = {};
      for (const feature of featureSurfaces) {
        initial[feature.id] = feature.checkable === false ? "skipped" : "checking";
      }

      if (mounted) {
        setStatusMap(initial);
      }

      const checks = await Promise.all(
        featureSurfaces.map(async (feature) => {
          if (!feature.endpoint || feature.checkable === false) {
            return [feature.id, "skipped"] as const;
          }

          try {
            const response = await fetch(`${API_BASE_URL}${feature.endpoint}`, {
              method: feature.method || "GET",
              headers,
              signal: controller.signal,
            });

            if (response.ok) {
              return [feature.id, "available"] as const;
            }

            if (response.status === 401 || response.status === 403) {
              return [feature.id, "protected"] as const;
            }

            if (response.status === 404) {
              return [feature.id, "missing"] as const;
            }

            return [feature.id, "error"] as const;
          } catch {
            return [feature.id, "offline"] as const;
          }
        }),
      );

      if (!mounted) {
        return;
      }

      setStatusMap(Object.fromEntries(checks));
    }

    void probeEndpoints();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [getAccessToken]);

  const summary = useMemo(() => {
    const total = featureSurfaces.length;
    const withUi = featureSurfaces.filter((entry) => Boolean(entry.uiPath)).length;
    const apiOnly = total - withUi;

    const available = Object.values(statusMap).filter((status) => status === "available").length;
    const protectedCount = Object.values(statusMap).filter((status) => status === "protected").length;
    const flagged = Object.values(statusMap).filter((status) => ["missing", "offline", "error"].includes(status)).length;

    return {
      total,
      withUi,
      apiOnly,
      available,
      protectedCount,
      flagged,
    };
  }, [statusMap]);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl text-primary flex items-center gap-2" style={{ fontWeight: 700 }}>
          <LayoutGrid className="w-6 h-6 text-accent" /> Feature Visibility
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          All implemented backend domains are mapped here with live API checks and direct workspace access.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-border rounded-lg p-3">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Domains</p>
          <p className="text-lg text-primary" style={{ fontWeight: 700 }}>{summary.total}</p>
        </div>
        <div className="bg-white border border-border rounded-lg p-3">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">UI Surfaces</p>
          <p className="text-lg text-primary" style={{ fontWeight: 700 }}>{summary.withUi}</p>
        </div>
        <div className="bg-white border border-border rounded-lg p-3">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">API-Only</p>
          <p className="text-lg text-primary" style={{ fontWeight: 700 }}>{summary.apiOnly}</p>
        </div>
        <div className="bg-white border border-border rounded-lg p-3">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Available</p>
          <p className="text-lg text-green-700" style={{ fontWeight: 700 }}>{summary.available}</p>
        </div>
        <div className="bg-white border border-border rounded-lg p-3">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Protected</p>
          <p className="text-lg text-sky-700" style={{ fontWeight: 700 }}>{summary.protectedCount}</p>
        </div>
        <div className="bg-white border border-border rounded-lg p-3">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Needs Review</p>
          <p className="text-lg text-amber-700" style={{ fontWeight: 700 }}>{summary.flagged}</p>
        </div>
      </div>

      <div className="grid gap-3">
        {featureSurfaces.map((feature) => {
          const status = statusMap[feature.id] || (feature.checkable === false ? "skipped" : "checking");

          return (
            <div key={feature.id} className="bg-white border border-border rounded-xl p-4 md:p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{feature.domain}</p>
                  <h2 className="text-base text-primary" style={{ fontWeight: 650 }}>{feature.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${statusClassName(status)}`}
                  style={{ fontWeight: 600 }}
                >
                  {statusIcon(status)} {toStatusLabel(status)}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                {feature.uiPath ? (
                  <Link to={feature.uiPath} className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 hover:bg-muted text-primary">
                    Open UI <ExternalLink className="w-3 h-3" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1">API-first surface</span>
                )}

                {feature.endpoint && (
                  <a
                    href={`${API_BASE_URL}${feature.endpoint}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 hover:bg-muted text-primary"
                  >
                    {feature.method || "GET"} {feature.endpoint}
                  </a>
                )}

                {feature.requiredPermission ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1">
                    Permission: {feature.requiredPermission}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
