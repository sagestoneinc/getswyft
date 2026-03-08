import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const billingSubscriptionUpsertMock = vi.fn();
const billingInvoiceFindManyMock = vi.fn();
const billingInvoiceCreateMock = vi.fn();
const billingInvoiceFindFirstMock = vi.fn();
const billingInvoiceUpdateMock = vi.fn();

vi.mock("../lib/db.js", () => ({
  getPrismaClient: () => ({
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
    paddleCustomerId: null,
    paddleSubscriptionId: null,
    braintreeCustomerId: null,
    braintreeSubscriptionId: null,
    planKey: "professional",
    planName: "Professional",
    interval: "MONTHLY",
    status: "ACTIVE",
    seatPriceCents: 4900,
    currency: "USD",
    activeSeats: 3,
    nextBillingAt: new Date("2026-04-01T00:00:00.000Z"),
    ...overrides,
  };
}

function makeInvoice(overrides = {}) {
  return {
    id: "inv_1",
    tenantId: "tenant_1",
    subscriptionId: "sub_1",
    invoiceNumber: "INV-WORKSPACE-1-1234567890",
    status: "PAID",
    amountCents: 14700,
    currency: "USD",
    issuedAt: new Date("2026-03-01T00:00:00.000Z"),
    periodStart: null,
    periodEnd: null,
    paidAt: new Date("2026-03-01T00:00:00.000Z"),
    hostedUrl: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// PATCH /current/billing
// ---------------------------------------------------------------------------

describe("PATCH /current/billing", () => {
  beforeEach(() => {
    billingSubscriptionUpsertMock.mockReset();
    billingInvoiceFindManyMock.mockReset();
  });

  it("returns 400 when no supported billing fields are provided", async () => {
    const app = createTestApp(defaultMemberships);

    const res = await request(app).patch("/v1/tenants/current/billing").send({});

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("No supported billing updates");
  });

  it("returns 400 for invalid interval", async () => {
    const app = createTestApp(defaultMemberships);

    const res = await request(app).patch("/v1/tenants/current/billing").send({ interval: "weekly" });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("interval");
  });

  it("returns 400 for invalid status", async () => {
    const app = createTestApp(defaultMemberships);

    const res = await request(app).patch("/v1/tenants/current/billing").send({ status: "expired" });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("status");
  });

  it("returns 400 for negative seatPriceCents", async () => {
    const app = createTestApp(defaultMemberships);

    const res = await request(app).patch("/v1/tenants/current/billing").send({ seatPriceCents: -1 });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("seatPriceCents");
  });

  it("returns 400 for non-integer seatPriceCents", async () => {
    const app = createTestApp(defaultMemberships);

    const res = await request(app).patch("/v1/tenants/current/billing").send({ seatPriceCents: 9.99 });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("seatPriceCents");
  });

  it("returns 400 for invalid nextBillingAt", async () => {
    const app = createTestApp(defaultMemberships);

    const res = await request(app)
      .patch("/v1/tenants/current/billing")
      .send({ nextBillingAt: "not-a-date" });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("nextBillingAt");
  });

  it("updates subscription fields and returns serialized billing", async () => {
    const app = createTestApp(defaultMemberships);

    const subscription = makeSubscription({ planKey: "enterprise", planName: "Enterprise", status: "ACTIVE" });
    billingSubscriptionUpsertMock.mockResolvedValueOnce(subscription);
    billingInvoiceFindManyMock.mockResolvedValueOnce([]);

    const res = await request(app)
      .patch("/v1/tenants/current/billing")
      .send({ planKey: "enterprise", planName: "Enterprise" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.billing.subscription.planKey).toBe("enterprise");
    expect(res.body.billing.subscription.planName).toBe("Enterprise");
    expect(res.body.billing.invoices).toEqual([]);
  });

  it("upserts subscription with uppercased interval and status", async () => {
    const app = createTestApp(defaultMemberships);

    billingSubscriptionUpsertMock.mockResolvedValueOnce(makeSubscription({ interval: "YEARLY", status: "TRIALING" }));
    billingInvoiceFindManyMock.mockResolvedValueOnce([]);

    const res = await request(app)
      .patch("/v1/tenants/current/billing")
      .send({ interval: "yearly", status: "trialing" });

    expect(res.status).toBe(200);
    expect(billingSubscriptionUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ interval: "YEARLY", status: "TRIALING" }),
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
  });

  it("returns 400 when amountCents is missing", async () => {
    const app = createTestApp(defaultMemberships);

    const res = await request(app).post("/v1/tenants/current/billing/invoices").send({});

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("amountCents");
  });

  it("returns 400 when amountCents is negative", async () => {
    const app = createTestApp(defaultMemberships);

    const res = await request(app)
      .post("/v1/tenants/current/billing/invoices")
      .send({ amountCents: -100 });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("amountCents");
  });

  it("returns 400 for invalid invoice status", async () => {
    const app = createTestApp(defaultMemberships);

    const res = await request(app)
      .post("/v1/tenants/current/billing/invoices")
      .send({ amountCents: 4900, status: "pending" });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("status");
  });

  it("returns 400 for invalid periodStart", async () => {
    const app = createTestApp(defaultMemberships);

    const res = await request(app)
      .post("/v1/tenants/current/billing/invoices")
      .send({ amountCents: 4900, periodStart: "not-a-date" });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("periodStart");
  });

  it("returns 400 for invalid periodEnd", async () => {
    const app = createTestApp(defaultMemberships);

    const res = await request(app)
      .post("/v1/tenants/current/billing/invoices")
      .send({ amountCents: 4900, periodEnd: "not-a-date" });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("periodEnd");
  });

  it("returns 400 for invalid hostedUrl", async () => {
    const app = createTestApp(defaultMemberships);

    const res = await request(app)
      .post("/v1/tenants/current/billing/invoices")
      .send({ amountCents: 4900, hostedUrl: "not-a-url" });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("hostedUrl");
  });

  it("returns 400 for non-http hostedUrl", async () => {
    const app = createTestApp(defaultMemberships);

    const res = await request(app)
      .post("/v1/tenants/current/billing/invoices")
      .send({ amountCents: 4900, hostedUrl: "ftp://example.com/invoice" });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("hostedUrl");
  });

  it("creates an invoice and returns 201 with invoice data", async () => {
    const app = createTestApp(defaultMemberships);

    billingSubscriptionUpsertMock.mockResolvedValueOnce(makeSubscription());
    const invoice = makeInvoice({ amountCents: 4900, status: "PAID" });
    billingInvoiceCreateMock.mockResolvedValueOnce(invoice);

    const res = await request(app)
      .post("/v1/tenants/current/billing/invoices")
      .send({ amountCents: 4900 });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.invoice.amountCents).toBe(4900);
    expect(res.body.invoice.status).toBe("paid");
    expect(res.body.invoice.id).toBe("inv_1");
  });

  it("sets paidAt when status is PAID", async () => {
    const app = createTestApp(defaultMemberships);

    billingSubscriptionUpsertMock.mockResolvedValueOnce(makeSubscription());
    billingInvoiceCreateMock.mockResolvedValueOnce(makeInvoice({ paidAt: new Date() }));

    await request(app)
      .post("/v1/tenants/current/billing/invoices")
      .send({ amountCents: 4900, status: "paid" });

    expect(billingInvoiceCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ paidAt: expect.any(Date) }),
      }),
    );
  });

  it("does not set paidAt when status is OPEN", async () => {
    const app = createTestApp(defaultMemberships);

    billingSubscriptionUpsertMock.mockResolvedValueOnce(makeSubscription());
    billingInvoiceCreateMock.mockResolvedValueOnce(makeInvoice({ status: "OPEN", paidAt: null }));

    await request(app)
      .post("/v1/tenants/current/billing/invoices")
      .send({ amountCents: 4900, status: "open" });

    expect(billingInvoiceCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ paidAt: null }),
      }),
    );
  });

  it("defaults currency to USD when not provided", async () => {
    const app = createTestApp(defaultMemberships);

    billingSubscriptionUpsertMock.mockResolvedValueOnce(makeSubscription());
    billingInvoiceCreateMock.mockResolvedValueOnce(makeInvoice());

    await request(app)
      .post("/v1/tenants/current/billing/invoices")
      .send({ amountCents: 4900 });

    expect(billingInvoiceCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ currency: "USD" }),
      }),
    );
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
    expect(res.body.error).toContain("Invoice not found");
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

  it("returns 400 when no supported invoice fields are provided", async () => {
    const app = createTestApp(defaultMemberships);

    billingInvoiceFindFirstMock.mockResolvedValueOnce(makeInvoice());

    const res = await request(app)
      .patch("/v1/tenants/current/billing/invoices/inv_1")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("No supported invoice updates");
  });

  it("returns 400 for invalid hostedUrl", async () => {
    const app = createTestApp(defaultMemberships);

    billingInvoiceFindFirstMock.mockResolvedValueOnce(makeInvoice());

    const res = await request(app)
      .patch("/v1/tenants/current/billing/invoices/inv_1")
      .send({ hostedUrl: "ftp://example.com/invoice" });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("hostedUrl");
  });

  it("updates invoice status and returns updated invoice", async () => {
    const app = createTestApp(defaultMemberships);

    const existing = makeInvoice({ status: "OPEN", paidAt: null });
    billingInvoiceFindFirstMock.mockResolvedValueOnce(existing);
    billingInvoiceUpdateMock.mockResolvedValueOnce(makeInvoice({ status: "PAID", paidAt: new Date() }));

    const res = await request(app)
      .patch("/v1/tenants/current/billing/invoices/inv_1")
      .send({ status: "paid" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.invoice.status).toBe("paid");
    expect(res.body.invoice.id).toBe("inv_1");
  });

  it("sets paidAt when updating status to PAID", async () => {
    const app = createTestApp(defaultMemberships);

    billingInvoiceFindFirstMock.mockResolvedValueOnce(makeInvoice({ status: "OPEN", paidAt: null }));
    billingInvoiceUpdateMock.mockResolvedValueOnce(makeInvoice({ status: "PAID", paidAt: new Date() }));

    await request(app)
      .patch("/v1/tenants/current/billing/invoices/inv_1")
      .send({ status: "paid" });

    expect(billingInvoiceUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "PAID", paidAt: expect.any(Date) }),
      }),
    );
  });

  it("clears paidAt when updating status away from PAID", async () => {
    const app = createTestApp(defaultMemberships);

    billingInvoiceFindFirstMock.mockResolvedValueOnce(makeInvoice({ status: "PAID" }));
    billingInvoiceUpdateMock.mockResolvedValueOnce(makeInvoice({ status: "VOID", paidAt: null }));

    await request(app)
      .patch("/v1/tenants/current/billing/invoices/inv_1")
      .send({ status: "void" });

    expect(billingInvoiceUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "VOID", paidAt: null }),
      }),
    );
  });

  it("updates hostedUrl", async () => {
    const app = createTestApp(defaultMemberships);

    billingInvoiceFindFirstMock.mockResolvedValueOnce(makeInvoice());
    billingInvoiceUpdateMock.mockResolvedValueOnce(
      makeInvoice({ hostedUrl: "https://invoices.example.com/inv_1" }),
    );

    const res = await request(app)
      .patch("/v1/tenants/current/billing/invoices/inv_1")
      .send({ hostedUrl: "https://invoices.example.com/inv_1" });

    expect(res.status).toBe(200);
    expect(res.body.invoice.hostedUrl).toBe("https://invoices.example.com/inv_1");
  });
});
