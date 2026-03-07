import crypto from "node:crypto";
import { getPrismaClient } from "./db.js";
import { logger } from "./logger.js";

export const SUPPORTED_WEBHOOK_EVENT_TYPES = [
  "conversation.assigned",
  "conversation.closed",
  "conversation.reopened",
  "conversation.transferred",
  "message.sent",
  "system.test",
  "team.invite_sent",
];

function toUniqueSupportedEventTypes(eventTypes) {
  return Array.from(
    new Set(
      (Array.isArray(eventTypes) ? eventTypes : [])
        .map((eventType) => String(eventType || "").trim())
        .filter((eventType) => SUPPORTED_WEBHOOK_EVENT_TYPES.includes(eventType)),
    ),
  );
}

function buildWebhookBody({ tenant, eventType, payload }) {
  return {
    event: eventType,
    tenant,
    occurredAt: new Date().toISOString(),
    payload,
  };
}

function signPayload(rawBody, secret) {
  return crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
}

async function deliverWebhook(endpoint, delivery, { tenant, eventType, payload, requestId }) {
  const prisma = getPrismaClient();
  const body = buildWebhookBody({ tenant, eventType, payload });
  const rawBody = JSON.stringify(body);
  const startedAt = Date.now();

  try {
    const headers = {
      "Content-Type": "application/json",
      "User-Agent": "getswyft-webhooks/1.0",
      "x-getswyft-event": eventType,
      "x-getswyft-delivery-id": delivery.id,
      "x-getswyft-request-id": requestId || "",
    };

    if (endpoint.signingSecret) {
      headers["x-getswyft-signature"] = signPayload(rawBody, endpoint.signingSecret);
    }

    const response = await fetch(endpoint.url, {
      method: "POST",
      headers,
      body: rawBody,
      signal: AbortSignal.timeout(5000),
    });

    const responseBody = await response.text().catch(() => "");
    const completedAt = new Date();
    const status = response.ok ? "SUCCESS" : "FAILED";

    await prisma.$transaction([
      prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status,
          statusCode: response.status,
          responseBody: responseBody.slice(0, 2000) || null,
          durationMs: Date.now() - startedAt,
        },
      }),
      prisma.webhookEndpoint.update({
        where: { id: endpoint.id },
        data: response.ok
          ? {
              lastDeliveredAt: completedAt,
            }
          : {
              lastErrorAt: completedAt,
            },
      }),
    ]);
  } catch (error) {
    const completedAt = new Date();

    await prisma.$transaction([
      prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "FAILED",
          responseBody: String(error.message || error).slice(0, 2000),
          durationMs: Date.now() - startedAt,
        },
      }),
      prisma.webhookEndpoint.update({
        where: { id: endpoint.id },
        data: {
          lastErrorAt: completedAt,
        },
      }),
    ]);

    logger.warn("webhook_delivery_failed", {
      endpointId: endpoint.id,
      eventType,
      requestId,
      error: error.message,
    });
  }
}

export async function dispatchTenantWebhookEvent({ tenantId, tenantSlug, tenantName, eventType, payload, requestId, endpointIds }) {
  const prisma = getPrismaClient();
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: {
      tenantId,
      status: "ACTIVE",
      ...(endpointIds?.length ? { id: { in: endpointIds } } : { eventTypes: { has: eventType } }),
    },
  });

  if (!endpoints.length) {
    return {
      dispatched: 0,
    };
  }

  const deliveries = await Promise.all(
    endpoints.map((endpoint) =>
      prisma.webhookDelivery.create({
        data: {
          tenantId,
          endpointId: endpoint.id,
          eventType,
          requestId: requestId || null,
          payload,
        },
      }),
    ),
  );

  await Promise.all(
    endpoints.map((endpoint, index) =>
      deliverWebhook(endpoint, deliveries[index], {
        tenant: {
          id: tenantId,
          slug: tenantSlug,
          name: tenantName,
        },
        eventType,
        payload,
        requestId,
      }),
    ),
  );

  return {
    dispatched: endpoints.length,
  };
}

export function sanitizeWebhookEventTypes(eventTypes) {
  return toUniqueSupportedEventTypes(eventTypes);
}
