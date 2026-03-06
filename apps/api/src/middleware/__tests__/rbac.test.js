import { describe, expect, it, vi } from "vitest";
import { requireAnyPermission, requirePermission } from "../../middleware/rbac.js";

function createResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe("rbac middleware", () => {
  it("denies access when required permission is missing", () => {
    const req = {
      auth: {
        isAuthenticated: true,
        activeTenant: {
          permissions: ["conversation.read"],
        },
      },
    };
    const res = createResponse();
    const next = vi.fn();

    requirePermission("analytics.read")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("allows access when any permission matches", () => {
    const req = {
      auth: {
        isAuthenticated: true,
        activeTenant: {
          permissions: ["analytics.read"],
        },
      },
    };
    const res = createResponse();
    const next = vi.fn();

    requireAnyPermission(["tenant.manage", "analytics.read"])(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
