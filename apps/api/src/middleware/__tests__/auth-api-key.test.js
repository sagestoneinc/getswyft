import { beforeEach, describe, expect, it, vi } from "vitest";

const authenticateTenantApiKeyMock = vi.fn();
const verifyAccessTokenMock = vi.fn();
const loadAccessContextFromClaimsMock = vi.fn();
const extendRequestContextMock = vi.fn();

vi.mock("../../lib/api-keys.js", () => ({
  authenticateTenantApiKey: authenticateTenantApiKeyMock,
}));

vi.mock("../../lib/auth-tokens.js", () => ({
  extractBearerToken: vi.fn(() => null),
  verifyAccessToken: verifyAccessTokenMock,
}));

vi.mock("../../lib/access-context.js", () => ({
  loadAccessContextFromClaims: loadAccessContextFromClaimsMock,
}));

vi.mock("../../lib/request-context.js", () => ({
  extendRequestContext: extendRequestContextMock,
}));

const { authenticateRequest } = await import("../../middleware/auth.js");

describe("authenticateRequest with api keys", () => {
  beforeEach(() => {
    authenticateTenantApiKeyMock.mockReset();
    verifyAccessTokenMock.mockReset();
    loadAccessContextFromClaimsMock.mockReset();
    extendRequestContextMock.mockReset();
  });

  it("authenticates requests with x-api-key", async () => {
    const req = {
      header: vi.fn((name) => {
        if (name === "x-api-key") {
          return "swyft_live_abc.secret";
        }

        return undefined;
      }),
      ip: "127.0.0.1",
    };
    const next = vi.fn();

    authenticateTenantApiKeyMock.mockResolvedValueOnce({
      id: "key_1",
      tenantId: "tenant_1",
      name: "CRM ingest",
      keyPrefix: "swyft_live_abc",
      permissions: ["conversation.read"],
      tenant: {
        id: "tenant_1",
        slug: "default",
        name: "Default",
      },
      createdByUser: {
        id: "user_1",
        externalAuthId: "auth|user_1",
        email: "admin@example.com",
        displayName: "Admin",
        avatarUrl: null,
      },
    });

    await authenticateRequest(req, {}, next);

    expect(authenticateTenantApiKeyMock).toHaveBeenCalledWith("swyft_live_abc.secret", {
      ipAddress: "127.0.0.1",
    });
    expect(req.auth).toMatchObject({
      isAuthenticated: true,
      subject: "api_key:key_1",
      apiKey: {
        id: "key_1",
        name: "CRM ingest",
      },
    });
    expect(next).toHaveBeenCalledWith();
  });

  it("fails invalid api key authentication", async () => {
    const req = {
      header: vi.fn((name) => (name === "x-api-key" ? "invalid" : undefined)),
      ip: "127.0.0.1",
    };
    const next = vi.fn();

    authenticateTenantApiKeyMock.mockResolvedValueOnce(null);

    await authenticateRequest(req, {}, next);

    expect(req.auth).toMatchObject({
      isAuthenticated: false,
    });
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].publicMessage).toBe("Invalid or disabled API key");
  });
});
