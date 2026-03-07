import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const tenantFindUniqueMock = vi.fn();

vi.mock("../lib/db.js", () => ({
  getPrismaClient: () => ({
    tenant: {
      findUnique: tenantFindUniqueMock,
    },
  }),
}));

const { requireAuth } = await import("../middleware/auth.js");
const { requireTenant, resolveTenant } = await import("../middleware/tenant.js");
const { authRouter } = await import("../modules/auth/auth.routes.js");

function createMembership(tenantId, tenantSlug, roleKeys = ["agent"], permissions = ["conversation.read"]) {
  return {
    tenantId,
    tenantSlug,
    tenantName: tenantSlug,
    roleKeys,
    permissions,
  };
}

function createTestApp(memberships) {
  const app = express();

  app.use((req, _res, next) => {
    req.auth = {
      isAuthenticated: true,
      subject: "auth|user_1",
      claims: { sub: "auth|user_1", email: "user1@getswyft.local" },
      user: {
        id: "user_1",
        externalAuthId: "auth|user_1",
        email: "user1@getswyft.local",
        displayName: "User One",
      },
      memberships,
      roleKeys: Array.from(new Set(memberships.flatMap((entry) => entry.roleKeys))),
      permissions: Array.from(new Set(memberships.flatMap((entry) => entry.permissions))),
      activeTenant: null,
    };
    next();
  });

  app.use("/v1/auth", authRouter);
  app.get("/tenant-check", requireAuth, resolveTenant, requireTenant, (req, res) => {
    res.json({
      ok: true,
      tenantId: req.tenant.id,
      activeTenantId: req.auth.activeTenant?.tenantId || null,
      activeTenantSlug: req.auth.activeTenant?.tenantSlug || null,
    });
  });

  return app;
}

describe("auth + tenant switching flow", () => {
  beforeEach(() => {
    tenantFindUniqueMock.mockReset();
  });

  it("exposes memberships through auth endpoint", async () => {
    const memberships = [
      createMembership("tenant_alpha", "alpha", ["tenant_admin"], ["tenant.manage", "conversation.read"]),
      createMembership("tenant_beta", "beta", ["agent"], ["conversation.read"]),
    ];
    const app = createTestApp(memberships);

    const response = await request(app).get("/v1/auth/memberships");

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.memberships).toHaveLength(2);
    expect(response.body.memberships[0]).toMatchObject({
      tenantId: "tenant_alpha",
      tenantSlug: "alpha",
    });
  });

  it("switches tenant context based on x-tenant-slug header", async () => {
    const memberships = [
      createMembership("tenant_alpha", "alpha", ["tenant_admin"], ["tenant.manage", "conversation.read"]),
      createMembership("tenant_beta", "beta", ["agent"], ["conversation.read"]),
    ];
    const app = createTestApp(memberships);
    tenantFindUniqueMock.mockResolvedValueOnce({ id: "tenant_beta", slug: "beta" });

    const response = await request(app).get("/tenant-check").set("x-tenant-slug", "beta");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      ok: true,
      tenantId: "tenant_beta",
      activeTenantId: "tenant_beta",
      activeTenantSlug: "beta",
    });
    expect(tenantFindUniqueMock).toHaveBeenCalledWith({ where: { slug: "beta" } });
  });
});
