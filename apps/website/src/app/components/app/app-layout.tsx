import { Outlet, Link, useLocation } from "react-router";
import { useState } from "react";
import {
  Inbox, MessageCircle, Settings, Webhook, BarChart3, Users,
  CreditCard, User, HelpCircle, Zap, Menu, X, LogOut, ChevronDown
} from "lucide-react";

const sidebarItems = [
  { to: "/app/inbox", icon: Inbox, label: "Inbox" },
  { to: "/app/routing", icon: Settings, label: "Routing", adminOnly: true },
  { to: "/app/webhooks", icon: Webhook, label: "Webhooks", adminOnly: true },
  { to: "/app/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/app/team", icon: Users, label: "Team", adminOnly: true },
  { to: "/app/billing", icon: CreditCard, label: "Billing" },
  { to: "/app/profile", icon: User, label: "Profile" },
];

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="h-screen flex font-[Inter,sans-serif] overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg text-white" style={{ fontWeight: 700 }}>SwyftUp</span>
          </Link>
          <button className="lg:hidden text-sidebar-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {sidebarItems.map((item) => {
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
                {item.adminOnly && (
                  <span className="ml-auto text-[10px] bg-sidebar-primary/20 text-sidebar-primary px-1.5 py-0.5 rounded">Admin</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <Link to="/app/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white text-sm" style={{ fontWeight: 600 }}>SC</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-sidebar-foreground truncate" style={{ fontWeight: 500 }}>Sarah Chen</p>
              <p className="text-xs text-sidebar-foreground/50">Admin</p>
            </div>
          </Link>
          <Link to="/login" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors text-sm mt-1">
            <LogOut className="w-4 h-4" /> Sign Out
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-border flex items-center px-4 gap-4 flex-shrink-0">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-muted-foreground hidden sm:inline">Online</span>
            </span>
            <Link to="/app/profile" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white text-xs" style={{ fontWeight: 600 }}>SC</div>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-muted/30">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
