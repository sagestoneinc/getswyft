import { beforeEach, describe, expect, it, vi } from "vitest";

const tenantFindUniqueMock = vi.fn();
const extendRequestContextMock = vi.fn();

vi.mock("../../lib/db.js", () => ({
  getPrismaClient: () => ({
    tenant: {
      findUnique: tenantFindUniqueMock,
    },
  }),
}));

vi.mock("../../lib/request-context.js", () => ({
  extendRequestContext: extendRequestContextMock,
}));

const { resolveTenant } = await import("../../middleware/tenant.js");

function createRequest({ headers = {}, memberships = [] } = {}) {
  return {
    auth: {
      isAuthenticated: true,
      memberships,
      activeTenant: null,
    },
    header(name) {
      return headers[name.toLowerCase()] || null;
    },
  };
}

describe("resolveTenant", () => {
  beforeEach(() => {
    tenantFindUniqueMock.mockReset();
    extendRequestContextMock.mockReset();
  });

  it("switches active tenant using x-tenant-slug header", async () => {
    tenantFindUniqueMock.mockResolvedValueOnce({ id: "tenant_beta", slug: "beta" });
    const req = createRequest({
      headers: {
        "x-tenant-slug": "beta",
      },
      memberships: [
        {
          tenantId: "tenant_alpha",
          tenantSlug: "alpha",
          tenantName: "Alpha",
          roleKeys: ["agent"],
          permissions: ["conversation.read"],
        },
        {
          tenantId: "tenant_beta",
          tenantSlug: "beta",
          tenantName: "Beta",
          roleKeys: ["tenant_admin"],
          permissions: ["tenant.manage", "conversation.read"],
        },
      ],
    });

    const next = vi.fn();

    await resolveTenant(req, {}, next);

    expect(tenantFindUniqueMock).toHaveBeenCalledWith({ where: { slug: "beta" } });
    expect(req.tenant?.id).toBe("tenant_beta");
    expect(req.auth.activeTenant?.tenantId).toBe("tenant_beta");
    expect(req.auth.activeTenant?.roleKeys).toEqual(["tenant_admin"]);
    expect(next).toHaveBeenCalled();
    expect(extendRequestContextMock).toHaveBeenCalledWith(req, {
      tenantId: "tenant_beta",
      roles: ["tenant_admin"],
      permissions: ["tenant.manage", "conversation.read"],
    });
  });

  it("uses first membership tenant when no tenant header is provided", async () => {
    tenantFindUniqueMock.mockResolvedValueOnce({ id: "tenant_default", slug: "default" });
    const req = createRequest({
      memberships: [
        {
          tenantId: "tenant_default",
          tenantSlug: "default",
          tenantName: "Default",
          roleKeys: ["agent"],
          permissions: ["conversation.read"],
        },
      ],
    });

    const next = vi.fn();

    await resolveTenant(req, {}, next);

    expect(tenantFindUniqueMock).toHaveBeenCalledWith({ where: { id: "tenant_default" } });
    expect(req.auth.activeTenant?.tenantSlug).toBe("default");
    expect(next).toHaveBeenCalled();
  });

  it("keeps activeTenant null when user is not a member of selected tenant", async () => {
    tenantFindUniqueMock.mockResolvedValueOnce({ id: "tenant_external", slug: "external" });
    const req = createRequest({
      headers: {
        "x-tenant-id": "tenant_external",
      },
      memberships: [
        {
          tenantId: "tenant_alpha",
          tenantSlug: "alpha",
          tenantName: "Alpha",
          roleKeys: ["agent"],
          permissions: ["conversation.read"],
        },
      ],
    });

    const next = vi.fn();

    await resolveTenant(req, {}, next);

    expect(req.tenant?.id).toBe("tenant_external");
    expect(req.auth.activeTenant).toBeNull();
    expect(extendRequestContextMock).toHaveBeenCalledWith(req, {
      tenantId: "tenant_external",
      roles: [],
      permissions: [],
    });
    expect(next).toHaveBeenCalled();
  });
});
