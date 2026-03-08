import { Router } from "express";
import { getPrismaClient } from "../../lib/db.js";
import { writeAuditLog } from "../../lib/audit.js";
import { recordAnalyticsEvent } from "../../lib/analytics.js";
import { logger } from "../../lib/logger.js";
import {
  verifyPaddleWebhookSignature,
  mapPaddleStatus,
  mapPaddleInterval,
} from "../../lib/paddle.js";
import {
  verifyBraintreeWebhookSignature,
  mapBraintreeStatus,
  parseBraintreeAmount,
} from "../../lib/braintree.js";

export const billingRouter = Router();

const DEFAULT_PLAN_KEY = "professional";

billingRouter.post("/paddle-webhook", async (req, res, next) => {
  try {
    const signature = req.headers["paddle-signature"] || "";
    const rawBody = JSON.stringify(req.body);

    const isValid = verifyPaddleWebhookSignature(rawBody, signature);
    if (!isValid) {
      logger.warn("paddle_webhook_signature_invalid", {
        signature: signature ? "present" : "missing",
      });
      return res.status(400).json({ ok: false, error: "Invalid webhook signature" });
    }

    const eventType = req.body?.event_type;
    const data = req.body?.data;

    if (!eventType || !data) {
      return res.status(400).json({ ok: false, error: "Missing event_type or data" });
    }

    logger.info("paddle_webhook_received", { eventType });

    const prisma = getPrismaClient();

    if (eventType === "subscription.created" || eventType === "subscription.updated") {
      await handleSubscriptionEvent(prisma, data, req);
    } else if (eventType === "subscription.canceled" || eventType === "subscription.paused") {
      await handleSubscriptionCanceled(prisma, data, req);
    } else if (eventType === "transaction.completed") {
      await handleTransactionCompleted(prisma, data, req);
    } else {
      logger.info("paddle_webhook_unhandled", { eventType });
    }

    return res.json({ ok: true });
  } catch (error) {
    logger.error("paddle_webhook_error", { error: error.message });
    return next(error);
  }
});

async function handleSubscriptionEvent(prisma, data, req) {
  const paddleSubscriptionId = data.id;
  const paddleCustomerId = data.customer_id;
  const status = mapPaddleStatus(data.status);
  const interval = mapPaddleInterval(data.billing_cycle);

  const firstItem = data.items?.[0];
  const unitPriceCents = firstItem?.price?.unit_price?.amount
    ? Math.round(Number(firstItem.price.unit_price.amount))
    : 4900;
  const currency = firstItem?.price?.unit_price?.currency_code || "USD";
  const quantity = firstItem?.quantity || 1;
  const planName = firstItem?.price?.description || firstItem?.product?.name || "Professional";

  const nextBilledAt = data.next_billed_at ? new Date(data.next_billed_at) : null;

  const customData = data.custom_data || {};
  const tenantId = customData.tenant_id;

  if (!tenantId) {
    logger.warn("paddle_webhook_no_tenant_id", {
      paddleSubscriptionId,
      paddleCustomerId,
    });
    return;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });

  if (!tenant) {
    logger.warn("paddle_webhook_tenant_not_found", { tenantId });
    return;
  }

  await prisma.billingSubscription.upsert({
    where: { tenantId },
    update: {
      provider: "paddle",
      paddleSubscriptionId,
      paddleCustomerId,
      status,
      interval,
      seatPriceCents: unitPriceCents,
      currency,
      activeSeats: quantity,
      planName,
      nextBillingAt: nextBilledAt,
    },
    create: {
      tenantId,
      provider: "paddle",
      paddleSubscriptionId,
      paddleCustomerId,
      planKey: "professional",
      planName,
      interval,
      status,
      seatPriceCents: unitPriceCents,
      currency,
      activeSeats: quantity,
      nextBillingAt: nextBilledAt,
    },
  });

  req.tenant = tenant;

  await writeAuditLog(req, {
    action: `billing.subscription.${data.status}`,
    entityType: "billing_subscription",
    entityId: paddleSubscriptionId,
    metadata: { paddleCustomerId, status, interval },
  });

  await recordAnalyticsEvent(req, {
    eventName: `billing.subscription.${data.status}`,
    eventCategory: "billing",
    metadata: { paddleSubscriptionId, status },
  });
}

async function handleSubscriptionCanceled(prisma, data, req) {
  const paddleSubscriptionId = data.id;
  const customData = data.custom_data || {};
  const tenantId = customData.tenant_id;

  if (!tenantId) {
    return;
  }

  const existing = await prisma.billingSubscription.findUnique({
    where: { tenantId },
  });

  if (!existing) {
    return;
  }

  await prisma.billingSubscription.update({
    where: { tenantId },
    data: {
      status: "CANCELED",
    },
  });

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });

  if (tenant) {
    req.tenant = tenant;

    await writeAuditLog(req, {
      action: "billing.subscription.canceled",
      entityType: "billing_subscription",
      entityId: paddleSubscriptionId,
      metadata: { paddleSubscriptionId },
    });
  }
}

async function handleTransactionCompleted(prisma, data, req) {
  const transactionId = data.id;
  const paddleSubscriptionId = data.subscription_id;
  const customData = data.custom_data || {};
  const tenantId = customData.tenant_id;

  if (!tenantId || !paddleSubscriptionId) {
    return;
  }

  const subscription = await prisma.billingSubscription.findUnique({
    where: { tenantId },
  });

  if (!subscription) {
    return;
  }

  const totalAmount = data.details?.totals?.total
    ? Math.round(Number(data.details.totals.total))
    : 0;
  const currency = data.currency_code || "USD";

  const billingPeriod = data.billing_period;
  const periodStart = billingPeriod?.starts_at ? new Date(billingPeriod.starts_at) : null;
  const periodEnd = billingPeriod?.ends_at ? new Date(billingPeriod.ends_at) : null;

  const invoiceNumber = data.invoice_number || `PAD-${transactionId.slice(-8).toUpperCase()}`;

  const existingInvoice = await prisma.billingInvoice.findUnique({
    where: { invoiceNumber },
  });

  if (existingInvoice) {
    return;
  }

  await prisma.billingInvoice.create({
    data: {
      tenantId,
      subscriptionId: subscription.id,
      invoiceNumber,
      status: "PAID",
      amountCents: totalAmount,
      currency,
      issuedAt: new Date(),
      periodStart,
      periodEnd,
      paidAt: new Date(),
      hostedUrl: data.checkout?.url || null,
    },
  });

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });

  if (tenant) {
    req.tenant = tenant;

    await writeAuditLog(req, {
      action: "billing.invoice.paid",
      entityType: "billing_invoice",
      entityId: invoiceNumber,
      metadata: { transactionId, amountCents: totalAmount },
    });
  }
}

// ─── Braintree webhook ───────────────────────────────────────────────────────

billingRouter.post("/braintree-webhook", async (req, res, next) => {
  try {
    const signature = req.headers["x-braintree-signature"] || req.body?.bt_signature || "";
    const payload = req.body?.bt_payload || JSON.stringify(req.body);

    const isValid = verifyBraintreeWebhookSignature(signature, payload);
    if (!isValid) {
      logger.warn("braintree_webhook_signature_invalid", {
        signature: signature ? "present" : "missing",
      });
      return res.status(400).json({ ok: false, error: "Invalid webhook signature" });
    }

    let notification;
    try {
      if (typeof payload === "string" && /^[A-Za-z0-9+/=]+$/.test(payload)) {
        notification = JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
      } else if (typeof payload === "string") {
        notification = JSON.parse(payload);
      } else {
        notification = payload;
      }
    } catch {
      notification = req.body;
    }

    const kind = notification?.kind || notification?.event_type;
    const subject = notification?.subject || notification?.data || notification;

    if (!kind) {
      return res.status(400).json({ ok: false, error: "Missing webhook kind" });
    }

    logger.info("braintree_webhook_received", { kind });

    const prisma = getPrismaClient();

    if (kind === "subscription_charged_successfully") {
      await handleBraintreeSubscriptionCharged(prisma, subject, req);
    } else if (kind === "subscription_created" || kind === "subscription_went_active") {
      await handleBraintreeSubscriptionActive(prisma, subject, req);
    } else if (kind === "subscription_canceled" || kind === "subscription_expired") {
      await handleBraintreeSubscriptionCanceled(prisma, subject, req);
    } else if (kind === "subscription_went_past_due") {
      await handleBraintreeSubscriptionPastDue(prisma, subject, req);
    } else {
      logger.info("braintree_webhook_unhandled", { kind });
    }

    return res.json({ ok: true });
  } catch (error) {
    logger.error("braintree_webhook_error", { error: error.message });
    return next(error);
  }
});

async function resolveBraintreeTenant(prisma, subject) {
  const subscription = subject?.subscription || subject;
  const braintreeSubscriptionId = subscription?.id;

  const customFields = subscription?.customFields || subscription?.custom_fields || {};
  const tenantId = customFields.tenant_id;

  if (tenantId) {
    return { tenantId, braintreeSubscriptionId, subscription, customFields };
  }

  if (braintreeSubscriptionId) {
    const existing = await prisma.billingSubscription.findFirst({
      where: { braintreeSubscriptionId },
      select: { tenantId: true },
    });

    if (existing) {
      return { tenantId: existing.tenantId, braintreeSubscriptionId, subscription, customFields };
    }
  }

  return { tenantId: null, braintreeSubscriptionId, subscription, customFields };
}

async function handleBraintreeSubscriptionActive(prisma, subject, req) {
  const { tenantId, braintreeSubscriptionId, subscription, customFields } = await resolveBraintreeTenant(prisma, subject);

  if (!tenantId) {
    logger.warn("braintree_webhook_no_tenant_id", { braintreeSubscriptionId });
    return;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });

  if (!tenant) {
    logger.warn("braintree_webhook_tenant_not_found", { tenantId });
    return;
  }

  const status = mapBraintreeStatus(subscription?.status || "Active");
  const priceCents = parseBraintreeAmount(subscription?.price);
  const nextBillingDate = subscription?.nextBillingDate
    ? new Date(subscription.nextBillingDate)
    : null;
  const planId = subscription?.planId || DEFAULT_PLAN_KEY;
  const customerId = subscription?.merchantAccountId || customFields.customer_id || null;

  await prisma.billingSubscription.upsert({
    where: { tenantId },
    update: {
      provider: "braintree",
      braintreeSubscriptionId,
      braintreeCustomerId: customerId,
      status,
      seatPriceCents: priceCents || 4900,
      nextBillingAt: nextBillingDate,
      planName: planId,
    },
    create: {
      tenantId,
      provider: "braintree",
      braintreeSubscriptionId,
      braintreeCustomerId: customerId,
      planKey: DEFAULT_PLAN_KEY,
      planName: planId,
      interval: "MONTHLY",
      status,
      seatPriceCents: priceCents || 4900,
      currency: "USD",
      activeSeats: 1,
      nextBillingAt: nextBillingDate,
    },
  });

  req.tenant = tenant;

  await writeAuditLog(req, {
    action: "billing.subscription.active",
    entityType: "billing_subscription",
    entityId: braintreeSubscriptionId,
    metadata: { provider: "braintree", status },
  });

  await recordAnalyticsEvent(req, {
    eventName: "billing.subscription.active",
    eventCategory: "billing",
    metadata: { braintreeSubscriptionId, status },
  });
}

async function handleBraintreeSubscriptionCanceled(prisma, subject, req) {
  const { tenantId, braintreeSubscriptionId } = await resolveBraintreeTenant(prisma, subject);

  if (!tenantId) {
    return;
  }

  const existing = await prisma.billingSubscription.findUnique({
    where: { tenantId },
  });

  if (!existing) {
    return;
  }

  await prisma.billingSubscription.update({
    where: { tenantId },
    data: { status: "CANCELED" },
  });

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });

  if (tenant) {
    req.tenant = tenant;

    await writeAuditLog(req, {
      action: "billing.subscription.canceled",
      entityType: "billing_subscription",
      entityId: braintreeSubscriptionId,
      metadata: { provider: "braintree", braintreeSubscriptionId },
    });
  }
}

async function handleBraintreeSubscriptionPastDue(prisma, subject, req) {
  const { tenantId, braintreeSubscriptionId } = await resolveBraintreeTenant(prisma, subject);

  if (!tenantId) {
    return;
  }

  await prisma.billingSubscription.updateMany({
    where: { tenantId },
    data: { status: "PAST_DUE" },
  });

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });

  if (tenant) {
    req.tenant = tenant;

    await writeAuditLog(req, {
      action: "billing.subscription.past_due",
      entityType: "billing_subscription",
      entityId: braintreeSubscriptionId,
      metadata: { provider: "braintree" },
    });
  }
}

async function handleBraintreeSubscriptionCharged(prisma, subject, req) {
  const { tenantId, braintreeSubscriptionId, subscription } = await resolveBraintreeTenant(prisma, subject);

  if (!tenantId) {
    return;
  }

  const billingSubscription = await prisma.billingSubscription.findUnique({
    where: { tenantId },
  });

  if (!billingSubscription) {
    return;
  }

  const transactions = subscription?.transactions || [];
  const latestTransaction = transactions[0];

  if (!latestTransaction) {
    return;
  }

  const amountCents = parseBraintreeAmount(latestTransaction.amount);
  const currency = latestTransaction.currencyIsoCode || "USD";
  const transactionSuffix = (latestTransaction.id || braintreeSubscriptionId || Date.now().toString()).slice(-8).toUpperCase();
  const invoiceNumber = `BT-${transactionSuffix}`;

  if (!transactionSuffix) {
    return;
  }

  const existingInvoice = await prisma.billingInvoice.findUnique({
    where: { invoiceNumber },
  });

  if (existingInvoice) {
    return;
  }

  const billingPeriod = subscription?.currentBillingCycle;
  const now = new Date();
  const periodStartDate = subscription?.firstBillingDate
    ? new Date(subscription.firstBillingDate)
    : subscription?.billingPeriodStartDate
      ? new Date(subscription.billingPeriodStartDate)
      : billingPeriod ? now : null;

  await prisma.billingInvoice.create({
    data: {
      tenantId,
      subscriptionId: billingSubscription.id,
      invoiceNumber,
      status: "PAID",
      amountCents,
      currency,
      issuedAt: now,
      periodStart: periodStartDate,
      periodEnd: subscription?.nextBillingDate ? new Date(subscription.nextBillingDate) : null,
      paidAt: now,
      hostedUrl: null,
    },
  });

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });

  if (tenant) {
    req.tenant = tenant;

    await writeAuditLog(req, {
      action: "billing.invoice.paid",
      entityType: "billing_invoice",
      entityId: invoiceNumber,
      metadata: { provider: "braintree", transactionId: latestTransaction.id, amountCents },
    });
  }
}
