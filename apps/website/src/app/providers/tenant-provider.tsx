import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiClient } from "../lib/api-client";
import { useAuth } from "./auth-provider";

type Tenant = {
  id: string;
  slug: string;
  name: string;
  status: string;
  branding: {
    primaryColor: string | null;
    logoUrl: string | null;
    supportEmail: string | null;
  } | null;
  featureFlags: Array<{
    key: string;
    enabled: boolean;
    config: unknown;
  }>;
};

type TenantContextValue = {
  tenant: Tenant | null;
  featureFlags: Record<string, boolean>;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!isAuthenticated) {
      setTenant(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ ok: boolean; tenant: Tenant }>("/v1/tenants/current");
      setTenant(response.tenant);
    } catch (refreshError) {
      const message = refreshError instanceof Error ? refreshError.message : "Failed to load tenant";
      setError(message);
      setTenant(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) {
      return;
    }

    refresh();
  }, [isAuthenticated, authLoading]);

  const value = useMemo<TenantContextValue>(() => {
    const flags = Object.fromEntries((tenant?.featureFlags || []).map((flag) => [flag.key, flag.enabled]));

    return {
      tenant,
      featureFlags: flags,
      isLoading: authLoading || isLoading,
      error,
      refresh,
    };
  }, [tenant, isLoading, authLoading, error]);

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within TenantProvider");
  }

  return context;
}
