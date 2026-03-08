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

export const billingRouter = Router();

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
    ? Math.round(Number(firstItem.price.unit_price.amount) / 100)
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
    ? Math.round(Number(data.details.totals.total) / 100)
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
