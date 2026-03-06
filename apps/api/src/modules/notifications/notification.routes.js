import { Router } from "express";
import { getPrismaClient } from "../../lib/db.js";
import { writeAuditLog } from "../../lib/audit.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireTenant } from "../../middleware/tenant.js";

export const notificationRouter = Router();

notificationRouter.get("/", requireAuth, requireTenant, async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const limit = Math.min(Number(req.query.limit) || 20, 100);

    const notifications = await prisma.notification.findMany({
      where: {
        tenantId: req.tenant.id,
        userId: req.auth.user.id,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return res.json({
      ok: true,
      notifications,
    });
  } catch (error) {
    return next(error);
  }
});

notificationRouter.post("/:id/read", requireAuth, requireTenant, async (req, res, next) => {
  try {
    const prisma = getPrismaClient();

    const notification = await prisma.notification.updateMany({
      where: {
        id: req.params.id,
        tenantId: req.tenant.id,
        userId: req.auth.user.id,
      },
      data: {
        readAt: new Date(),
      },
    });

    await writeAuditLog(req, {
      action: "notification.mark_read",
      entityType: "notification",
      entityId: req.params.id,
      metadata: {
        updatedCount: notification.count,
      },
    });

    return res.json({
      ok: true,
      updatedCount: notification.count,
    });
  } catch (error) {
    return next(error);
  }
});
