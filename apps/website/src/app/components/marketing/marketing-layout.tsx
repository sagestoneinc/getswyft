import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { BrandLogo } from "../brand/logo";
import { usePageSeo } from "../../lib/seo";
import { getMarketingSeo } from "../../lib/route-seo";
import { footerGroups, marketingNavGroups, type NavGroup } from "../../content/marketing-content";

function useSwyftWidgetEmbed() {
  const scriptUrl =
    (import.meta.env.VITE_SWYFT_WIDGET_SCRIPT_URL as string | undefined) ||
    "https://widget.getswyftup.com/embed.js";
  const workspaceId =
    (import.meta.env.VITE_SWYFT_WIDGET_WORKSPACE_ID as string | undefined) ||
    "cmmgvcy2a000spo0dh42dwmlr";
  const launcher = (import.meta.env.VITE_SWYFT_WIDGET_LAUNCHER as string | undefined) || "bubble";
  const environment = (import.meta.env.VITE_SWYFT_WIDGET_ENV as string | undefined) || "production";

  useEffect(() => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-swyft-widget-script="true"]',
    );

    if (existingScript) {
      return;
    }

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.dataset.swyftWidgetScript = "true";
    script.dataset.workspaceId = workspaceId;

    if (launcher) {
      script.dataset.launcher = launcher;
    }

    if (environment) {
      script.dataset.environment = environment;
    }

    document.body.appendChild(script);

    return () => {
      const widgetApi = (
        window as Window & {
          SwyftUpWidget?: { destroy?: () => void };
        }
      ).SwyftUpWidget;
      widgetApi?.destroy?.();
      script.remove();
    };
  }, [environment, launcher, scriptUrl, workspaceId]);
}

function isGroupActive(group: NavGroup, pathname: string) {
  if (group.href && (pathname === group.href || pathname.startsWith(`${group.href}/`))) {
    return true;
  }

  return group.items?.some((item) => pathname === item.to || pathname.startsWith(`${item.to}/`)) ?? false;
}

function DesktopGroup({
  group,
  pathname,
}: {
  group: NavGroup;
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const active = isGroupActive(group, pathname);
  const hasDropdown = Boolean(group.items?.length);

  if (!hasDropdown && group.href) {
    return (
      <Link
        to={group.href}
        className={`text-sm transition-colors ${active ? "text-accent" : "text-primary hover:text-accent"}`}
        style={{ fontWeight: 600 }}
      >
        {group.label}
      </Link>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={`inline-flex items-center gap-1.5 text-sm transition-colors ${active ? "text-accent" : "text-primary hover:text-accent"}`}
        style={{ fontWeight: 600 }}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span>{group.label}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-50 mt-3 w-[22rem] rounded-[24px] border border-border bg-white p-3 shadow-xl">
          <div className="space-y-1">
            {group.items?.map((item) => {
              const activeItem = pathname === item.to || pathname.startsWith(`${item.to}/`);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`block rounded-2xl px-4 py-3 transition-colors ${activeItem ? "bg-accent/10" : "hover:bg-muted"}`}
                  onClick={() => setOpen(false)}
                >
                  <p className="text-sm text-primary" style={{ fontWeight: 650 }}>
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MobileGroup({
  group,
  pathname,
  open,
  onToggle,
  onNavigate,
}: {
  group: NavGroup;
  pathname: string;
  open: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  const active = isGroupActive(group, pathname);
  const hasDropdown = Boolean(group.items?.length);

  if (!hasDropdown && group.href) {
    return (
      <Link
        to={group.href}
        onClick={onNavigate}
        className={`block rounded-2xl px-4 py-3 text-sm ${active ? "bg-accent/10 text-accent" : "text-primary"}`}
        style={{ fontWeight: 650 }}
      >
        {group.label}
      </Link>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-white">
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm ${active ? "text-accent" : "text-primary"}`}
        style={{ fontWeight: 650 }}
      >
        <span>{group.label}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="border-t border-border px-3 py-2">
          {group.items?.map((item) => {
            const activeItem = pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={`block rounded-2xl px-3 py-3 ${activeItem ? "bg-accent/10" : "hover:bg-muted"}`}
              >
                <p className="text-sm text-primary" style={{ fontWeight: 650 }}>
                  {item.label}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function MarketingLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);
  const location = useLocation();
  const seo = getMarketingSeo(location.pathname);
  useSwyftWidgetEmbed();

  usePageSeo({
    ...seo,
    path: location.pathname,
  });

  const activeSummary = useMemo(
    () => marketingNavGroups.find((group) => isGroupActive(group, location.pathname))?.label,
    [location.pathname],
  );

  return (
    <div className="flex min-h-screen flex-col font-[Inter,sans-serif]">
      <header className="sticky top-0 z-50 border-b border-border bg-white/92 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="SwyftUp home">
            <BrandLogo size="sm" />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {marketingNavGroups.map((group) => (
              <DesktopGroup key={group.label} group={group} pathname={location.pathname} />
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              to="/login"
              className="rounded-xl px-4 py-2.5 text-sm text-primary transition-colors hover:text-accent"
              style={{ fontWeight: 600 }}
            >
              Sign In
            </Link>
            <Link
              to="/contact"
              className="rounded-xl bg-accent px-5 py-3 text-sm text-white transition-colors hover:bg-accent/90"
              style={{ fontWeight: 650 }}
            >
              Book a Demo
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm text-primary lg:hidden"
            onClick={() => setMobileOpen((current) => !current)}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            Menu
          </button>
        </div>

        {mobileOpen ? (
          <div className="border-t border-border bg-[#f8fcfc] px-4 py-4 lg:hidden">
            <p className="mb-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {activeSummary ? `Currently exploring ${activeSummary}` : "Navigation"}
            </p>
            <div className="space-y-3">
              {marketingNavGroups.map((group) => (
                <MobileGroup
                  key={group.label}
                  group={group}
                  pathname={location.pathname}
                  open={openMobileGroup === group.label}
                  onToggle={() =>
                    setOpenMobileGroup((current) => (current === group.label ? null : group.label))
                  }
                  onNavigate={() => {
                    setMobileOpen(false);
                    setOpenMobileGroup(null);
                  }}
                />
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-2xl border border-border bg-white px-4 py-3 text-center text-sm text-primary"
                style={{ fontWeight: 650 }}
              >
                Sign In
              </Link>
              <Link
                to="/contact"
                onClick={() => setMobileOpen(false)}
                className="rounded-2xl bg-accent px-4 py-3 text-center text-sm text-white"
                style={{ fontWeight: 650 }}
              >
                Book a Demo
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
            <div className="max-w-md">
              <BrandLogo size="sm" theme="dark" />
              <p className="mt-5 text-sm leading-7 text-primary-foreground/75">
                A flexible customer communication platform with chat, voice, and AI automation built for any business.
              </p>
              <Link
                to="/contact"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm text-primary transition-colors hover:bg-white/92"
                style={{ fontWeight: 650 }}
              >
                Talk to Sales
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-5">
              {footerGroups.map((group) => (
                <div key={group.label}>
                  <h3 className="text-sm text-white" style={{ fontWeight: 700 }}>
                    {group.label}
                  </h3>
                  <div className="mt-4 space-y-3">
                    {group.items.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="block text-sm text-primary-foreground/72 transition-colors hover:text-accent"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 border-t border-white/12 pt-6 text-sm text-primary-foreground/55">
            &copy; 2026 SwyftUp. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
