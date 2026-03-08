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

  const workspaceSlug = script.dataset.workspaceSlug?.trim() || "";
  const workspaceIdFallback = script.dataset.workspaceId?.trim() || "";
  const workspaceIdentifier = workspaceSlug || workspaceIdFallback;
  const launcherMode = script.dataset.launcher?.trim().toLowerCase() || "bubble";
  const environment = script.dataset.environment?.trim();
  const storageKey = workspaceIdentifier ? `swyftup-widget-position:${workspaceIdentifier}` : "swyftup-widget-position";

  function normalizePosition(value) {
    const normalized = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/_/g, "-");

    if (
      normalized === "left" ||
      normalized === "bottom-left" ||
      normalized === "lower-left" ||
      normalized === "bottomleft"
    ) {
      return "left";
    }

    return "right";
  }

  if (!workspaceIdentifier) {
    console.warn("[SwyftUp widget] Missing data-workspace-slug on embed script.");
    return;
  }

  if (document.getElementById(ROOT_ID)) {
    return;
  }

  let storedPosition = null;
  try {
    storedPosition = window.localStorage.getItem(storageKey);
  } catch {
    storedPosition = null;
  }
  const configuredPosition = script.dataset.position || storedPosition || "right";
  const initialPosition = normalizePosition(configuredPosition);

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
    if (workspaceSlug) {
      frameUrl.searchParams.set("workspaceSlug", workspaceSlug);
    } else {
      frameUrl.searchParams.set("workspaceId", workspaceIdFallback);
    }
    frameUrl.searchParams.set("embedded", "1");
    frameUrl.searchParams.set("launcher", launcherMode);
    frameUrl.searchParams.set("position", initialPosition);
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
  bottom: 1rem;
  z-index: 2147483000;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
#${ROOT_ID}[data-position="right"] {
  right: 1rem;
  left: auto;
}
#${ROOT_ID}[data-position="left"] {
  left: 1rem;
  right: auto;
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
  position: relative;
  z-index: 2;
}
#${ROOT_ID} .swyftup-widget-panel {
  position: absolute;
  bottom: calc(3rem + 0.75rem);
  width: min(420px, calc(100vw - 2rem));
  height: min(680px, calc(100vh - 6rem));
  border: 1px solid #d1d5db;
  border-radius: 1rem;
  background: #ffffff;
  overflow: hidden;
  box-shadow: 0 22px 42px rgba(15, 23, 42, 0.22);
  transition: opacity 160ms ease, transform 160ms ease, visibility 160ms ease;
}
#${ROOT_ID}[data-position="right"] .swyftup-widget-panel {
  right: 0;
  left: auto;
  transform-origin: bottom right;
}
#${ROOT_ID}[data-position="left"] .swyftup-widget-panel {
  left: 0;
  right: auto;
  transform-origin: bottom left;
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
    bottom: 0.75rem;
  }
  #${ROOT_ID}[data-position="right"] {
    right: 0.75rem;
    left: auto;
  }
  #${ROOT_ID}[data-position="left"] {
    left: 0.75rem;
    right: auto;
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

  root.appendChild(panel);
  root.appendChild(button);
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

  function setPosition(nextPosition) {
    const normalized = normalizePosition(nextPosition);
    root.dataset.position = normalized;
    try {
      window.localStorage.setItem(storageKey, normalized);
    } catch {
      // no-op: storage can be unavailable in some browsing contexts
    }
  }

  button.addEventListener("click", toggle);
  setPosition(initialPosition);
  render();

  window.SwyftUpWidget = {
    __mounted: true,
    open() {
      setOpen(true);
    },
    close() {
      setOpen(false);
    },
    setPosition(nextPosition) {
      setPosition(nextPosition);
    },
    getPosition() {
      return root.dataset.position || "right";
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
