import { getPrismaClient } from "./db.js";

export async function writeAuditLog(req, input) {
  const prisma = getPrismaClient();

  if (!req.tenant?.id) {
    return null;
  }

  const metadata =
    input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata)
      ? { ...input.metadata }
      : input.metadata || null;
  const metadataWithActor =
    req.auth?.apiKey?.id && metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? {
          ...metadata,
          apiKeyId: req.auth.apiKey.id,
          apiKeyName: req.auth.apiKey.name,
        }
      : metadata;

  return prisma.auditLog.create({
    data: {
      tenantId: req.tenant.id,
      actorUserId: req.auth?.user?.id || null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId || null,
      metadata: metadataWithActor,
      ipAddress: req.ip || null,
      userAgent: req.header("user-agent") || null,
    },
  });
}
