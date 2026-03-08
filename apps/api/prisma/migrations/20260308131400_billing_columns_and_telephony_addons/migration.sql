-- AlterTable: Add Paddle and Braintree columns to BillingSubscription
ALTER TABLE "BillingSubscription" ADD COLUMN "paddleCustomerId" TEXT;
ALTER TABLE "BillingSubscription" ADD COLUMN "paddleSubscriptionId" TEXT;
ALTER TABLE "BillingSubscription" ADD COLUMN "braintreeCustomerId" TEXT;
ALTER TABLE "BillingSubscription" ADD COLUMN "braintreeSubscriptionId" TEXT;

-- CreateIndex
CREATE INDEX "BillingSubscription_paddleCustomerId_idx" ON "BillingSubscription"("paddleCustomerId");

-- CreateIndex
CREATE INDEX "BillingSubscription_paddleSubscriptionId_idx" ON "BillingSubscription"("paddleSubscriptionId");

-- CreateIndex
CREATE INDEX "BillingSubscription_braintreeCustomerId_idx" ON "BillingSubscription"("braintreeCustomerId");

-- CreateIndex
CREATE INDEX "BillingSubscription_braintreeSubscriptionId_idx" ON "BillingSubscription"("braintreeSubscriptionId");

-- CreateEnum
CREATE TYPE "PhoneNumberStatus" AS ENUM ('ACTIVE', 'RELEASED');

-- CreateEnum
CREATE TYPE "SipTrunkStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateTable
CREATE TABLE "TenantPhoneNumber" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "label" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'telnyx',
    "capabilities" JSONB,
    "status" "PhoneNumberStatus" NOT NULL DEFAULT 'ACTIVE',
    "monthlyCostCents" INTEGER NOT NULL DEFAULT 100,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "provisionedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantPhoneNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantSipTrunk" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 5060,
    "transport" TEXT NOT NULL DEFAULT 'udp',
    "username" TEXT,
    "password" TEXT,
    "realm" TEXT,
    "outboundProxy" TEXT,
    "status" "SipTrunkStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantSipTrunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenantPhoneNumber_tenantId_phoneNumber_key" ON "TenantPhoneNumber"("tenantId", "phoneNumber");

-- CreateIndex
CREATE INDEX "TenantPhoneNumber_tenantId_status_idx" ON "TenantPhoneNumber"("tenantId", "status");

-- CreateIndex
CREATE INDEX "TenantSipTrunk_tenantId_status_idx" ON "TenantSipTrunk"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "TenantPhoneNumber"
ADD CONSTRAINT "TenantPhoneNumber_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantSipTrunk"
ADD CONSTRAINT "TenantSipTrunk_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
