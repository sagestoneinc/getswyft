import { Router } from "express";
import { getPrismaClient } from "../../lib/db.js";
import { recordAnalyticsEvent } from "../../lib/analytics.js";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/rbac.js";
import { requireTenant } from "../../middleware/tenant.js";

export const analyticsRouter = Router();

analyticsRouter.post("/events", requireAuth, requireTenant, async (req, res, next) => {
  try {
    const eventName = String(req.body?.eventName || "").trim();
    if (!eventName) {
      return res.status(400).json({
        ok: false,
        error: "eventName is required",
      });
    }

    await recordAnalyticsEvent(req, {
      eventName,
      eventCategory: req.body?.eventCategory,
      value: typeof req.body?.value === "number" ? req.body.value : undefined,
      metadata: req.body?.metadata || null,
      occurredAt: req.body?.occurredAt,
    });

    return res.status(202).json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

analyticsRouter.get(
  "/summary",
  requireAuth,
  requireTenant,
  requirePermission("analytics.read"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();
      const since = req.query.since ? new Date(String(req.query.since)) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [totalEvents, activeUsers, messageEvents, callEvents] = await Promise.all([
        prisma.analyticsEvent.count({
          where: {
            tenantId: req.tenant.id,
            occurredAt: { gte: since },
          },
        }),
        prisma.analyticsEvent.findMany({
          where: {
            tenantId: req.tenant.id,
            occurredAt: { gte: since },
            userId: { not: null },
          },
          distinct: ["userId"],
          select: { userId: true },
        }),
        prisma.analyticsEvent.count({
          where: {
            tenantId: req.tenant.id,
            occurredAt: { gte: since },
            eventCategory: "message",
          },
        }),
        prisma.analyticsEvent.count({
          where: {
            tenantId: req.tenant.id,
            occurredAt: { gte: since },
            eventCategory: "call",
          },
        }),
      ]);

      return res.json({
        ok: true,
        summary: {
          since,
          totalEvents,
          activeUsers: activeUsers.length,
          messageEvents,
          callEvents,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);
