import { Router } from "express";
import { getPrismaClient } from "../../lib/db.js";
import { writeAuditLog } from "../../lib/audit.js";
import { createUserNotification, disableNotificationDevice, upsertNotificationDevice } from "../../lib/push.js";
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

notificationRouter.post("/devices", requireAuth, requireTenant, async (req, res, next) => {
  try {
    const token = String(req.body?.token || "").trim();

    if (!token) {
      return res.status(400).json({
        ok: false,
        error: "token is required",
      });
    }

    const device = await upsertNotificationDevice({
      tenantId: req.tenant.id,
      userId: req.auth.user.id,
      token,
      deviceLabel: req.body?.deviceLabel ? String(req.body.deviceLabel).trim() : null,
      userAgent: req.header("user-agent"),
    });

    await writeAuditLog(req, {
      action: "notification.device_registered",
      entityType: "notification_device",
      entityId: device.id,
      metadata: {
        platform: device.platform,
        provider: device.provider,
      },
    });

    return res.status(201).json({
      ok: true,
      device: {
        id: device.id,
        platform: device.platform.toLowerCase(),
        provider: device.provider.toLowerCase(),
        lastSeenAt: device.lastSeenAt,
      },
    });
  } catch (error) {
    return next(error);
  }
});

notificationRouter.delete("/devices", requireAuth, requireTenant, async (req, res, next) => {
  try {
    const token = String(req.body?.token || "").trim();

    if (!token) {
      return res.status(400).json({
        ok: false,
        error: "token is required",
      });
    }

    await disableNotificationDevice({
      tenantId: req.tenant.id,
      userId: req.auth.user.id,
      token,
    });

    await writeAuditLog(req, {
      action: "notification.device_disabled",
      entityType: "notification_device",
      entityId: token,
    });

    return res.json({
      ok: true,
    });
  } catch (error) {
    return next(error);
  }
});

notificationRouter.post("/test", requireAuth, requireTenant, async (req, res, next) => {
  try {
    const notification = await createUserNotification({
      tenantId: req.tenant.id,
      userId: req.auth.user.id,
      type: "push.test",
      title: "Getswyft notifications are connected",
      body: "This test confirms Firebase Cloud Messaging is registered for your workspace session.",
      payload: {
        tenantSlug: req.tenant.slug,
      },
      link: `${req.header("origin") || ""}/app/inbox`,
    });

    return res.status(201).json({
      ok: true,
      notification,
    });
  } catch (error) {
    return next(error);
  }
});
