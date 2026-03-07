const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const DEV_AUTH_BYPASS = (import.meta.env.VITE_DEV_AUTH_BYPASS as string | undefined) !== "false";
const DEV_USER_ID = (import.meta.env.VITE_DEV_USER_ID as string | undefined) || "local-user";
const DEV_USER_EMAIL = (import.meta.env.VITE_DEV_USER_EMAIL as string | undefined) || "admin@getswyft.local";
const DEV_TENANT_SLUG = (import.meta.env.VITE_DEV_TENANT_SLUG as string | undefined) || "default";

type AccessTokenProvider = () => Promise<string | null>;

class ApiClient {
  private accessTokenProvider: AccessTokenProvider = async () => null;

  setAccessTokenProvider(provider: AccessTokenProvider) {
    this.accessTokenProvider = provider;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers || {});
    const token = await this.accessTokenProvider();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    } else if (DEV_AUTH_BYPASS) {
      headers.set("x-dev-user-id", DEV_USER_ID);
      headers.set("x-dev-user-email", DEV_USER_EMAIL);
      headers.set("x-tenant-slug", DEV_TENANT_SLUG);
    }

    const response = await fetch(`${DEFAULT_API_BASE_URL}${path}`, {
      ...init,
      headers,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Request failed with ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  get<T>(path: string) {
    return this.request<T>(path, { method: "GET" });
  }

  post<T>(path: string, payload: unknown) {
    return this.request<T>(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }

  patch<T>(path: string, payload: unknown) {
    return this.request<T>(path, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }
}

export const apiClient = new ApiClient();
