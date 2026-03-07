import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireTenant } from "../../middleware/tenant.js";

export const userRouter = Router();

userRouter.get("/me/roles", requireAuth, requireTenant, (req, res) => {
  return res.json({
    ok: true,
    userId: req.auth.user.id,
    tenantId: req.tenant.id,
    roles: req.auth.activeTenant?.roleKeys || [],
    permissions: req.auth.activeTenant?.permissions || [],
  });
});
