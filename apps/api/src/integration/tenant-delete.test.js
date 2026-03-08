import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const tenantFindUniqueMock = vi.fn();
const tenantDeleteMock = vi.fn();
const userRoleCountMock = vi.fn();

vi.mock("../lib/db.js", () => ({
  getPrismaClient: () => ({
    tenant: {
      findUnique: tenantFindUniqueMock,
      delete: tenantDeleteMock,
    },
    userRole: {
      count: userRoleCountMock,
    },
  }),
}));

const { tenantRouter } = await import("../modules/tenants/tenant.routes.js");

function createMembership(tenantId, tenantSlug, permissions = ["tenant.manage"]) {
  return {
    tenantId,
    tenantSlug,
    tenantName: tenantSlug,
    roleKeys: ["tenant_admin"],
    permissions,
  };
}

function createTestApp(memberships) {
  const app = express();
  app.use((req, _res, next) => {
    req.auth = {
      isAuthenticated: true,
      user: {
        id: "user_1",
        email: "admin@getswyft.local",
      },
      memberships,
      activeTenant: memberships[0] || null,
    };
    next();
  });
  app.use("/v1/tenants", tenantRouter);
  return app;
}

describe("tenant deletion", () => {
  beforeEach(() => {
    tenantFindUniqueMock.mockReset();
    tenantDeleteMock.mockReset();
    userRoleCountMock.mockReset();
  });

  it("deletes a tenant when user has tenant.manage and another membership remains", async () => {
    const app = createTestApp([
      createMembership("tenant_alpha", "alpha", ["tenant.manage", "conversation.read"]),
      createMembership("tenant_beta", "beta", ["tenant.manage", "conversation.read"]),
    ]);

    tenantFindUniqueMock.mockResolvedValueOnce({
      id: "tenant_alpha",
      slug: "alpha",
      name: "Alpha",
    });
    userRoleCountMock.mockResolvedValueOnce(1);
    tenantDeleteMock.mockResolvedValueOnce({
      id: "tenant_alpha",
    });

    const response = await request(app).delete("/v1/tenants/alpha");

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.tenant).toMatchObject({
      id: "tenant_alpha",
      slug: "alpha",
      name: "Alpha",
    });
    expect(response.body.nextActiveTenantSlug).toBe("beta");
    expect(tenantFindUniqueMock).toHaveBeenCalledWith({
      where: {
        slug: "alpha",
      },
      select: {
        id: true,
        slug: true,
        name: true,
      },
    });
    expect(userRoleCountMock).toHaveBeenCalledWith({
      where: {
        tenantId: "tenant_alpha",
        userId: "user_1",
      },
    });
    expect(tenantDeleteMock).toHaveBeenCalledWith({
      where: {
        id: "tenant_alpha",
      },
    });
  });

  it("blocks deletion when it is the user's only tenant membership", async () => {
    const app = createTestApp([createMembership("tenant_alpha", "alpha", ["tenant.manage"])]);

    const response = await request(app).delete("/v1/tenants/alpha");

    expect(response.status).toBe(400);
    expect(response.body.ok).toBe(false);
    expect(response.body.error).toContain("only workspace");
    expect(userRoleCountMock).not.toHaveBeenCalled();
    expect(tenantDeleteMock).not.toHaveBeenCalled();
  });

  it("blocks deletion when user lacks tenant.manage on target tenant", async () => {
    const app = createTestApp([
      createMembership("tenant_alpha", "alpha", ["conversation.read"]),
      createMembership("tenant_beta", "beta", ["tenant.manage"]),
    ]);

    const response = await request(app).delete("/v1/tenants/alpha");

    expect(response.status).toBe(403);
    expect(response.body.ok).toBe(false);
    expect(response.body.error).toContain("tenant.manage");
    expect(userRoleCountMock).not.toHaveBeenCalled();
    expect(tenantDeleteMock).not.toHaveBeenCalled();
  });
});
