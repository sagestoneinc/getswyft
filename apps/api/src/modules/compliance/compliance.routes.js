import { Router } from "express";
import { getPrismaClient } from "../../lib/db.js";
import { writeAuditLog } from "../../lib/audit.js";
import { recordAnalyticsEvent } from "../../lib/analytics.js";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/rbac.js";
import { requireTenant } from "../../middleware/tenant.js";

export const complianceRouter = Router();

const VALID_EXPORT_TYPES = ["full_data", "conversations", "audit_logs", "users"];

// GET /exports — List compliance exports for the current tenant
complianceRouter.get(
  "/exports",
  requireAuth,
  requireTenant,
  requirePermission("tenant.manage"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const exports_ = await prisma.complianceExport.findMany({
        where: { tenantId: req.tenant.id },
        orderBy: { createdAt: "desc" },
      });

      return res.json({
        ok: true,
        exports: exports_.map((entry) => ({
          id: entry.id,
          exportType: entry.exportType,
          status: entry.status,
          storageKey: entry.storageKey,
          completedAt: entry.completedAt,
          metadata: entry.metadata,
          requestedByUserId: entry.requestedByUserId,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        })),
      });
    } catch (error) {
      return next(error);
    }
  },
);

// POST /exports — Request a new compliance data export
complianceRouter.post(
  "/exports",
  requireAuth,
  requireTenant,
  requirePermission("tenant.manage"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const exportType = String(req.body?.exportType || "").trim();

      if (!VALID_EXPORT_TYPES.includes(exportType)) {
        return res.status(400).json({
          ok: false,
          error: `exportType must be one of: ${VALID_EXPORT_TYPES.join(", ")}`,
        });
      }

      const complianceExport = await prisma.complianceExport.create({
        data: {
          tenantId: req.tenant.id,
          requestedByUserId: req.auth.user.id,
          exportType,
        },
      });

      await Promise.all([
        writeAuditLog(req, {
          action: "compliance.export_requested",
          entityType: "compliance_export",
          entityId: complianceExport.id,
          metadata: { exportType },
        }),
        recordAnalyticsEvent(req, {
          eventName: "compliance.export_requested",
          eventCategory: "compliance",
          metadata: { exportId: complianceExport.id, exportType },
        }),
      ]);

      return res.status(201).json({
        ok: true,
        export: {
          id: complianceExport.id,
          exportType: complianceExport.exportType,
          status: complianceExport.status,
          storageKey: complianceExport.storageKey,
          completedAt: complianceExport.completedAt,
          metadata: complianceExport.metadata,
          requestedByUserId: complianceExport.requestedByUserId,
          createdAt: complianceExport.createdAt,
          updatedAt: complianceExport.updatedAt,
        },
      });
    } catch (error) {
      return next(error);
    }
  },
);

// GET /exports/:exportId — Get compliance export details
complianceRouter.get(
  "/exports/:exportId",
  requireAuth,
  requireTenant,
  requirePermission("tenant.manage"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const complianceExport = await prisma.complianceExport.findFirst({
        where: {
          id: req.params.exportId,
          tenantId: req.tenant.id,
        },
      });

      if (!complianceExport) {
        return res.status(404).json({ ok: false, error: "Export not found" });
      }

      return res.json({
        ok: true,
        export: {
          id: complianceExport.id,
          exportType: complianceExport.exportType,
          status: complianceExport.status,
          storageKey: complianceExport.storageKey,
          completedAt: complianceExport.completedAt,
          metadata: complianceExport.metadata,
          requestedByUserId: complianceExport.requestedByUserId,
          createdAt: complianceExport.createdAt,
          updatedAt: complianceExport.updatedAt,
        },
      });
    } catch (error) {
      return next(error);
    }
  },
);
