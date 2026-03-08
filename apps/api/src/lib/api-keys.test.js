import { beforeEach, describe, expect, it, vi } from "vitest";

const findUniqueMock = vi.fn();
const updateMock = vi.fn();

vi.mock("./db.js", () => ({
  getPrismaClient: () => ({
    tenantApiKey: {
      findUnique: findUniqueMock,
      update: updateMock,
    },
  }),
}));

const { authenticateTenantApiKey, generateTenantApiKeyValue } = await import("./api-keys.js");

describe("tenant api keys", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    updateMock.mockReset();
  });

  it("generates a raw key, prefix, and hash", () => {
    const value = generateTenantApiKeyValue();

    expect(value.rawKey).toContain(".");
    expect(value.keyPrefix.startsWith("swyft_live_")).toBe(true);
    expect(value.rawKey.startsWith(value.keyPrefix)).toBe(true);
    expect(value.secretHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("authenticates a valid api key and records usage", async () => {
    const generated = generateTenantApiKeyValue();
    const apiKey = {
      id: "key_1",
      tenantId: "tenant_1",
      name: "CRM ingest",
      keyPrefix: generated.keyPrefix,
      secretHash: generated.secretHash,
      permissions: ["conversation.read"],
      disabledAt: null,
      tenant: {
        id: "tenant_1",
        slug: "default",
        name: "Default",
      },
      createdByUser: {
        id: "user_1",
        externalAuthId: "auth|user_1",
        email: "admin@example.com",
        displayName: "Admin User",
        avatarUrl: null,
        isActive: true,
      },
    };

    findUniqueMock.mockResolvedValueOnce(apiKey);
    updateMock.mockResolvedValueOnce({});

    const result = await authenticateTenantApiKey(generated.rawKey, {
      ipAddress: "127.0.0.1",
    });

    expect(result).toBe(apiKey);
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: {
        keyPrefix: generated.keyPrefix,
      },
      include: {
        tenant: true,
        createdByUser: true,
      },
    });
    expect(updateMock).toHaveBeenCalledWith({
      where: {
        id: "key_1",
      },
      data: expect.objectContaining({
        lastUsedAt: expect.any(Date),
        lastUsedIp: "127.0.0.1",
      }),
    });
  });

  it("rejects disabled or mismatched keys", async () => {
    const generated = generateTenantApiKeyValue();

    findUniqueMock.mockResolvedValueOnce({
      id: "key_1",
      keyPrefix: generated.keyPrefix,
      secretHash: generated.secretHash,
      disabledAt: new Date(),
      tenant: {
        id: "tenant_1",
        slug: "default",
        name: "Default",
      },
      createdByUser: {
        id: "user_1",
        email: "admin@example.com",
        displayName: "Admin User",
        avatarUrl: null,
        externalAuthId: "auth|user_1",
        isActive: true,
      },
    });

    const result = await authenticateTenantApiKey(generated.rawKey);

    expect(result).toBeNull();
    expect(updateMock).not.toHaveBeenCalled();
  });
});
