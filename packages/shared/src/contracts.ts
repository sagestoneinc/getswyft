import type { PermissionKey } from "./permissions";

export interface AuthMeResponse {
  ok: boolean;
  user: {
    id: string;
    externalAuthId: string;
    email: string;
    displayName: string | null;
  };
  tenant: {
    id: string;
    slug: string;
    name: string;
  };
  roles: string[];
  permissions: PermissionKey[];
}

export interface TenantCurrentResponse {
  ok: boolean;
  tenant: {
    id: string;
    slug: string;
    name: string;
    status: "ACTIVE" | "SUSPENDED" | "DELETED";
    branding: {
      id: string;
      tenantId: string;
      primaryColor: string | null;
      logoUrl: string | null;
      supportEmail: string | null;
      createdAt: string;
      updatedAt: string;
    } | null;
    featureFlags: Array<{
      key: string;
      enabled: boolean;
      config: unknown;
    }>;
  };
}

export interface NotificationListResponse {
  ok: boolean;
  notifications: Array<{
    id: string;
    tenantId: string;
    userId: string;
    type: string;
    title: string;
    body: string | null;
    payload: unknown;
    readAt: string | null;
    createdAt: string;
  }>;
}

export interface RealtimePresenceEvent {
  userId: string;
  tenantId: string;
  status: "ONLINE" | "AWAY" | "BUSY" | "OFFLINE";
  socketId: string;
  updatedAt: string;
}
