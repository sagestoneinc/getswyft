import { describe, expect, it, vi } from "vitest";
import { requireTenant } from "../../middleware/tenant.js";

function createResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe("requireTenant", () => {
  it("returns 400 when tenant is missing", () => {
    const req = {
      tenant: null,
      auth: { isAuthenticated: true },
    };
    const res = createResponse();
    const next = vi.fn();

    requireTenant(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when authenticated user has no tenant membership", () => {
    const req = {
      tenant: { id: "tenant_1" },
      auth: {
        isAuthenticated: true,
        activeTenant: null,
      },
    };
    const res = createResponse();
    const next = vi.fn();

    requireTenant(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when tenant and membership are present", () => {
    const req = {
      tenant: { id: "tenant_1" },
      auth: {
        isAuthenticated: true,
        activeTenant: { tenantId: "tenant_1", permissions: [], roleKeys: [] },
      },
    };
    const res = createResponse();
    const next = vi.fn();

    requireTenant(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
