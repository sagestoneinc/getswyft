import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const phoneNumberFindManyMock = vi.fn();
const phoneNumberFindFirstMock = vi.fn();
const phoneNumberCreateMock = vi.fn();
const phoneNumberUpdateMock = vi.fn();

const sipTrunkFindManyMock = vi.fn();
const sipTrunkFindFirstMock = vi.fn();
const sipTrunkCreateMock = vi.fn();
const sipTrunkUpdateMock = vi.fn();
const sipTrunkDeleteMock = vi.fn();

vi.mock("../lib/db.js", () => ({
  getPrismaClient: () => ({
    tenantPhoneNumber: {
      findMany: phoneNumberFindManyMock,
      findFirst: phoneNumberFindFirstMock,
      create: phoneNumberCreateMock,
      update: phoneNumberUpdateMock,
    },
    tenantSipTrunk: {
      findMany: sipTrunkFindManyMock,
      findFirst: sipTrunkFindFirstMock,
      create: sipTrunkCreateMock,
      update: sipTrunkUpdateMock,
      delete: sipTrunkDeleteMock,
    },
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

// SIP_ENCRYPTION_KEY must be set before importing routes
process.env.SIP_ENCRYPTION_KEY = "test-sip-encryption-key-for-tests";

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
  app.use(express.json());
  app.use((req, _res, next) => {
    req.context = { requestId: "req_1" };
    req.auth = {
      isAuthenticated: true,
      user: { id: "user_1", email: "admin@getswyft.local" },
      memberships,
      activeTenant: memberships[0] || null,
    };
    req.tenant = { id: memberships[0]?.tenantId, slug: memberships[0]?.tenantSlug };
    next();
  });
  app.use("/v1/tenants", tenantRouter);
  return app;
}

const defaultMemberships = [createMembership("tenant_1", "workspace-1")];

describe("GET /current/addons", () => {
  beforeEach(() => {
    phoneNumberFindManyMock.mockReset();
    sipTrunkFindManyMock.mockReset();
  });

  it("returns active phone numbers and SIP trunks", async () => {
    const app = createTestApp(defaultMemberships);

    phoneNumberFindManyMock.mockResolvedValueOnce([
      {
        id: "pn_1",
        phoneNumber: "+15551234567",
        label: "Support",
        provider: "manual",
        capabilities: { voice: true, sms: true },
        status: "ACTIVE",
        monthlyCostCents: 100,
        currency: "USD",
        provisionedAt: new Date(),
      },
    ]);
    sipTrunkFindManyMock.mockResolvedValueOnce([]);

    const res = await request(app).get("/v1/tenants/current/addons");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.addons.phoneNumbers).toHaveLength(1);
    expect(res.body.addons.sipTrunks).toHaveLength(0);
  });

  it("filters SIP trunks by ACTIVE status", async () => {
    const app = createTestApp(defaultMemberships);

    phoneNumberFindManyMock.mockResolvedValueOnce([]);
    sipTrunkFindManyMock.mockResolvedValueOnce([]);

    await request(app).get("/v1/tenants/current/addons");

    expect(sipTrunkFindManyMock).toHaveBeenCalledWith({
      where: { tenantId: "tenant_1", status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });
  });
});

describe("POST /current/addons/phone-numbers", () => {
  beforeEach(() => {
    phoneNumberFindFirstMock.mockReset();
    phoneNumberCreateMock.mockReset();
    phoneNumberUpdateMock.mockReset();
  });

  it("provisions a phone number with valid E.164 format", async () => {
    const app = createTestApp(defaultMemberships);

    phoneNumberFindFirstMock.mockResolvedValueOnce(null); // no ACTIVE
    phoneNumberFindFirstMock.mockResolvedValueOnce(null); // no RELEASED
    phoneNumberCreateMock.mockResolvedValueOnce({
      id: "pn_1",
      phoneNumber: "+15551234567",
      label: "Support",
      provider: "manual",
      capabilities: { voice: true, sms: true },
      status: "ACTIVE",
      monthlyCostCents: 100,
      currency: "USD",
      provisionedAt: new Date(),
    });

    const res = await request(app)
      .post("/v1/tenants/current/addons/phone-numbers")
      .send({ phoneNumber: "+15551234567", label: "Support" });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.phoneNumber.phoneNumber).toBe("+15551234567");
  });

  it("rejects invalid E.164 phone numbers", async () => {
    const app = createTestApp(defaultMemberships);

    const res = await request(app)
      .post("/v1/tenants/current/addons/phone-numbers")
      .send({ phoneNumber: "5551234567" });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("E.164");
  });

  it("returns 409 when phone number is already active", async () => {
    const app = createTestApp(defaultMemberships);

    phoneNumberFindFirstMock.mockResolvedValueOnce({ id: "pn_1", status: "ACTIVE" });

    const res = await request(app)
      .post("/v1/tenants/current/addons/phone-numbers")
      .send({ phoneNumber: "+15551234567" });

    expect(res.status).toBe(409);
    expect(res.body.ok).toBe(false);
  });

  it("re-activates a previously released phone number", async () => {
    const app = createTestApp(defaultMemberships);

    phoneNumberFindFirstMock.mockResolvedValueOnce(null); // no ACTIVE
    phoneNumberFindFirstMock.mockResolvedValueOnce({ id: "pn_released", status: "RELEASED" }); // found RELEASED
    phoneNumberUpdateMock.mockResolvedValueOnce({
      id: "pn_released",
      phoneNumber: "+15551234567",
      label: "Re-provisioned",
      provider: "manual",
      capabilities: { voice: true, sms: true },
      status: "ACTIVE",
      monthlyCostCents: 100,
      currency: "USD",
      provisionedAt: new Date(),
    });

    const res = await request(app)
      .post("/v1/tenants/current/addons/phone-numbers")
      .send({ phoneNumber: "+15551234567", label: "Re-provisioned" });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.phoneNumber.id).toBe("pn_released");
    expect(phoneNumberUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "pn_released" },
        data: expect.objectContaining({
          status: "ACTIVE",
          releasedAt: null,
        }),
      }),
    );
    expect(phoneNumberCreateMock).not.toHaveBeenCalled();
  });
});

describe("POST /current/addons/sip-trunks", () => {
  beforeEach(() => {
    sipTrunkCreateMock.mockReset();
  });

  it("creates a SIP trunk with valid data", async () => {
    const app = createTestApp(defaultMemberships);

    sipTrunkCreateMock.mockResolvedValueOnce({
      id: "st_1",
      name: "Primary",
      host: "sip.provider.com",
      port: 5060,
      transport: "tls",
      username: null,
      password: null,
      realm: null,
      outboundProxy: null,
      status: "ACTIVE",
      createdAt: new Date(),
    });

    const res = await request(app)
      .post("/v1/tenants/current/addons/sip-trunks")
      .send({ name: "Primary", host: "sip.provider.com", port: 5060, transport: "tls" });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.sipTrunk.name).toBe("Primary");
    expect(res.body.sipTrunk.transport).toBe("tls");
  });

  it("does not return password in response", async () => {
    const app = createTestApp(defaultMemberships);

    sipTrunkCreateMock.mockResolvedValueOnce({
      id: "st_1",
      name: "Primary",
      host: "sip.provider.com",
      port: 5060,
      transport: "tls",
      username: "user",
      password: "encrypted-value",
      realm: null,
      outboundProxy: null,
      status: "ACTIVE",
      createdAt: new Date(),
    });

    const res = await request(app)
      .post("/v1/tenants/current/addons/sip-trunks")
      .send({ name: "Primary", host: "sip.provider.com", password: "secret" });

    expect(res.status).toBe(201);
    expect(res.body.sipTrunk.password).toBeUndefined();
    expect(res.body.sipTrunk.hasPassword).toBe(true);
  });

  it("rejects invalid port", async () => {
    const app = createTestApp(defaultMemberships);

    const res = await request(app)
      .post("/v1/tenants/current/addons/sip-trunks")
      .send({ name: "Primary", host: "sip.provider.com", port: 99999 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("port");
  });

  it("rejects invalid transport", async () => {
    const app = createTestApp(defaultMemberships);

    const res = await request(app)
      .post("/v1/tenants/current/addons/sip-trunks")
      .send({ name: "Primary", host: "sip.provider.com", transport: "quic" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("transport");
  });

  it("defaults transport to tls", async () => {
    const app = createTestApp(defaultMemberships);

    sipTrunkCreateMock.mockResolvedValueOnce({
      id: "st_1",
      name: "Primary",
      host: "sip.provider.com",
      port: 5060,
      transport: "tls",
      username: null,
      password: null,
      realm: null,
      outboundProxy: null,
      status: "ACTIVE",
      createdAt: new Date(),
    });

    await request(app)
      .post("/v1/tenants/current/addons/sip-trunks")
      .send({ name: "Primary", host: "sip.provider.com" });

    expect(sipTrunkCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ transport: "tls" }),
      }),
    );
  });
});

describe("PATCH /current/addons/sip-trunks/:sipTrunkId", () => {
  beforeEach(() => {
    sipTrunkFindFirstMock.mockReset();
    sipTrunkUpdateMock.mockReset();
  });

  it("rejects empty name", async () => {
    const app = createTestApp(defaultMemberships);

    sipTrunkFindFirstMock.mockResolvedValueOnce({ id: "st_1", tenantId: "tenant_1" });

    const res = await request(app)
      .patch("/v1/tenants/current/addons/sip-trunks/st_1")
      .send({ name: "  " });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("name must not be empty");
  });

  it("rejects empty host", async () => {
    const app = createTestApp(defaultMemberships);

    sipTrunkFindFirstMock.mockResolvedValueOnce({ id: "st_1", tenantId: "tenant_1" });

    const res = await request(app)
      .patch("/v1/tenants/current/addons/sip-trunks/st_1")
      .send({ host: "" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("host must not be empty");
  });

  it("updates valid fields", async () => {
    const app = createTestApp(defaultMemberships);

    sipTrunkFindFirstMock.mockResolvedValueOnce({ id: "st_1", tenantId: "tenant_1" });
    sipTrunkUpdateMock.mockResolvedValueOnce({
      id: "st_1",
      name: "Updated",
      host: "new.host.com",
      port: 5061,
      transport: "tls",
      username: null,
      password: null,
      realm: null,
      outboundProxy: null,
      status: "ACTIVE",
      createdAt: new Date(),
    });

    const res = await request(app)
      .patch("/v1/tenants/current/addons/sip-trunks/st_1")
      .send({ name: "Updated", host: "new.host.com", port: 5061 });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.sipTrunk.name).toBe("Updated");
  });
});
