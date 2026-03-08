import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const userRoleFindManyMock = vi.fn();
const billingSubscriptionUpsertMock = vi.fn();
const billingSubscriptionFindUniqueMock = vi.fn();
const billingInvoiceFindManyMock = vi.fn();
const billingInvoiceCreateMock = vi.fn();
const billingInvoiceFindFirstMock = vi.fn();
const billingInvoiceUpdateMock = vi.fn();

vi.mock("../lib/db.js", () => ({
  getPrismaClient: () => ({
    userRole: {
      findMany: userRoleFindManyMock,
    },
    billingSubscription: {
      upsert: billingSubscriptionUpsertMock,
      findUnique: billingSubscriptionFindUniqueMock,
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
    nextBillingAt: new Date("2026-04-01T00:00:00Z"),
    paddleCustomerId: null,
    paddleSubscriptionId: null,
    braintreeCustomerId: null,
    braintreePlanId: null,
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

// ---------------------------------------------------------------------------
// PATCH /current/billing
// ---------------------------------------------------------------------------

describe("PATCH /current/billing", () => {
  beforeEach(() => {
    userRoleFindManyMock.mockReset();
    billingSubscriptionUpsertMock.mockReset();
    billingInvoiceFindManyMock.mockReset();
  });

  it("returns 400 when no supported fields are provided", async () => {
    const app = createTestApp(defaultMemberships);

    const res = await request(app).patch("/v1/tenants/current/billing").send({});

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("No supported billing updates");
  });

  it("returns 400 for invalid interval", async () => {
    const app = createTestApp(defaultMemberships);

    const res = await request(app)
      .patch("/v1/tenants/current/billing")
      .send({ interval: "weekly" });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("interval");
  });

  it("returns 400 for invalid status", async () => {
    const app = createTestApp(defaultMemberships);

    const res = await request(app)
      .patch("/v1/tenants/current/billing")
      .send({ status: "suspended" });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("status");
  });

  it("returns 400 for negative seatPriceCents", async () => {
    const app = createTestApp(defaultMemberships);

    const res = await request(app)
      .patch("/v1/tenants/current/billing")
      .send({ seatPriceCents: -1 });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("seatPriceCents");
  });

  it("returns 400 for invalid nextBillingAt date", async () => {
    const app = createTestApp(defaultMemberships);

    const res = await request(app)
      .patch("/v1/tenants/current/billing")
      .send({ nextBillingAt: "not-a-date" });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("nextBillingAt");
  });

  it("updates subscription and returns billing with computed activeSeats", async () => {
    const app = createTestApp(defaultMemberships);

    userRoleFindManyMock.mockResolvedValueOnce([{ userId: "user_1" }, { userId: "user_2" }]);
    billingInvoiceFindManyMock.mockResolvedValueOnce([]);
    billingSubscriptionUpsertMock.mockResolvedValueOnce(makeSubscription({ activeSeats: 2 }));

    const res = await request(app)
      .patch("/v1/tenants/current/billing")
      .send({ planKey: "enterprise", status: "active" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.billing).toBeDefined();

    // Verify upsert was called with correct activeSeats
    expect(billingSubscriptionUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ activeSeats: 2 }),
      }),
    );
  });

  it("uses activeSeats of 1 when no seat holders exist", async () => {
    const app = createTestApp(defaultMemberships);

    userRoleFindManyMock.mockResolvedValueOnce([]);
    billingInvoiceFindManyMock.mockResolvedValueOnce([]);
    billingSubscriptionUpsertMock.mockResolvedValueOnce(makeSubscription({ activeSeats: 1 }));

    await request(app)
      .patch("/v1/tenants/current/billing")
      .send({ planKey: "starter" });

    expect(billingSubscriptionUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ activeSeats: 1 }),
      }),
    );
  });

  it("respects explicit null for nextBillingAt in create payload", async () => {
    const app = createTestApp(defaultMemberships);

    userRoleFindManyMock.mockResolvedValueOnce([]);
    billingInvoiceFindManyMock.mockResolvedValueOnce([]);
    billingSubscriptionUpsertMock.mockResolvedValueOnce(makeSubscription({ nextBillingAt: null }));

    await request(app)
      .patch("/v1/tenants/current/billing")
      .send({ nextBillingAt: null });

    expect(billingSubscriptionUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ nextBillingAt: null }),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// POST /current/billing/invoices
// ---------------------------------------------------------------------------

describe("POST /current/billing/invoices", () => {
  beforeEach(() => {
    billingSubscriptionUpsertMock.mockReset();
    billingInvoiceCreateMock.mockReset();
    billingInvoiceFindManyMock.mockReset();
  });

  it("returns 400 for missing amountCents", async () => {
    const app = createTestApp(defaultMemberships);

    const res = await request(app)
      .post("/v1/tenants/current/billing/invoices")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("amountCents");
  });

  it("returns 400 for invalid status", async () => {
    const app = createTestApp(defaultMemberships);

    const res = await request(app)
      .post("/v1/tenants/current/billing/invoices")
      .send({ amountCents: 4900, status: "unknown" });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("status");
  });

  it("returns 400 for invalid periodStart date", async () => {
    const app = createTestApp(defaultMemberships);

    const res = await request(app)
      .post("/v1/tenants/current/billing/invoices")
      .send({ amountCents: 4900, periodStart: "not-a-date" });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("periodStart");
  });

  it("returns 400 for invalid hostedUrl", async () => {
    const app = createTestApp(defaultMemberships);

    const res = await request(app)
      .post("/v1/tenants/current/billing/invoices")
      .send({ amountCents: 4900, hostedUrl: "ftp://notallowed.com" });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("hostedUrl");
  });

  it("creates invoice with unique invoice number including random suffix", async () => {
    const app = createTestApp(defaultMemberships);

    billingSubscriptionUpsertMock.mockResolvedValueOnce(makeSubscription());
    billingInvoiceCreateMock.mockResolvedValueOnce(makeInvoice());

    const res = await request(app)
      .post("/v1/tenants/current/billing/invoices")
      .send({ amountCents: 4900, status: "paid" });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.invoice).toBeDefined();

    // Invoice number should contain tenant slug + timestamp + random suffix
    const createCall = billingInvoiceCreateMock.mock.calls[0][0];
    const invoiceNumber = createCall.data.invoiceNumber;
    expect(invoiceNumber).toMatch(/^INV-WORKSPACE-1-\d+-[0-9A-F]{8}$/);
  });

  it("creates invoice and sets paidAt when status is paid", async () => {
    const app = createTestApp(defaultMemberships);

    billingSubscriptionUpsertMock.mockResolvedValueOnce(makeSubscription());
    billingInvoiceCreateMock.mockResolvedValueOnce(makeInvoice());

    await request(app)
      .post("/v1/tenants/current/billing/invoices")
      .send({ amountCents: 4900, status: "paid" });

    const createCall = billingInvoiceCreateMock.mock.calls[0][0];
    expect(createCall.data.paidAt).toBeInstanceOf(Date);
  });

  it("creates invoice and leaves paidAt null when status is open", async () => {
    const app = createTestApp(defaultMemberships);

    billingSubscriptionUpsertMock.mockResolvedValueOnce(makeSubscription());
    billingInvoiceCreateMock.mockResolvedValueOnce(makeInvoice({ status: "OPEN", paidAt: null }));

    await request(app)
      .post("/v1/tenants/current/billing/invoices")
      .send({ amountCents: 4900, status: "open" });

    const createCall = billingInvoiceCreateMock.mock.calls[0][0];
    expect(createCall.data.paidAt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// PATCH /current/billing/invoices/:invoiceId
// ---------------------------------------------------------------------------

describe("PATCH /current/billing/invoices/:invoiceId", () => {
  beforeEach(() => {
    billingInvoiceFindFirstMock.mockReset();
    billingInvoiceUpdateMock.mockReset();
  });

  it("returns 404 when invoice is not found", async () => {
    const app = createTestApp(defaultMemberships);

    billingInvoiceFindFirstMock.mockResolvedValueOnce(null);

    const res = await request(app)
      .patch("/v1/tenants/current/billing/invoices/inv_missing")
      .send({ status: "paid" });

    expect(res.status).toBe(404);
    expect(res.body.ok).toBe(false);
  });

  it("returns 400 for invalid invoice status", async () => {
    const app = createTestApp(defaultMemberships);

    billingInvoiceFindFirstMock.mockResolvedValueOnce(makeInvoice());

    const res = await request(app)
      .patch("/v1/tenants/current/billing/invoices/inv_1")
      .send({ status: "overdue" });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("status");
  });

  it("returns 400 for invalid hostedUrl", async () => {
    const app = createTestApp(defaultMemberships);

    billingInvoiceFindFirstMock.mockResolvedValueOnce(makeInvoice());

    const res = await request(app)
      .patch("/v1/tenants/current/billing/invoices/inv_1")
      .send({ hostedUrl: "not-a-url" });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("hostedUrl");
  });

  it("returns 400 when no supported fields are provided", async () => {
    const app = createTestApp(defaultMemberships);

    billingInvoiceFindFirstMock.mockResolvedValueOnce(makeInvoice());

    const res = await request(app)
      .patch("/v1/tenants/current/billing/invoices/inv_1")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("No supported invoice updates");
  });

  it("updates invoice status to void and clears paidAt", async () => {
    const app = createTestApp(defaultMemberships);

    billingInvoiceFindFirstMock.mockResolvedValueOnce(makeInvoice());
    billingInvoiceUpdateMock.mockResolvedValueOnce(makeInvoice({ status: "VOID", paidAt: null }));

    const res = await request(app)
      .patch("/v1/tenants/current/billing/invoices/inv_1")
      .send({ status: "void" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.invoice.status).toBe("void");

    const updateCall = billingInvoiceUpdateMock.mock.calls[0][0];
    expect(updateCall.data.paidAt).toBeNull();
  });

  it("updates hostedUrl and returns updated invoice", async () => {
    const app = createTestApp(defaultMemberships);

    billingInvoiceFindFirstMock.mockResolvedValueOnce(makeInvoice());
    billingInvoiceUpdateMock.mockResolvedValueOnce(
      makeInvoice({ hostedUrl: "https://billing.example.com/inv_1" }),
    );

    const res = await request(app)
      .patch("/v1/tenants/current/billing/invoices/inv_1")
      .send({ hostedUrl: "https://billing.example.com/inv_1" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.invoice.hostedUrl).toBe("https://billing.example.com/inv_1");
  });
});
