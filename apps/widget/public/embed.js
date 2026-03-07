(() => {
  const ROOT_ID = "swyftup-widget-root";
  const STYLE_ID = "swyftup-widget-style";
  const SCRIPT_SELECTOR = 'script[data-swyft-widget-script="true"]';

  if (window.SwyftUpWidget?.__mounted) {
    return;
  }

  const scripts = document.querySelectorAll(SCRIPT_SELECTOR);
  const script =
    scripts.length > 0
      ? scripts[scripts.length - 1]
      : document.currentScript instanceof HTMLScriptElement
        ? document.currentScript
        : null;

  if (!(script instanceof HTMLScriptElement)) {
    return;
  }

  const workspaceId = script.dataset.workspaceId?.trim();
  const launcherMode = script.dataset.launcher?.trim().toLowerCase() || "bubble";
  const environment = script.dataset.environment?.trim();

  if (!workspaceId) {
    console.warn("[SwyftUp widget] Missing data-workspace-id on embed script.");
    return;
  }

  if (document.getElementById(ROOT_ID)) {
    return;
  }

  function resolveWidgetBaseUrl() {
    const explicit = script.dataset.widgetUrl?.trim();
    if (explicit) {
      return explicit;
    }

    try {
      const url = new URL(script.src, window.location.href);
      if (url.pathname.endsWith("/embed.js")) {
        url.pathname = url.pathname.slice(0, -"/embed.js".length) || "/";
      } else {
        url.pathname = "/";
      }
      url.search = "";
      url.hash = "";
      return url.toString();
    } catch {
      return "/";
    }
  }

  function buildFrameUrl() {
    const frameUrl = new URL(resolveWidgetBaseUrl(), window.location.href);
    frameUrl.searchParams.set("workspaceId", workspaceId);
    frameUrl.searchParams.set("embedded", "1");
    frameUrl.searchParams.set("launcher", launcherMode);
    if (environment) {
      frameUrl.searchParams.set("env", environment);
    }
    return frameUrl.toString();
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
#${ROOT_ID} {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 2147483000;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
#${ROOT_ID} .swyftup-widget-toggle {
  border: 0;
  border-radius: 999px;
  background: #0f766e;
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1;
  height: 3rem;
  padding: 0 1rem;
  cursor: pointer;
  box-shadow: 0 10px 28px rgba(15, 118, 110, 0.35);
}
#${ROOT_ID} .swyftup-widget-panel {
  width: min(420px, calc(100vw - 2rem));
  height: min(680px, calc(100vh - 6rem));
  border: 1px solid #d1d5db;
  border-radius: 1rem;
  background: #ffffff;
  overflow: hidden;
  box-shadow: 0 22px 42px rgba(15, 23, 42, 0.22);
  margin-top: 0.75rem;
  transform-origin: bottom right;
  transition: opacity 160ms ease, transform 160ms ease, visibility 160ms ease;
}
#${ROOT_ID}[data-open="false"] .swyftup-widget-panel {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(8px) scale(0.98);
}
#${ROOT_ID}[data-open="true"] .swyftup-widget-panel {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(0) scale(1);
}
#${ROOT_ID} iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}
@media (max-width: 640px) {
  #${ROOT_ID} {
    right: 0.75rem;
    bottom: 0.75rem;
  }
  #${ROOT_ID} .swyftup-widget-panel {
    width: calc(100vw - 1.5rem);
    height: min(75vh, 680px);
  }
}
`;
    document.head.appendChild(style);
  }

  ensureStyles();

  const root = document.createElement("div");
  root.id = ROOT_ID;
  root.dataset.open = launcherMode === "open" || launcherMode === "expanded" ? "true" : "false";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "swyftup-widget-toggle";
  button.setAttribute("aria-label", "Toggle chat widget");
  button.textContent = "Chat with us";

  const panel = document.createElement("div");
  panel.className = "swyftup-widget-panel";

  const iframe = document.createElement("iframe");
  iframe.src = buildFrameUrl();
  iframe.loading = "lazy";
  iframe.title = "SwyftUp live chat";
  iframe.allow = "microphone; camera; clipboard-write";
  panel.appendChild(iframe);

  root.appendChild(button);
  root.appendChild(panel);
  document.body.appendChild(root);

  let open = root.dataset.open === "true";

  function render() {
    root.dataset.open = open ? "true" : "false";
    button.setAttribute("aria-expanded", open ? "true" : "false");
    button.textContent = open ? "Close chat" : "Chat with us";
  }

  function setOpen(nextOpen) {
    open = Boolean(nextOpen);
    render();
  }

  function toggle() {
    setOpen(!open);
  }

  button.addEventListener("click", toggle);
  render();

  window.SwyftUpWidget = {
    __mounted: true,
    open() {
      setOpen(true);
    },
    close() {
      setOpen(false);
    },
    toggle,
    destroy() {
      button.removeEventListener("click", toggle);
      root.remove();
      if (window.SwyftUpWidget) {
        delete window.SwyftUpWidget;
      }
    },
  };
})();
