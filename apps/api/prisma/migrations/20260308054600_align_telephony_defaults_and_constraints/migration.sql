-- AlterTable: Change TenantPhoneNumber provider default from 'telnyx' to 'manual'
ALTER TABLE "TenantPhoneNumber" ALTER COLUMN "provider" SET DEFAULT 'manual';

-- AlterTable: Change TenantSipTrunk transport default from 'udp' to 'tls'
ALTER TABLE "TenantSipTrunk" ALTER COLUMN "transport" SET DEFAULT 'tls';

-- DropIndex: Remove old unique constraint on (tenantId, phoneNumber)
DROP INDEX IF EXISTS "TenantPhoneNumber_tenantId_phoneNumber_key";

-- CreateIndex: Add new unique constraint on (tenantId, phoneNumber, status)
CREATE UNIQUE INDEX "TenantPhoneNumber_tenantId_phoneNumber_status_key" ON "TenantPhoneNumber"("tenantId", "phoneNumber", "status");
