import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { requireAuth } from "../middleware/auth.js";
import { requireTenant } from "../middleware/tenant.js";

function createTestApp() {
  const app = express();

  app.get("/protected", requireAuth, (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.get(
    "/tenant-protected",
    (req, _res, next) => {
      req.auth = {
        isAuthenticated: true,
        user: { id: "user_1" },
        activeTenant: null,
      };
      req.tenant = { id: "tenant_1" };
      next();
    },
    requireTenant,
    (_req, res) => {
      res.status(200).json({ ok: true });
    }
  );

  return app;
}

describe("protected routes", () => {
  it("returns 401 for unauthenticated request", async () => {
    const app = createTestApp();
    const response = await request(app).get("/protected");

    expect(response.status).toBe(401);
    expect(response.body.ok).toBe(false);
  });

  it("returns 403 for cross-tenant access without active membership", async () => {
    const app = createTestApp();
    const response = await request(app).get("/tenant-protected");

    expect(response.status).toBe(403);
    expect(response.body.ok).toBe(false);
  });
});
