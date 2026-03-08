import { useState } from "react";
import { Check, MessageCircle, Sparkles, Crown, Eye, Info, ExternalLink } from "lucide-react";
import { WidgetMinimal } from "./widgets/widget-minimal";
import { WidgetGradient } from "./widgets/widget-gradient";
import { WidgetPremium } from "./widgets/widget-premium";
import { widgetThemes, type WidgetThemeConfig } from "./widgets/widget-shared";

const themeIcons: Record<WidgetThemeConfig["id"], typeof MessageCircle> = {
  minimal: MessageCircle,
  gradient: Sparkles,
  premium: Crown,
};

const themePreviewColors: Record<WidgetThemeConfig["id"], { dot: string; ring: string; bg: string }> = {
  minimal: {
    dot: "bg-[#1a1a2e]",
    ring: "ring-[#1a1a2e]/20",
    bg: "bg-gradient-to-br from-gray-50 to-gray-100",
  },
  gradient: {
    dot: "bg-gradient-to-r from-[#4a6cf7] to-[#1fb6f6]",
    ring: "ring-blue-500/20",
    bg: "bg-gradient-to-br from-[#0e0e1c] to-[#1a1a35]",
  },
  premium: {
    dot: "bg-[#1b1b1f]",
    ring: "ring-[#1b1b1f]/15",
    bg: "bg-gradient-to-br from-[#faf9f6] to-[#f0ede8]",
  },
};

const widgetComponents: Record<WidgetThemeConfig["id"], () => JSX.Element> = {
  minimal: WidgetMinimal,
  gradient: WidgetGradient,
  premium: WidgetPremium,
};

export function WidgetPage() {
  const [selected, setSelected] = useState<WidgetThemeConfig["id"]>("minimal");
  const [saved, setSaved] = useState<WidgetThemeConfig["id"]>("minimal");
  const [saving, setSaving] = useState(false);

  const ActiveWidget = widgetComponents[selected];
  const selectedTheme = widgetThemes.find((t) => t.id === selected)!;
  const colors = themePreviewColors[selected];

  function handleSave() {
    setSaving(true);
    // Simulate API save
    window.setTimeout(() => {
      setSaved(selected);
      setSaving(false);
    }, 800);
  }

  const isDirty = selected !== saved;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl text-primary" style={{ fontWeight: 700 }}>
          Chat Widget
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose a widget design for your customer-facing chat experience. Your visitors will see this widget on your website.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_480px] gap-8">
        {/* Left: Widget Options */}
        <div className="space-y-6">
          {/* Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {widgetThemes.map((theme) => {
              const Icon = themeIcons[theme.id];
              const isSelected = selected === theme.id;
              const isSaved = saved === theme.id;
              const previewColors = themePreviewColors[theme.id];

              return (
                <button
                  key={theme.id}
                  onClick={() => setSelected(theme.id)}
                  className={`relative text-left p-5 rounded-xl border-2 transition-all hover:shadow-md ${
                    isSelected
                      ? "border-accent bg-accent/5 shadow-md shadow-accent/10"
                      : "border-border bg-white hover:border-accent/40"
                  }`}
                >
                  {isSaved && (
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 text-[10px] text-accent bg-accent/10 px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>
                        <Check className="w-3 h-3" />
                        Active
                      </span>
                    </div>
                  )}

                  <div className={`w-10 h-10 rounded-xl ${previewColors.bg} flex items-center justify-center mb-3 ring-1 ${previewColors.ring}`}>
                    <Icon className={`w-5 h-5 ${theme.id === "gradient" ? "text-blue-400" : "text-gray-600"}`} />
                  </div>

                  <h3 className="text-sm text-primary mb-0.5" style={{ fontWeight: 600 }}>
                    {theme.subtitle}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {theme.description}
                  </p>

                  {isSelected && (
                    <div className="mt-3 flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${previewColors.dot}`} />
                      <span className="text-[11px] text-accent" style={{ fontWeight: 600 }}>
                        Previewing
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Info Card */}
          <div className="bg-muted/50 border border-border rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-primary" style={{ fontWeight: 500 }}>
                How widget selection works
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Select a widget design above and click <strong>Save Selection</strong> to activate it across
                all pages where your SwyftUp embed script is installed. Each design includes the pre-chat
                form, live chat view, and error/retry handling. Visitors will see the new widget immediately
                after saving.
              </p>
            </div>
          </div>

          {/* Features Comparison */}
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border bg-muted/30">
              <h2 className="text-sm text-primary" style={{ fontWeight: 600 }}>
                Feature Comparison
              </h2>
            </div>
            <div className="divide-y divide-border">
              {[
                {
                  feature: "Pre-chat contact form",
                  minimal: true,
                  gradient: true,
                  premium: true,
                },
                {
                  feature: "Live typing indicator",
                  minimal: true,
                  gradient: true,
                  premium: true,
                },
                {
                  feature: "Message delivery status",
                  minimal: true,
                  gradient: true,
                  premium: true,
                },
                {
                  feature: "Error & retry handling",
                  minimal: true,
                  gradient: true,
                  premium: true,
                },
                {
                  feature: "Proactive greeting bubble",
                  minimal: false,
                  gradient: false,
                  premium: true,
                },
                {
                  feature: "Agent name labels",
                  minimal: false,
                  gradient: false,
                  premium: true,
                },
                {
                  feature: "AI-powered badge",
                  minimal: false,
                  gradient: true,
                  premium: false,
                },
                {
                  feature: "Dark mode support",
                  minimal: false,
                  gradient: true,
                  premium: false,
                },
                {
                  feature: "Animated launcher",
                  minimal: false,
                  gradient: true,
                  premium: false,
                },
                {
                  feature: "Reply time estimate",
                  minimal: false,
                  gradient: false,
                  premium: true,
                },
              ].map((row) => (
                <div key={row.feature} className="grid grid-cols-4 px-5 py-2.5 text-xs items-center">
                  <span className="text-primary" style={{ fontWeight: 500 }}>
                    {row.feature}
                  </span>
                  {(["minimal", "gradient", "premium"] as const).map((key) => (
                    <span key={key} className="text-center">
                      {row[key] ? (
                        <Check className="w-4 h-4 text-accent mx-auto" />
                      ) : (
                        <span className="text-muted-foreground/40">&mdash;</span>
                      )}
                    </span>
                  ))}
                </div>
              ))}
              {/* Column headers */}
              <div className="grid grid-cols-4 px-5 py-2 text-[10px] text-muted-foreground border-t border-border bg-muted/20 order-first" style={{ fontWeight: 600 }}>
                <span>Feature</span>
                <span className="text-center">Minimal</span>
                <span className="text-center">Gradient</span>
                <span className="text-center">Premium</span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={!isDirty || saving}
              className="inline-flex items-center gap-2 rounded-lg bg-accent text-white px-5 py-2.5 text-sm transition-all hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              style={{ fontWeight: 600 }}
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Selection
                </>
              )}
            </button>
            {!isDirty && saved === selected && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-accent" />
                <span style={{ fontWeight: 500 }}>
                  {widgetThemes.find((t) => t.id === saved)?.subtitle} is active
                </span>
              </span>
            )}
            {isDirty && (
              <span className="text-xs text-muted-foreground">
                Unsaved changes — click save to apply
              </span>
            )}
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="xl:sticky xl:top-6 self-start">
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-primary" style={{ fontWeight: 600 }}>Live Preview</span>
              </div>
              <span className="text-[10px] text-muted-foreground bg-white px-2 py-0.5 rounded-full border border-border" style={{ fontWeight: 500 }}>
                {selectedTheme.subtitle}
              </span>
            </div>

            {/* Preview area with simulated page background */}
            <div className={`relative overflow-hidden ${colors.bg}`} style={{ height: "620px" }}>
              {/* Simulated website skeleton */}
              <div className="p-6 opacity-30">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-3 bg-gray-400 rounded-full" />
                    <div className="hidden md:flex items-center gap-4">
                      <div className="w-12 h-2.5 bg-gray-400 rounded-full" />
                      <div className="w-14 h-2.5 bg-gray-400 rounded-full" />
                      <div className="w-10 h-2.5 bg-gray-400 rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-14 h-7 bg-gray-400 rounded-lg" />
                    <div className="w-18 h-7 bg-gray-500 rounded-lg" />
                  </div>
                </div>

                <div className="text-center mb-10">
                  <div className="w-36 h-3 bg-gray-400/70 rounded-full mx-auto mb-3" />
                  <div className="w-72 h-5 bg-gray-400 rounded-full mx-auto mb-2" />
                  <div className="w-56 h-5 bg-gray-400 rounded-full mx-auto mb-5" />
                  <div className="w-52 h-3 bg-gray-400/60 rounded-full mx-auto mb-1.5" />
                  <div className="w-44 h-3 bg-gray-400/60 rounded-full mx-auto mb-6" />
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-28 h-9 bg-gray-500 rounded-xl" />
                    <div className="w-24 h-9 bg-gray-400 rounded-xl" />
                  </div>
                </div>
              </div>

              {/* Floating widget */}
              <div className="absolute bottom-5 right-5 z-10">
                <ActiveWidget />
              </div>
            </div>
          </div>

          {/* Integration hint */}
          <div className="mt-4 flex items-center justify-between px-1">
            <p className="text-[11px] text-muted-foreground">
              Need help embedding the widget?
            </p>
            <a
              href="/app/integrations"
              className="text-[11px] text-accent flex items-center gap-1 hover:underline"
              style={{ fontWeight: 500 }}
            >
              View Embed Code <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
