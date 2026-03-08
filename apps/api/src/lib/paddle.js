import crypto from "node:crypto";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

const PADDLE_SANDBOX_URL = "https://sandbox-api.paddle.com";
const PADDLE_PRODUCTION_URL = "https://api.paddle.com";

function getBaseUrl() {
  return env.PADDLE_ENV === "production" ? PADDLE_PRODUCTION_URL : PADDLE_SANDBOX_URL;
}

async function paddleRequest(method, path, payload) {
  if (!env.PADDLE_API_KEY) {
    throw new Error("PADDLE_API_KEY is required for Paddle billing");
  }

  const url = `${getBaseUrl()}${path}`;
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${env.PADDLE_API_KEY}`,
      "Content-Type": "application/json",
    },
  };

  if (payload && method !== "GET") {
    options.body = JSON.stringify(payload);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Paddle request ${method} ${path} failed with ${response.status}: ${errorBody}`);
  }

  return response.json();
}

export async function createPaddleCustomer({ email, name }) {
  const result = await paddleRequest("POST", "/customers", {
    email,
    name: name || undefined,
  });

  return result.data;
}

export async function getPaddleCustomer(customerId) {
  const result = await paddleRequest("GET", `/customers/${customerId}`);
  return result.data;
}

export async function getSubscription(subscriptionId) {
  const result = await paddleRequest("GET", `/subscriptions/${subscriptionId}`);
  return result.data;
}

export async function cancelSubscription(subscriptionId, { effectiveFrom = "next_billing_period" } = {}) {
  const result = await paddleRequest("POST", `/subscriptions/${subscriptionId}/cancel`, {
    effective_from: effectiveFrom,
  });

  return result.data;
}

export async function getTransactionInvoice(transactionId) {
  const result = await paddleRequest("GET", `/transactions/${transactionId}/invoice`);
  return result.data;
}

export function verifyPaddleWebhookSignature(rawBody, signature) {
  if (!env.PADDLE_WEBHOOK_SECRET) {
    logger.warn("paddle_webhook_signature_skipped", {
      reason: "PADDLE_WEBHOOK_SECRET is not set",
    });
    return false;
  }

  if (!signature) {
    return false;
  }

  const parts = {};
  for (const pair of signature.split(";")) {
    const [key, value] = pair.split("=");
    if (key && value) {
      parts[key] = value;
    }
  }

  const ts = parts.ts;
  const h1 = parts.h1;

  if (!ts || !h1) {
    return false;
  }

  const payload = `${ts}:${rawBody}`;
  const computed = crypto
    .createHmac("sha256", env.PADDLE_WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  try {
    const computedBuf = Buffer.from(computed, "hex");
    const receivedBuf = Buffer.from(h1, "hex");

    if (computedBuf.length !== receivedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(computedBuf, receivedBuf);
  } catch (error) {
    logger.warn("paddle_webhook_signature_invalid", {
      reason: "Failed to parse or compare webhook signature",
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

export function mapPaddleStatus(paddleStatus) {
  const statusMap = {
    active: "ACTIVE",
    trialing: "TRIALING",
    past_due: "PAST_DUE",
    paused: "CANCELED",
    canceled: "CANCELED",
  };

  return statusMap[paddleStatus] || "ACTIVE";
}

export function mapPaddleInterval(billingCycle) {
  if (!billingCycle?.interval) {
    return "MONTHLY";
  }

  return billingCycle.interval === "year" ? "YEARLY" : "MONTHLY";
}
