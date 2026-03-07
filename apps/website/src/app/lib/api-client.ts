import { applyDevAuthHeaders } from "./dev-bypass";

const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

type AccessTokenProvider = () => Promise<string | null>;
type TenantSlugProvider = () => string | null;

class ApiClient {
  private accessTokenProvider: AccessTokenProvider = async () => null;
  private tenantSlugProvider: TenantSlugProvider = () => null;

  setAccessTokenProvider(provider: AccessTokenProvider) {
    this.accessTokenProvider = provider;
  }

  setTenantSlugProvider(provider: TenantSlugProvider) {
    this.tenantSlugProvider = provider;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers || {});
    const token = await this.accessTokenProvider();
    const tenantSlug = this.tenantSlugProvider();

    if (tenantSlug) {
      headers.set("x-tenant-slug", tenantSlug);
    }

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    } else {
      applyDevAuthHeaders(headers);
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

  put<T>(path: string, payload: unknown) {
    return this.request<T>(path, {
      method: "PUT",
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

  delete<T>(path: string) {
    return this.request<T>(path, {
      method: "DELETE",
    });
  }
}

export const apiClient = new ApiClient();
