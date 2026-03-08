import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const invitationFindUniqueMock = vi.fn();
const invitationUpdateMock = vi.fn();
const userRoleUpsertMock = vi.fn();
const transactionMock = vi.fn();

vi.mock("../lib/db.js", () => ({
  getPrismaClient: () => ({
    tenantInvitation: {
      findUnique: invitationFindUniqueMock,
      update: invitationUpdateMock,
    },
    userRole: {
      upsert: userRoleUpsertMock,
    },
    $transaction: transactionMock,
  }),
}));

vi.mock("../lib/audit.js", () => ({
  writeAuditLog: vi.fn().mockResolvedValue({}),
}));

vi.mock("../lib/analytics.js", () => ({
  recordAnalyticsEvent: vi.fn().mockResolvedValue({}),
}));

vi.mock("../lib/webhooks.js", () => ({
  dispatchTenantWebhookEvent: vi.fn().mockResolvedValue({ dispatched: 0, deliveryIds: [] }),
}));

const { authRouter } = await import("../modules/auth/auth.routes.js");

function createTestApp() {
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
        email: "invitee@example.com",
        displayName: "Invitee",
      },
    };
    next();
  });
  app.use("/v1/auth", authRouter);
  return app;
}

describe("auth invitation routes", () => {
  beforeEach(() => {
    invitationFindUniqueMock.mockReset();
    invitationUpdateMock.mockReset();
    userRoleUpsertMock.mockReset();
    transactionMock.mockReset();
    transactionMock.mockImplementation(async (operations) => Promise.all(operations));
  });

  it("accepts a matching invitation token", async () => {
    const app = createTestApp();
    const invitation = {
      id: "invite_1",
      tenantId: "tenant_1",
      roleId: "role_1",
      acceptedUserId: null,
      email: "invitee@example.com",
      status: "PENDING",
      expiresAt: new Date(Date.now() + 60_000),
      sentAt: new Date(),
      acceptedAt: null,
      revokedAt: null,
      role: {
        id: "role_1",
        key: "agent",
      },
      tenant: {
        id: "tenant_1",
        slug: "default",
        name: "Default",
      },
      invitedByUser: {
        id: "user_admin",
        email: "admin@example.com",
        displayName: "Admin",
      },
      acceptedUser: null,
    };

    invitationFindUniqueMock
      .mockResolvedValueOnce(invitation)
      .mockResolvedValueOnce({
        ...invitation,
        status: "ACCEPTED",
        acceptedAt: new Date(),
        acceptedUserId: "user_1",
        acceptedUser: {
          id: "user_1",
          email: "invitee@example.com",
          displayName: "Invitee",
        },
      });
    userRoleUpsertMock.mockResolvedValueOnce({});
    invitationUpdateMock.mockResolvedValueOnce({});

    const response = await request(app).post("/v1/auth/invitations/accept").send({
      token: "invite-token",
    });

    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);
    expect(response.body.tenant).toMatchObject({
      id: "tenant_1",
      slug: "default",
    });
    expect(userRoleUpsertMock).toHaveBeenCalledWith({
      where: {
        tenantId_userId_roleId: {
          tenantId: "tenant_1",
          userId: "user_1",
          roleId: "role_1",
        },
      },
      update: {},
      create: {
        tenantId: "tenant_1",
        userId: "user_1",
        roleId: "role_1",
      },
    });
  });
});
