import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireTenant } from "../../middleware/tenant.js";

export const authRouter = Router();

authRouter.get("/me", requireAuth, requireTenant, (req, res) => {
  res.json({
    ok: true,
    user: {
      id: req.auth.user.id,
      externalAuthId: req.auth.user.externalAuthId,
      email: req.auth.user.email,
      displayName: req.auth.user.displayName,
    },
    tenant: {
      id: req.tenant.id,
      slug: req.tenant.slug,
      name: req.tenant.name,
    },
    roles: req.auth.activeTenant?.roleKeys || [],
    permissions: req.auth.activeTenant?.permissions || [],
  });
});
