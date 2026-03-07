const DEV_AUTH_BYPASS = (import.meta.env.VITE_DEV_AUTH_BYPASS as string | undefined)?.toLowerCase() === "true";
const DEV_USER_ID = (import.meta.env.VITE_DEV_USER_ID as string | undefined) || "local-user";
const DEV_USER_EMAIL = (import.meta.env.VITE_DEV_USER_EMAIL as string | undefined) || "admin@getswyft.local";
const DEV_TENANT_SLUG = (import.meta.env.VITE_DEV_TENANT_SLUG as string | undefined) || "default";
const IS_PROD_BUILD = import.meta.env.PROD === true;

function isLocalHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".local")
  );
}

export function shouldUseDevAuthBypass() {
  if (IS_PROD_BUILD) {
    return false;
  }

  if (!DEV_AUTH_BYPASS) {
    return false;
  }

  if (typeof window === "undefined") {
    return true;
  }

  return isLocalHost(window.location.hostname);
}

export function applyDevAuthHeaders(headers: Headers) {
  if (!shouldUseDevAuthBypass()) {
    return false;
  }

  if (!headers.has("x-dev-user-id")) {
    headers.set("x-dev-user-id", DEV_USER_ID);
  }
  if (!headers.has("x-dev-user-email")) {
    headers.set("x-dev-user-email", DEV_USER_EMAIL);
  }
  if (!headers.has("x-tenant-slug")) {
    headers.set("x-tenant-slug", DEV_TENANT_SLUG);
  }
  return true;
}
