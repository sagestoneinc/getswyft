import { Router } from "express";
import { getPrismaClient } from "../../lib/db.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireTenant } from "../../middleware/tenant.js";

export const tenantRouter = Router();

tenantRouter.get("/current", requireAuth, requireTenant, async (req, res, next) => {
  try {
    const prisma = getPrismaClient();

    const [branding, featureFlags] = await Promise.all([
      prisma.tenantBranding.findUnique({ where: { tenantId: req.tenant.id } }),
      prisma.tenantFeatureFlag.findMany({
        where: { tenantId: req.tenant.id },
        orderBy: { key: "asc" },
      }),
    ]);

    return res.json({
      ok: true,
      tenant: {
        id: req.tenant.id,
        slug: req.tenant.slug,
        name: req.tenant.name,
        status: req.tenant.status,
        branding,
        featureFlags: featureFlags.map((flag) => ({
          key: flag.key,
          enabled: flag.enabled,
          config: flag.config,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
});
