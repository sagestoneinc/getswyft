import { describe, expect, it, vi } from "vitest";
import { requireAuth } from "../../middleware/auth.js";

function createResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe("requireAuth", () => {
  it("returns 401 when request is not authenticated", () => {
    const req = {
      auth: {
        isAuthenticated: false,
      },
    };
    const res = createResponse();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when request has authenticated user", () => {
    const req = {
      auth: {
        isAuthenticated: true,
        user: { id: "user_1" },
      },
    };
    const res = createResponse();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
