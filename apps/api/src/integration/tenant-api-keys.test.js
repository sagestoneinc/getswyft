import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const permissionFindManyMock = vi.fn();
const tenantApiKeyCreateMock = vi.fn();

vi.mock("../lib/db.js", () => ({
  getPrismaClient: () => ({
    permission: {
      findMany: permissionFindManyMock,
    },
    tenantApiKey: {
      create: tenantApiKeyCreateMock,
    },
  }),
}));

vi.mock("../lib/audit.js", () => ({
  writeAuditLog: vi.fn().mockResolvedValue({}),
}));

vi.mock("../lib/api-keys.js", () => ({
  generateTenantApiKeyValue: vi.fn(() => ({
    rawKey: "swyft_live_public.secret",
    keyPrefix: "swyft_live_public",
    secretHash: "hash-value",
  })),
  maskApiKeyPrefix: vi.fn((value) => value),
  normalizeApiKeyPermissions: vi.fn((permissions) => permissions),
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

function createTestApp() {
  const membership = createMembership("tenant_1", "default", ["tenant.manage"]);
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.context = {
      requestId: "req_1",
    };
    req.auth = {
      isAuthenticated: true,
      user: {
        id: "user_1",
        email: "admin@example.com",
        displayName: "Admin",
      },
      memberships: [membership],
      activeTenant: membership,
    };
    req.tenant = {
      id: "tenant_1",
      slug: "default",
      name: "Default",
    };
    next();
  });
  app.use("/v1/tenants", tenantRouter);
  return app;
}

describe("tenant api key routes", () => {
  beforeEach(() => {
    permissionFindManyMock.mockReset();
    tenantApiKeyCreateMock.mockReset();
  });

  it("creates a tenant api key with validated permissions", async () => {
    const app = createTestApp();

    permissionFindManyMock.mockResolvedValueOnce([
      { key: "conversation.read" },
      { key: "analytics.read" },
    ]);
    tenantApiKeyCreateMock.mockResolvedValueOnce({
      id: "key_1",
      tenantId: "tenant_1",
      name: "CRM ingest",
      keyPrefix: "swyft_live_public",
      permissions: ["conversation.read", "analytics.read"],
      lastUsedAt: null,
      lastUsedIp: null,
      disabledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdByUser: {
        id: "user_1",
        email: "admin@example.com",
        displayName: "Admin",
      },
    });

    const response = await request(app).post("/v1/tenants/current/api-keys").send({
      name: "CRM ingest",
      permissions: ["conversation.read", "analytics.read"],
    });

    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);
    expect(response.body.token).toBe("swyft_live_public.secret");
    expect(tenantApiKeyCreateMock).toHaveBeenCalledWith({
      data: {
        tenantId: "tenant_1",
        createdByUserId: "user_1",
        name: "CRM ingest",
        keyPrefix: "swyft_live_public",
        secretHash: "hash-value",
        permissions: ["conversation.read", "analytics.read"],
      },
      include: {
        createdByUser: true,
      },
    });
  });
});
