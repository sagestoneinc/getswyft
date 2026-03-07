import { Router } from "express";
import { getPrismaClient } from "../../lib/db.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireAnyPermission } from "../../middleware/rbac.js";
import { requireTenant } from "../../middleware/tenant.js";

export const auditRouter = Router();

auditRouter.get(
  "/",
  requireAuth,
  requireTenant,
  requireAnyPermission(["tenant.manage", "analytics.read"]),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();
      const limit = Math.min(Number(req.query.limit) || 50, 200);
      const cursor = req.query.cursor ? String(req.query.cursor) : null;

      const logs = await prisma.auditLog.findMany({
        where: {
          tenantId: req.tenant.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        ...(cursor
          ? {
              skip: 1,
              cursor: {
                id: cursor,
              },
            }
          : {}),
      });

      const nextCursor = logs.length === limit ? logs[logs.length - 1].id : null;

      return res.json({
        ok: true,
        logs,
        nextCursor,
      });
    } catch (error) {
      return next(error);
    }
  }
);
