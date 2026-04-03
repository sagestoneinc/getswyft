const DEV_AUTH_BYPASS = (import.meta.env.VITE_DEV_AUTH_BYPASS as string | undefined)?.toLowerCase() === "true";
const DEV_USER_ID = (import.meta.env.VITE_DEV_USER_ID as string | undefined) || "agent-local";
const DEV_USER_EMAIL = (import.meta.env.VITE_DEV_USER_EMAIL as string | undefined) || "agent@getswyft.local";
const DEV_USER_NAME = (import.meta.env.VITE_DEV_USER_NAME as string | undefined) || "Local Agent";
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
  if (IS_PROD_BUILD || !DEV_AUTH_BYPASS) {
    return false;
  }

  if (typeof window === "undefined") {
    return true;
  }

  return isLocalHost(window.location.hostname);
}

export function getDevUser() {
  return {
    id: DEV_USER_ID,
    email: DEV_USER_EMAIL,
    name: DEV_USER_NAME,
    tenantSlug: DEV_TENANT_SLUG,
  };
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
  if (!headers.has("x-dev-user-name")) {
    headers.set("x-dev-user-name", DEV_USER_NAME);
  }
  if (!headers.has("x-tenant-slug")) {
    headers.set("x-tenant-slug", DEV_TENANT_SLUG);
  }

  return true;
}

export function buildDevSocketAuth(tenantSlug?: string | null) {
  if (!shouldUseDevAuthBypass()) {
    return null;
  }

  return {
    devUserId: DEV_USER_ID,
    devEmail: DEV_USER_EMAIL,
    devName: DEV_USER_NAME,
    tenantSlug: tenantSlug || DEV_TENANT_SLUG,
  };
}
