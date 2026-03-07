import { Outlet, Link, useLocation, Navigate } from "react-router";
import { useEffect, useState } from "react";
import {
  Inbox, Settings, Webhook, BarChart3, Users,
  CreditCard, User, Menu, X, LogOut, Loader2, AlertTriangle, BellRing, Bot, ShieldAlert, FileClock, MessagesSquare
} from "lucide-react";
import { registerPushNotifications, requestPushNotificationsAccess, type PushRegistrationStatus } from "../../lib/push";
import { useAuth } from "../../providers/auth-provider";
import { useTenant } from "../../providers/tenant-provider";
import { BrandLogo } from "../brand/logo";
import { usePageSeo } from "../../lib/seo";
import { getAppSeo } from "../../lib/route-seo";

const sidebarItems = [
  { to: "/app/inbox", icon: Inbox, label: "Inbox", requiredPermission: "conversation.read" },
  { to: "/app/routing", icon: Settings, label: "Routing", requiredPermission: "tenant.manage" },
  { to: "/app/webhooks", icon: Webhook, label: "Webhooks", requiredPermission: "tenant.manage" },
  { to: "/app/analytics", icon: BarChart3, label: "Analytics", requiredPermission: "analytics.read" },
  { to: "/app/team", icon: Users, label: "Team", requiredPermission: "user.manage" },
  { to: "/app/billing", icon: CreditCard, label: "Billing", requiredPermission: "tenant.manage" },
  { to: "/app/notifications", icon: BellRing, label: "Notifications" },
  { to: "/app/ai", icon: Bot, label: "AI Config", requiredPermission: "tenant.manage" },
  { to: "/app/moderation", icon: ShieldAlert, label: "Moderation", requiredPermission: "moderation.manage" },
  { to: "/app/audit", icon: FileClock, label: "Audit", requiredPermission: "analytics.read" },
  { to: "/app/collaboration", icon: MessagesSquare, label: "Collaboration", requiredPermission: "conversation.read" },
  { to: "/app/profile", icon: User, label: "Profile" },
];

function initials(name: string | undefined | null) {
  if (!name) {
    return "U";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase())
    .join("");
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pushStatus, setPushStatus] = useState<PushRegistrationStatus>("unsupported");
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const location = useLocation();
  const { isLoading: authLoading, isAuthenticated, user, roles, can, logout } = useAuth();
  const { tenant, isLoading: tenantLoading, error: tenantError, refresh } = useTenant();
  const seo = getAppSeo(location.pathname);

  usePageSeo({
    ...seo,
    path: location.pathname,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let cancelled = false;
    registerPushNotifications()
      .then((status) => {
        if (!cancelled) {
          setPushStatus(status);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPushStatus("unsupported");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  if (authLoading || (isAuthenticated && tenantLoading)) {
    return (
      <div className="h-screen flex items-center justify-center bg-muted/30 font-[Inter,sans-serif]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading workspace...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!tenant) {
    return (
      <div className="h-screen flex items-center justify-center bg-muted/30 p-4 font-[Inter,sans-serif]">
        <div className="bg-white rounded-xl border border-border p-6 w-full max-w-md text-center">
          <AlertTriangle className="w-10 h-10 text-warning mx-auto mb-3" />
          <h2 className="text-primary mb-2" style={{ fontWeight: 600 }}>Tenant context unavailable</h2>
          <p className="text-sm text-muted-foreground mb-4">{tenantError || "We couldn't load tenant configuration for this account."}</p>
          <button onClick={() => refresh()} className="bg-accent text-white px-4 py-2 rounded-lg text-sm" style={{ fontWeight: 600 }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const visibleSidebarItems = sidebarItems.filter((item) => !item.requiredPermission || can(item.requiredPermission));
  const activeItem = sidebarItems.find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`));
  const routePermission =
    location.pathname === "/app" || location.pathname.startsWith("/app/conversation/")
      ? "conversation.read"
      : activeItem?.requiredPermission;
  const hasRouteAccess = !routePermission || can(routePermission);

  if (!hasRouteAccess) {
    return (
      <div className="h-screen flex items-center justify-center bg-muted/30 p-4 font-[Inter,sans-serif]">
        <div className="bg-white rounded-xl border border-border p-6 w-full max-w-md text-center">
          <AlertTriangle className="w-10 h-10 text-warning mx-auto mb-3" />
          <h2 className="text-primary mb-2" style={{ fontWeight: 600 }}>Access unavailable</h2>
          <p className="text-sm text-muted-foreground mb-4">Your current role does not include permission to view this workspace section.</p>
          <Link to="/app/inbox" className="bg-accent text-white px-4 py-2 rounded-lg text-sm inline-flex">
            Return to Inbox
          </Link>
        </div>
      </div>
    );
  }

  const displayName = user?.name || user?.email || "User";
  const displayRole = roles.includes("tenant_admin")
    ? "Tenant Admin"
    : roles.includes("agent")
      ? "Agent"
      : "Tenant User";

  async function handleEnablePush() {
    setIsEnablingPush(true);
    try {
      setPushStatus(await requestPushNotificationsAccess());
    } finally {
      setIsEnablingPush(false);
    }
  }

  return (
    <div className="h-screen flex font-[Inter,sans-serif] overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
          <Link to="/app" aria-label="SwyftUp workspace">
            <div>
              <BrandLogo size="sm" theme="dark" />
              <p className="text-[10px] text-sidebar-foreground/70 leading-3">{tenant.name}</p>
            </div>
          </Link>
          <button className="lg:hidden text-sidebar-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {visibleSidebarItems.map((item) => {
            const isActive = location.pathname === item.to || (item.to === "/app/inbox" && location.pathname === "/app");
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
                style={{ fontWeight: isActive ? 600 : 400 }}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
                {item.requiredPermission && item.requiredPermission !== "conversation.read" && (
                  <span className="ml-auto text-[10px] bg-sidebar-primary/20 text-sidebar-primary px-1.5 py-0.5 rounded">Admin</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <Link to="/app/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white text-sm" style={{ fontWeight: 600 }}>{initials(displayName)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-sidebar-foreground truncate" style={{ fontWeight: 500 }}>{displayName}</p>
              <p className="text-xs text-sidebar-foreground/50">{displayRole}</p>
            </div>
          </Link>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors text-sm mt-1"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-border flex items-center px-4 gap-4 flex-shrink-0">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/app" className="lg:hidden" aria-label="SwyftUp workspace">
            <BrandLogo size="sm" />
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            {pushStatus === "prompt" && (
              <button
                type="button"
                onClick={() => void handleEnablePush()}
                disabled={isEnablingPush}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs text-primary hover:bg-muted disabled:opacity-60"
                style={{ fontWeight: 600 }}
              >
                {isEnablingPush ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellRing className="w-3.5 h-3.5 text-accent" />}
                Enable Alerts
              </button>
            )}
            <span className="inline-flex items-center gap-1.5 text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-muted-foreground hidden sm:inline">{tenant.slug}</span>
            </span>
            <Link to="/app/profile" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white text-xs" style={{ fontWeight: 600 }}>
                {initials(displayName)}
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-muted/30">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
