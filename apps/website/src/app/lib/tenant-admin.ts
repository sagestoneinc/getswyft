import { apiClient } from "./api-client";

export type FallbackCandidate = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "agent";
  roleKeys: string[];
};

export type TenantRoutingSettings = {
  routingMode: "manual" | "first_available" | "round_robin";
  officeHoursEnabled: boolean;
  timezone: string;
  officeHoursStart: string;
  officeHoursEnd: string;
  afterHoursMessage: string;
  fallbackUserId: string | null;
  fallbackUserName: string | null;
};

export type WebhookEndpoint = {
  id: string;
  url: string;
  description: string | null;
  status: "active" | "disabled";
  eventTypes: string[];
  hasSigningSecret: boolean;
  createdAt: string;
  updatedAt: string;
  lastDeliveredAt: string | null;
  lastErrorAt: string | null;
};

export type WebhookDelivery = {
  id: string;
  endpointId: string;
  endpointUrl: string;
  eventType: string;
  status: "pending" | "success" | "failed";
  statusCode: number | null;
  requestId: string | null;
  responseBody: string | null;
  durationMs: number | null;
  attemptedAt: string;
};

export type WebhookDeliveryDetails = {
  delivery: WebhookDelivery;
  payload: unknown;
};

export type BillingSubscription = {
  provider: string;
  planKey: string;
  planName: string;
  interval: "monthly" | "yearly";
  status: "trialing" | "active" | "past_due" | "canceled";
  seatPriceCents: number;
  currency: string;
  activeSeats: number;
  monthlySubtotalCents: number;
  nextBillingAt: string | null;
};

export type BillingInvoice = {
  id: string;
  invoiceNumber: string;
  status: "draft" | "open" | "paid" | "void";
  amountCents: number;
  currency: string;
  issuedAt: string;
  periodStart: string | null;
  periodEnd: string | null;
  paidAt: string | null;
  hostedUrl: string | null;
};

export type CreatedTenant = {
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

export async function createTenant(payload: {
  name: string;
  slug?: string;
  supportEmail?: string;
  primaryColor?: string;
}) {
  return apiClient.post<{
    ok: boolean;
    tenant: CreatedTenant;
  }>("/v1/tenants", payload);
}

export async function getTenantSettings() {
  return apiClient.get<{
    ok: boolean;
    settings: TenantRoutingSettings;
    fallbackCandidates: FallbackCandidate[];
  }>("/v1/tenants/current/settings");
}

export async function updateTenantSettings(payload: Partial<TenantRoutingSettings>) {
  return apiClient.patch<{
    ok: boolean;
    settings: TenantRoutingSettings;
    fallbackCandidates: FallbackCandidate[];
  }>("/v1/tenants/current/settings", payload);
}

export async function getWebhookWorkspace() {
  return apiClient.get<{
    ok: boolean;
    supportedEvents: string[];
    endpoints: WebhookEndpoint[];
    deliveries: WebhookDelivery[];
  }>("/v1/tenants/current/webhooks");
}

export async function getWebhookDelivery(deliveryId: string) {
  return apiClient.get<{
    ok: boolean;
    delivery: WebhookDelivery;
    payload: unknown;
  }>(`/v1/tenants/current/webhooks/deliveries/${deliveryId}`);
}

export async function retryWebhookDelivery(deliveryId: string) {
  return apiClient.post<{
    ok: boolean;
    dispatched: number;
    delivery: WebhookDelivery | null;
  }>(`/v1/tenants/current/webhooks/deliveries/${deliveryId}/retry`, {});
}

export async function createWebhookEndpoint(payload: {
  url: string;
  description?: string;
  eventTypes: string[];
}) {
  return apiClient.post<{
    ok: boolean;
    endpoint: WebhookEndpoint;
    signingSecret: string;
  }>("/v1/tenants/current/webhooks", payload);
}

export async function updateWebhookEndpoint(
  endpointId: string,
  payload: {
    url?: string;
    description?: string;
    status?: "active" | "disabled";
    eventTypes?: string[];
  },
) {
  return apiClient.patch<{
    ok: boolean;
    endpoint: WebhookEndpoint;
  }>(`/v1/tenants/current/webhooks/${endpointId}`, payload);
}

export async function deleteWebhookEndpoint(endpointId: string) {
  return apiClient.delete<{
    ok: boolean;
    deletedId: string;
  }>(`/v1/tenants/current/webhooks/${endpointId}`);
}

export async function sendTestWebhook(endpointId: string) {
  return apiClient.post<{
    ok: boolean;
    dispatched: number;
  }>(`/v1/tenants/current/webhooks/${endpointId}/test`, {});
}

export async function getBillingWorkspace() {
  return apiClient.get<{
    ok: boolean;
    billing: {
      subscription: BillingSubscription | null;
      invoices: BillingInvoice[];
    };
  }>("/v1/tenants/current/billing");
}

export function formatCurrency(cents: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(cents / 100);
}
