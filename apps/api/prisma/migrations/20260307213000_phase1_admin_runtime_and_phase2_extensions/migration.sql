CREATE TYPE "RoutingMode" AS ENUM ('MANUAL', 'FIRST_AVAILABLE', 'ROUND_ROBIN');
CREATE TYPE "WebhookEndpointStatus" AS ENUM ('ACTIVE', 'DISABLED');
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'YEARLY');
CREATE TYPE "BillingSubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED');
CREATE TYPE "BillingInvoiceStatus" AS ENUM ('DRAFT', 'OPEN', 'PAID', 'VOID');

CREATE TABLE "TenantRoutingSettings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "routingMode" "RoutingMode" NOT NULL DEFAULT 'ROUND_ROBIN',
    "officeHoursEnabled" BOOLEAN NOT NULL DEFAULT true,
    "timezone" TEXT NOT NULL DEFAULT 'America/Chicago',
    "officeHoursStart" TEXT NOT NULL DEFAULT '09:00',
    "officeHoursEnd" TEXT NOT NULL DEFAULT '18:00',
    "fallbackUserId" TEXT,
    "afterHoursMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantRoutingSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WebhookEndpoint" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "status" "WebhookEndpointStatus" NOT NULL DEFAULT 'ACTIVE',
    "signingSecret" TEXT,
    "eventTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "lastDeliveredAt" TIMESTAMP(3),
    "lastErrorAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" "WebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "statusCode" INTEGER,
    "requestId" TEXT,
    "responseBody" TEXT,
    "payload" JSONB,
    "durationMs" INTEGER,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillingSubscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'manual',
    "planKey" TEXT NOT NULL DEFAULT 'professional',
    "planName" TEXT NOT NULL DEFAULT 'Professional',
    "interval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY',
    "status" "BillingSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "seatPriceCents" INTEGER NOT NULL DEFAULT 4900,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "activeSeats" INTEGER NOT NULL DEFAULT 1,
    "nextBillingAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillingInvoice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "status" "BillingInvoiceStatus" NOT NULL DEFAULT 'PAID',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "hostedUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingInvoice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TenantRoutingSettings_tenantId_key" ON "TenantRoutingSettings"("tenantId");
CREATE INDEX "WebhookEndpoint_tenantId_status_createdAt_idx" ON "WebhookEndpoint"("tenantId", "status", "createdAt");
CREATE INDEX "WebhookDelivery_tenantId_attemptedAt_idx" ON "WebhookDelivery"("tenantId", "attemptedAt");
CREATE INDEX "WebhookDelivery_endpointId_attemptedAt_idx" ON "WebhookDelivery"("endpointId", "attemptedAt");
CREATE UNIQUE INDEX "BillingSubscription_tenantId_key" ON "BillingSubscription"("tenantId");
CREATE UNIQUE INDEX "BillingInvoice_invoiceNumber_key" ON "BillingInvoice"("invoiceNumber");
CREATE INDEX "BillingInvoice_tenantId_issuedAt_idx" ON "BillingInvoice"("tenantId", "issuedAt");
CREATE INDEX "BillingInvoice_subscriptionId_issuedAt_idx" ON "BillingInvoice"("subscriptionId", "issuedAt");

ALTER TABLE "TenantRoutingSettings" ADD CONSTRAINT "TenantRoutingSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TenantRoutingSettings" ADD CONSTRAINT "TenantRoutingSettings_fallbackUserId_fkey" FOREIGN KEY ("fallbackUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WebhookEndpoint" ADD CONSTRAINT "WebhookEndpoint_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "WebhookEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingSubscription" ADD CONSTRAINT "BillingSubscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingInvoice" ADD CONSTRAINT "BillingInvoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingInvoice" ADD CONSTRAINT "BillingInvoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "BillingSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
