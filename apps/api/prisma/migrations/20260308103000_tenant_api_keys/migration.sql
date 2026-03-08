-- CreateTable
CREATE TABLE "TenantApiKey" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "createdByUserId" TEXT,
  "name" TEXT NOT NULL,
  "keyPrefix" TEXT NOT NULL,
  "secretHash" TEXT NOT NULL,
  "permissions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "lastUsedAt" TIMESTAMP(3),
  "lastUsedIp" TEXT,
  "disabledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TenantApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenantApiKey_keyPrefix_key" ON "TenantApiKey"("keyPrefix");

-- CreateIndex
CREATE UNIQUE INDEX "TenantApiKey_secretHash_key" ON "TenantApiKey"("secretHash");

-- CreateIndex
CREATE INDEX "TenantApiKey_tenantId_disabledAt_createdAt_idx" ON "TenantApiKey"("tenantId", "disabledAt", "createdAt");

-- CreateIndex
CREATE INDEX "TenantApiKey_tenantId_name_createdAt_idx" ON "TenantApiKey"("tenantId", "name", "createdAt");

-- AddForeignKey
ALTER TABLE "TenantApiKey"
ADD CONSTRAINT "TenantApiKey_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantApiKey"
ADD CONSTRAINT "TenantApiKey_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
