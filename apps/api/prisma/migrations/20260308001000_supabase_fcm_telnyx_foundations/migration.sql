CREATE TYPE "NotificationDeviceProvider" AS ENUM ('FCM');
CREATE TYPE "NotificationDevicePlatform" AS ENUM ('WEB');

CREATE TABLE "NotificationDevice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "NotificationDeviceProvider" NOT NULL DEFAULT 'FCM',
    "platform" "NotificationDevicePlatform" NOT NULL DEFAULT 'WEB',
    "token" TEXT NOT NULL,
    "deviceLabel" TEXT,
    "userAgent" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disabledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NotificationDevice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotificationDevice_token_key" ON "NotificationDevice"("token");
CREATE INDEX "NotificationDevice_tenantId_userId_disabledAt_idx" ON "NotificationDevice"("tenantId", "userId", "disabledAt");
CREATE INDEX "NotificationDevice_tenantId_provider_platform_idx" ON "NotificationDevice"("tenantId", "provider", "platform");

ALTER TABLE "NotificationDevice" ADD CONSTRAINT "NotificationDevice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationDevice" ADD CONSTRAINT "NotificationDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
