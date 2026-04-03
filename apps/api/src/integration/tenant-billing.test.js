import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const userRoleFindManyMock = vi.fn();
const billingSubscriptionUpsertMock = vi.fn();
const billingInvoiceFindManyMock = vi.fn();
const billingInvoiceCreateMock = vi.fn();
const billingInvoiceFindFirstMock = vi.fn();
const billingInvoiceUpdateMock = vi.fn();

vi.mock("../lib/db.js", () => ({
  getPrismaClient: () => ({
    userRole: { findMany: userRoleFindManyMock },
    billingSubscription: {
      upsert: billingSubscriptionUpsertMock,
    },
    billingInvoice: {
      findMany: billingInvoiceFindManyMock,
      create: billingInvoiceCreateMock,
      findFirst: billingInvoiceFindFirstMock,
      update: billingInvoiceUpdateMock,
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

function makeSubscription(overrides = {}) {
  return {
    id: "sub_1",
    tenantId: "tenant_1",
    provider: "manual",
    planKey: "professional",
    planName: "Professional",
    interval: "MONTHLY",
    status: "ACTIVE",
    seatPriceCents: 4900,
    currency: "USD",
    activeSeats: 2,
    nextBillingAt: new Date("2026-04-01T00:00:00.000Z"),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeInvoice(overrides = {}) {
  return {
    id: "inv_1",
    tenantId: "tenant_1",
    subscriptionId: "sub_1",
    invoiceNumber: "INV-WORKSPACE-1-1234567890-ABCD1234",
    status: "PAID",
    amountCents: 4900,
    currency: "USD",
    issuedAt: new Date(),
    periodStart: null,
    periodEnd: null,
    paidAt: new Date(),
    hostedUrl: null,
    ...overrides,
  };
}

describe("tenant billing routes", () => {
  beforeEach(() => {
    userRoleFindManyMock.mockReset();
    billingSubscriptionUpsertMock.mockReset();
    billingInvoiceFindManyMock.mockReset();
    billingInvoiceCreateMock.mockReset();
    billingInvoiceFindFirstMock.mockReset();
    billingInvoiceUpdateMock.mockReset();
  });

  it("returns 400 when no supported billing fields are provided", async () => {
    const app = createTestApp(defaultMemberships);
    const res = await request(app).patch("/v1/tenants/current/billing").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("No supported billing updates");
  });

  it("updates subscription and serializes billing payload", async () => {
    const app = createTestApp(defaultMemberships);

    userRoleFindManyMock.mockResolvedValueOnce([{ userId: "user_1" }, { userId: "user_2" }]);
    billingInvoiceFindManyMock.mockResolvedValueOnce([]);
    billingSubscriptionUpsertMock.mockResolvedValueOnce(makeSubscription({ planKey: "enterprise", planName: "Enterprise" }));

    const res = await request(app)
      .patch("/v1/tenants/current/billing")
      .send({ planKey: "enterprise", planName: "Enterprise" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.billing.subscription.planKey).toBe("enterprise");
    expect(billingSubscriptionUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ planKey: "enterprise", planName: "Enterprise", activeSeats: 2 }),
      }),
    );
  });

  it("creates an invoice", async () => {
    const app = createTestApp(defaultMemberships);

    userRoleFindManyMock.mockResolvedValueOnce([{ userId: "user_1" }]);
    billingSubscriptionUpsertMock.mockResolvedValueOnce(makeSubscription());
    billingInvoiceCreateMock.mockResolvedValueOnce(makeInvoice());

    const res = await request(app)
      .post("/v1/tenants/current/billing/invoices")
      .send({ amountCents: 4900, status: "paid" });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.invoice.status).toBe("paid");
  });

  it("updates an existing invoice status", async () => {
    const app = createTestApp(defaultMemberships);

    billingInvoiceFindFirstMock.mockResolvedValueOnce(makeInvoice({ status: "OPEN", paidAt: null }));
    billingInvoiceUpdateMock.mockResolvedValueOnce(makeInvoice({ status: "PAID" }));

    const res = await request(app)
      .patch("/v1/tenants/current/billing/invoices/inv_1")
      .send({ status: "paid" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.invoice.status).toBe("paid");
  });
});
