import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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
  availableTenants: TenantMembership[];
  activeTenantSlug: string | null;
  featureFlags: Record<string, boolean>;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  switchTenant: (tenantSlug: string) => Promise<void>;
};

type TenantMembership = {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  roleKeys: string[];
  permissions: string[];
};

type MembershipResponse = {
  ok: boolean;
  activeTenant: TenantMembership | null;
  memberships: TenantMembership[];
};

const TenantContext = createContext<TenantContextValue | undefined>(undefined);
const TENANT_STORAGE_KEY = "getswyft.activeTenantSlug";

function readStoredTenantSlug() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TENANT_STORAGE_KEY);
}

function persistTenantSlug(tenantSlug: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!tenantSlug) {
    window.localStorage.removeItem(TENANT_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(TENANT_STORAGE_KEY, tenantSlug);
}

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [availableTenants, setAvailableTenants] = useState<TenantMembership[]>([]);
  const [activeTenantSlug, setActiveTenantSlug] = useState<string | null>(readStoredTenantSlug());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.setTenantSlugProvider(() => activeTenantSlug);
  }, [activeTenantSlug]);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setTenant(null);
      setAvailableTenants([]);
      setActiveTenantSlug(null);
      setError(null);
      persistTenantSlug(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const membershipResponse = await apiClient.get<MembershipResponse>("/v1/auth/memberships");
      const memberships = membershipResponse.memberships || [];
      setAvailableTenants(memberships);

      const storedTenantSlug = readStoredTenantSlug();
      const hasActiveTenant = memberships.some((membership) => membership.tenantSlug === activeTenantSlug);
      const hasStoredTenant = storedTenantSlug
        ? memberships.some((membership) => membership.tenantSlug === storedTenantSlug)
        : false;

      const resolvedTenantSlug = hasActiveTenant
        ? activeTenantSlug
        : hasStoredTenant
          ? storedTenantSlug
          : membershipResponse.activeTenant?.tenantSlug || memberships[0]?.tenantSlug || null;

      if (resolvedTenantSlug !== activeTenantSlug) {
        setActiveTenantSlug(resolvedTenantSlug);
        persistTenantSlug(resolvedTenantSlug);
        setIsLoading(false);
        return;
      }

      const response = await apiClient.get<{ ok: boolean; tenant: Tenant }>("/v1/tenants/current");
      setTenant(response.tenant);
      if (response.tenant?.slug) {
        persistTenantSlug(response.tenant.slug);
      }
    } catch (refreshError) {
      const message = refreshError instanceof Error ? refreshError.message : "Failed to load tenant";
      setError(message);
      setTenant(null);
    } finally {
      setIsLoading(false);
    }
  }, [activeTenantSlug, isAuthenticated]);

  const switchTenant = useCallback(
    async (tenantSlug: string) => {
      if (!tenantSlug || tenantSlug === activeTenantSlug) {
        return;
      }

      const isValidTenant = availableTenants.some((membership) => membership.tenantSlug === tenantSlug);
      if (!isValidTenant) {
        setError("Selected tenant is not available for your account");
        return;
      }

      setActiveTenantSlug(tenantSlug);
      persistTenantSlug(tenantSlug);
    },
    [activeTenantSlug, availableTenants],
  );

  useEffect(() => {
    if (authLoading) {
      return;
    }

    void refresh();
  }, [authLoading, refresh]);

  const value = useMemo<TenantContextValue>(() => {
    const flags = Object.fromEntries((tenant?.featureFlags || []).map((flag) => [flag.key, flag.enabled]));

    return {
      tenant,
      availableTenants,
      activeTenantSlug,
      featureFlags: flags,
      isLoading: authLoading || isLoading,
      error,
      refresh,
      switchTenant,
    };
  }, [activeTenantSlug, authLoading, availableTenants, error, isLoading, refresh, switchTenant, tenant]);

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within TenantProvider");
  }

  return context;
}
