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
  "team.invite_resent",
  "team.invite_revoked",
  "team.invite_accepted",
];

// Retry schedule: delays in ms between attempts (3 retries after initial attempt)
const RETRY_DELAYS_MS = [5_000, 15_000, 45_000];

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

/**
 * Attempts a single HTTP delivery of the webhook payload.
 * Returns { ok, retryable, statusCode, responseBody, durationMs } — never throws.
 */
async function attemptDelivery(endpoint, rawBody, { eventType, deliveryId, requestId }) {
  const startedAt = Date.now();

  try {
    const headers = {
      "Content-Type": "application/json",
      "User-Agent": "getswyft-webhooks/1.0",
      "x-getswyft-event": eventType,
      "x-getswyft-delivery-id": deliveryId,
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

    return {
      ok: response.ok,
      retryable: response.status >= 500,
      statusCode: response.status,
      responseBody: responseBody.slice(0, 2000) || null,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      ok: false,
      retryable: true,
      statusCode: null,
      responseBody: String(error.message || error).slice(0, 2000),
      durationMs: Date.now() - startedAt,
    };
  }
}

async function persistDeliveryOutcome(prisma, endpoint, delivery, result) {
function scheduleWebhookRetries(endpoint, delivery, { tenant, eventType, payload, requestId }, initialAttempt, rawBody) {
  const prisma = getPrismaClient();

  function runAttempt(attempt) {
    if (attempt > RETRY_DELAYS_MS.length) {
      return;
    }

    const delay = RETRY_DELAYS_MS[attempt - 1];

    logger.info("webhook_retry_scheduled", {
      endpointId: endpoint.id,
      deliveryId: delivery.id,
      eventType,
      attempt,
      delayMs: delay,
    });

    setTimeout(async () => {
      const result = await attemptDelivery(endpoint, rawBody, {
        eventType,
        deliveryId: delivery.id,
        requestId,
      });

      if (result.ok || !result.retryable) {
        try {
          await prisma.webhookDelivery.update({
            where: { id: delivery.id },
            data: {
              completedAt: new Date(),
              statusCode: result.statusCode,
              responseBody: result.responseBody,
              durationMs: result.durationMs,
            },
          });
        } catch (error) {
          logger.error("webhook_delivery_update_failed", {
            endpointId: endpoint.id,
            deliveryId: delivery.id,
            eventType,
            error: String(error?.message || error),
          });
        }
        return;
      }

      logger.warn("webhook_delivery_attempt_failed", {
        endpointId: endpoint.id,
        deliveryId: delivery.id,
        eventType,
        attempt,
        statusCode: result.statusCode,
        retryable: result.retryable,
        remainingRetries: RETRY_DELAYS_MS.length - attempt,
      });

      runAttempt(attempt + 1);
    }, delay);
  }

  runAttempt(initialAttempt);
}

async function deliverWebhook(endpoint, delivery, { tenant, eventType, payload, requestId }) {
  const prisma = getPrismaClient();
  const rawBody = JSON.stringify(buildWebhookBody({ tenant, eventType, payload }));

  // Perform the initial attempt synchronously in the request path.
  const result = await attemptDelivery(endpoint, rawBody, {
    eventType,
    deliveryId: delivery.id,
    requestId,
  });

  // Persist the outcome of the initial attempt.
  try {
    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        completedAt: new Date(),
        statusCode: result.statusCode,
        responseBody: result.responseBody,
        durationMs: result.durationMs,
      },
    });
  } catch (error) {
    logger.error("webhook_delivery_update_failed", {
      endpointId: endpoint.id,
      deliveryId: delivery.id,
      eventType,
      error: String(error?.message || error),
    });
  }

  // If the initial attempt failed but is retryable, schedule background retries
  // without blocking the caller.
  if (!result.ok && result.retryable) {
    logger.warn("webhook_delivery_attempt_failed", {
      endpointId: endpoint.id,
      deliveryId: delivery.id,
      eventType,
      attempt: 1,
      statusCode: result.statusCode,
      retryable: result.retryable,
      remainingRetries: RETRY_DELAYS_MS.length,
    });

    // Start retries from attempt #2 out-of-band.
    scheduleWebhookRetries(endpoint, delivery, { tenant, eventType, payload, requestId }, 2, rawBody);
  }

  return result;
}
  const status = result.ok ? "SUCCESS" : "FAILED";
  const completedAt = new Date();
  const status = result.ok ? "SUCCESS" : "FAILED";
  try {
    await prisma.$transaction([
      prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status,
          statusCode: result.statusCode,
          responseBody: result.responseBody,
          durationMs: result.durationMs,
        },
      }),
      prisma.webhookEndpoint.update({
        where: { id: endpoint.id },
        data: result.ok
          ? { lastDeliveredAt: completedAt }
          : { lastErrorAt: completedAt },
      }),
    ]);
  } catch (dbError) {
    logger.error("webhook_delivery_db_update_failed", {
      endpointId: endpoint.id,
      deliveryId: delivery.id,
      error: dbError.message,
    });
  }
}

function scheduleWebhookRetries(endpoint, delivery, rawBody, { eventType, requestId }, attempt) {
  if (attempt > RETRY_DELAYS_MS.length) {
    return;
  }

  const delay = RETRY_DELAYS_MS[attempt - 1];

  logger.info("webhook_retry_scheduled", {
    endpointId: endpoint.id,
    deliveryId: delivery.id,
    eventType,
    attempt,
    delayMs: delay,
  });

  setTimeout(async () => {
    const result = await attemptDelivery(endpoint, rawBody, {
      eventType,
      deliveryId: delivery.id,
      requestId,
    });

    if (result.ok || !result.retryable) {
      const prisma = getPrismaClient();
      await persistDeliveryOutcome(prisma, endpoint, delivery, result);
      if (!result.ok) {
        logger.warn("webhook_delivery_failed", {
          endpointId: endpoint.id,
          eventType,
          requestId,
          attempt,
          finalStatusCode: result.statusCode,
        });
      }
      return;
    }

    logger.warn("webhook_delivery_attempt_failed", {
      endpointId: endpoint.id,
      deliveryId: delivery.id,
      eventType,
      attempt,
      statusCode: result.statusCode,
      retryable: result.retryable,
      remainingRetries: RETRY_DELAYS_MS.length - attempt,
    });

    scheduleWebhookRetries(endpoint, delivery, rawBody, { eventType, requestId }, attempt + 1);
  }, delay);
}

async function deliverWebhook(endpoint, delivery, { tenant, eventType, payload, requestId }) {
  const prisma = getPrismaClient();
  const rawBody = JSON.stringify(buildWebhookBody({ tenant, eventType, payload }));

  // Perform the initial attempt synchronously in the request path.
  const result = await attemptDelivery(endpoint, rawBody, {
    eventType,
    deliveryId: delivery.id,
    requestId,
  });

  // Persist the outcome of the initial attempt.
  await persistDeliveryOutcome(prisma, endpoint, delivery, result);

  // If the initial attempt failed but is retryable, schedule background retries
  // without blocking the caller.
  if (!result.ok && result.retryable) {
    logger.warn("webhook_delivery_attempt_failed", {
      endpointId: endpoint.id,
      deliveryId: delivery.id,
      eventType,
      attempt: 1,
      statusCode: result.statusCode,
      retryable: result.retryable,
      remainingRetries: RETRY_DELAYS_MS.length,
    });

    scheduleWebhookRetries(endpoint, delivery, rawBody, { eventType, requestId }, 2);
  } else if (!result.ok) {
    logger.warn("webhook_delivery_failed", {
      endpointId: endpoint.id,
      eventType,
      requestId,
      attempt: 1,
      finalStatusCode: result.statusCode,
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
      deliveryIds: [],
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
    deliveryIds: deliveries.map((delivery) => delivery.id),
  };
}

export function sanitizeWebhookEventTypes(eventTypes) {
  return toUniqueSupportedEventTypes(eventTypes);
}
