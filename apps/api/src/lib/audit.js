import { getPrismaClient } from "./db.js";

export async function writeAuditLog(req, input) {
  const prisma = getPrismaClient();

  if (!req.tenant?.id) {
    return null;
  }

  return prisma.auditLog.create({
    data: {
      tenantId: req.tenant.id,
      actorUserId: req.auth?.user?.id || null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId || null,
      metadata: input.metadata || null,
      ipAddress: req.ip || null,
      userAgent: req.header("user-agent") || null,
    },
  });
}
