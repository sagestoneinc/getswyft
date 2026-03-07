import { Router } from "express";
import { getPrismaClient } from "../../lib/db.js";
import { writeAuditLog } from "../../lib/audit.js";
import { recordAnalyticsEvent } from "../../lib/analytics.js";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/rbac.js";
import { requireTenant } from "../../middleware/tenant.js";

export const complianceRouter = Router();

const VALID_EXPORT_TYPES = ["full_data", "conversations", "audit_logs", "users"];
const VALID_EXPORT_STATUSES = ["PENDING", "PROCESSING", "COMPLETED", "FAILED"];

function toMetadataObject(metadata) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  return metadata;
}

function serializeComplianceExport(complianceExport) {
  const metadata = toMetadataObject(complianceExport.metadata);
  const downloadUrl = typeof metadata.downloadUrl === "string" ? metadata.downloadUrl : null;

  return {
    id: complianceExport.id,
    exportType: complianceExport.exportType,
    status: complianceExport.status,
    storageKey: complianceExport.storageKey,
    completedAt: complianceExport.completedAt,
    metadata,
    downloadUrl,
    requestedByUserId: complianceExport.requestedByUserId,
    createdAt: complianceExport.createdAt,
    updatedAt: complianceExport.updatedAt,
  };
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

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
        exports: exports_.map(serializeComplianceExport),
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
        export: serializeComplianceExport(complianceExport),
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
        export: serializeComplianceExport(complianceExport),
      });
    } catch (error) {
      return next(error);
    }
  },
);

// PATCH /exports/:exportId — Update export status + metadata (admin lifecycle tracking)
complianceRouter.patch(
  "/exports/:exportId",
  requireAuth,
  requireTenant,
  requirePermission("tenant.manage"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();
      const existingExport = await prisma.complianceExport.findFirst({
        where: {
          id: req.params.exportId,
          tenantId: req.tenant.id,
        },
      });

      if (!existingExport) {
        return res.status(404).json({ ok: false, error: "Export not found" });
      }

      const data = {};
      const metadata = toMetadataObject(existingExport.metadata);

      if (hasOwn(req.body || {}, "status")) {
        const normalizedStatus = String(req.body?.status || "").trim().toUpperCase();
        if (!VALID_EXPORT_STATUSES.includes(normalizedStatus)) {
          return res.status(400).json({
            ok: false,
            error: `status must be one of: ${VALID_EXPORT_STATUSES.join(", ")}`,
          });
        }
        data.status = normalizedStatus;
        data.completedAt = normalizedStatus === "COMPLETED" ? new Date() : null;
      }

      if (hasOwn(req.body || {}, "storageKey")) {
        const storageKey = String(req.body?.storageKey || "").trim();
        data.storageKey = storageKey || null;
      }

      if (hasOwn(req.body || {}, "metadata")) {
        if (!req.body?.metadata || typeof req.body.metadata !== "object" || Array.isArray(req.body.metadata)) {
          return res.status(400).json({
            ok: false,
            error: "metadata must be an object",
          });
        }
        Object.assign(metadata, req.body.metadata);
      }

      if (hasOwn(req.body || {}, "downloadUrl")) {
        const downloadUrl = String(req.body?.downloadUrl || "").trim();
        if (downloadUrl) {
          let parsedUrl = null;
          try {
            parsedUrl = new URL(downloadUrl);
          } catch (_error) {
            parsedUrl = null;
          }
          if (!parsedUrl || !["http:", "https:"].includes(parsedUrl.protocol)) {
            return res.status(400).json({
              ok: false,
              error: "downloadUrl must be a valid HTTP(S) URL",
            });
          }
          metadata.downloadUrl = downloadUrl;
        } else {
          delete metadata.downloadUrl;
        }
      }

      if (hasOwn(req.body || {}, "error")) {
        const errorMessage = String(req.body?.error || "").trim();
        if (errorMessage) {
          metadata.error = errorMessage;
        } else {
          delete metadata.error;
        }
      }

      if (Object.keys(metadata).length) {
        data.metadata = metadata;
      } else if (
        hasOwn(req.body || {}, "metadata") ||
        hasOwn(req.body || {}, "downloadUrl") ||
        hasOwn(req.body || {}, "error")
      ) {
        data.metadata = {};
      }

      if (!Object.keys(data).length) {
        return res.status(400).json({
          ok: false,
          error: "No supported export changes were provided",
        });
      }

      const updatedExport = await prisma.complianceExport.update({
        where: {
          id: existingExport.id,
        },
        data,
      });

      await Promise.all([
        writeAuditLog(req, {
          action: "compliance.export_updated",
          entityType: "compliance_export",
          entityId: updatedExport.id,
          metadata: {
            status: updatedExport.status,
            hasDownloadUrl: Boolean(toMetadataObject(updatedExport.metadata).downloadUrl),
          },
        }),
        recordAnalyticsEvent(req, {
          eventName: "compliance.export_updated",
          eventCategory: "compliance",
          metadata: {
            exportId: updatedExport.id,
            status: updatedExport.status,
          },
        }),
      ]);

      return res.json({
        ok: true,
        export: serializeComplianceExport(updatedExport),
      });
    } catch (error) {
      return next(error);
    }
  },
);

// GET /exports/:exportId/download — Resolve a tracked download URL for a completed export
complianceRouter.get(
  "/exports/:exportId/download",
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

      if (complianceExport.status !== "COMPLETED") {
        return res.status(409).json({
          ok: false,
          error: "Export is not completed yet",
        });
      }

      const metadata = toMetadataObject(complianceExport.metadata);
      const downloadUrl = typeof metadata.downloadUrl === "string" ? metadata.downloadUrl : "";

      if (!downloadUrl) {
        return res.status(404).json({
          ok: false,
          error: "No download URL has been published for this export",
        });
      }

      return res.json({
        ok: true,
        exportId: complianceExport.id,
        downloadUrl,
      });
    } catch (error) {
      return next(error);
    }
  },
);
