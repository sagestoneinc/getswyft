import { Router } from "express";
import { getPrismaClient } from "../../lib/db.js";
import { writeAuditLog } from "../../lib/audit.js";
import { recordAnalyticsEvent } from "../../lib/analytics.js";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/rbac.js";
import { requireTenant } from "../../middleware/tenant.js";

export const moderationRouter = Router();

const VALID_STATUSES = ["OPEN", "REVIEWING", "RESOLVED", "DISMISSED"];

// GET / — List moderation reports for the current tenant
moderationRouter.get(
  "/",
  requireAuth,
  requireTenant,
  requirePermission("moderation.manage"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const where = { tenantId: req.tenant.id };

      if (req.query.status) {
        const normalized = req.query.status.trim().toUpperCase();
        if (VALID_STATUSES.includes(normalized)) {
          where.status = normalized;
        }
      }

      const reports = await prisma.moderationReport.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      return res.json({
        ok: true,
        reports: reports.map((report) => ({
          id: report.id,
          targetType: report.targetType,
          targetId: report.targetId,
          reason: report.reason,
          status: report.status,
          details: report.details,
          reporterUserId: report.reporterUserId,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
        })),
      });
    } catch (error) {
      return next(error);
    }
  },
);

// POST / — Create a moderation report
moderationRouter.post(
  "/",
  requireAuth,
  requireTenant,
  requirePermission("conversation.write"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const targetType = String(req.body?.targetType || "").trim();
      const targetId = String(req.body?.targetId || "").trim();
      const reason = String(req.body?.reason || "").trim();

      if (!targetType) {
        return res.status(400).json({ ok: false, error: "targetType is required" });
      }

      if (!targetId) {
        return res.status(400).json({ ok: false, error: "targetId is required" });
      }

      if (!reason) {
        return res.status(400).json({ ok: false, error: "reason is required" });
      }

      const report = await prisma.moderationReport.create({
        data: {
          tenantId: req.tenant.id,
          reporterUserId: req.auth.user.id,
          targetType,
          targetId,
          reason,
          details: req.body?.details ?? undefined,
        },
      });

      await Promise.all([
        writeAuditLog(req, {
          action: "moderation.report_created",
          entityType: "moderation_report",
          entityId: report.id,
          metadata: { targetType, targetId, reason },
        }),
        recordAnalyticsEvent(req, {
          eventName: "moderation.report_created",
          eventCategory: "moderation",
          metadata: { reportId: report.id, targetType, targetId },
        }),
      ]);

      return res.status(201).json({
        ok: true,
        report: {
          id: report.id,
          targetType: report.targetType,
          targetId: report.targetId,
          reason: report.reason,
          status: report.status,
          details: report.details,
          reporterUserId: report.reporterUserId,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
        },
      });
    } catch (error) {
      return next(error);
    }
  },
);

// GET /:reportId — Get moderation report details
moderationRouter.get(
  "/:reportId",
  requireAuth,
  requireTenant,
  requirePermission("moderation.manage"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const report = await prisma.moderationReport.findFirst({
        where: {
          id: req.params.reportId,
          tenantId: req.tenant.id,
        },
      });

      if (!report) {
        return res.status(404).json({ ok: false, error: "Report not found" });
      }

      return res.json({
        ok: true,
        report: {
          id: report.id,
          targetType: report.targetType,
          targetId: report.targetId,
          reason: report.reason,
          status: report.status,
          details: report.details,
          reporterUserId: report.reporterUserId,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
        },
      });
    } catch (error) {
      return next(error);
    }
  },
);

// PATCH /:reportId — Update moderation report status
moderationRouter.patch(
  "/:reportId",
  requireAuth,
  requireTenant,
  requirePermission("moderation.manage"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const status = String(req.body?.status || "").trim().toUpperCase();

      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          ok: false,
          error: `status must be one of: ${VALID_STATUSES.join(", ").toLowerCase()}`,
        });
      }

      const report = await prisma.moderationReport.findFirst({
        where: {
          id: req.params.reportId,
          tenantId: req.tenant.id,
        },
      });

      if (!report) {
        return res.status(404).json({ ok: false, error: "Report not found" });
      }

      const updated = await prisma.moderationReport.update({
        where: { id: report.id },
        data: { status },
      });

      await writeAuditLog(req, {
        action: "moderation.report_updated",
        entityType: "moderation_report",
        entityId: report.id,
        metadata: { previousStatus: report.status, newStatus: status },
      });

      return res.json({
        ok: true,
        report: {
          id: updated.id,
          targetType: updated.targetType,
          targetId: updated.targetId,
          reason: updated.reason,
          status: updated.status,
          details: updated.details,
          reporterUserId: updated.reporterUserId,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        },
      });
    } catch (error) {
      return next(error);
    }
  },
);
