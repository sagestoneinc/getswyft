import crypto from "node:crypto";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

const BRAINTREE_SANDBOX_URL = "https://payments.sandbox.braintree-api.com/graphql";
const BRAINTREE_PRODUCTION_URL = "https://payments.braintree-api.com/graphql";

function getBaseUrl() {
  return env.BRAINTREE_ENV === "production" ? BRAINTREE_PRODUCTION_URL : BRAINTREE_SANDBOX_URL;
}

function getAuthHeader() {
  if (!env.BRAINTREE_PUBLIC_KEY || !env.BRAINTREE_PRIVATE_KEY) {
    throw new Error("BRAINTREE_PUBLIC_KEY and BRAINTREE_PRIVATE_KEY are required for Braintree billing");
  }

  const credentials = Buffer.from(`${env.BRAINTREE_PUBLIC_KEY}:${env.BRAINTREE_PRIVATE_KEY}`).toString("base64");
  return `Basic ${credentials}`;
}

async function braintreeGraphQL(query, variables) {
  const url = getBaseUrl();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
      "Braintree-Version": "2024-08-01",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Braintree GraphQL request failed with ${response.status}: ${errorBody}`);
  }

  const result = await response.json();

  if (result.errors?.length) {
    throw new Error(`Braintree GraphQL error: ${result.errors[0].message}`);
  }

  return result.data;
}

export async function createBraintreeCustomer({ email, name }) {
  const query = `
    mutation CreateCustomer($input: CreateCustomerInput!) {
      createCustomer(input: $input) {
        customer {
          id
          email
        }
      }
    }
  `;

  const data = await braintreeGraphQL(query, {
    input: {
      customer: {
        email,
        company: name || undefined,
      },
    },
  });

  return data.createCustomer.customer;
}

export async function getBraintreeSubscription(subscriptionId) {
  const query = `
    query GetSubscription($id: ID!) {
      node(id: $id) {
        ... on Subscription {
          id
          status
          planId
          nextBillingDate
          price
          currentBillingCycle
        }
      }
    }
  `;

  const data = await braintreeGraphQL(query, { id: subscriptionId });
  return data.node;
}

export async function cancelBraintreeSubscription(subscriptionId) {
  const query = `
    mutation CancelSubscription($input: CancelSubscriptionInput!) {
      cancelSubscription(input: $input) {
        subscription {
          id
          status
        }
      }
    }
  `;

  const data = await braintreeGraphQL(query, {
    input: { subscriptionId },
  });

  return data.cancelSubscription.subscription;
}

export function verifyBraintreeWebhookSignature(signature, payload) {
  if (!env.BRAINTREE_WEBHOOK_SECRET) {
    logger.warn("braintree_webhook_signature_skipped", {
      reason: "BRAINTREE_WEBHOOK_SECRET is not set",
    });
    return false;
  }

  if (!signature || !payload) {
    return false;
  }

  const computed = crypto
    .createHmac("sha256", env.BRAINTREE_WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed, "hex"),
      Buffer.from(signature, "hex"),
    );
  } catch {
    return false;
  }
}

export function mapBraintreeStatus(btStatus) {
  const statusMap = {
    Active: "ACTIVE",
    Canceled: "CANCELED",
    Expired: "CANCELED",
    "Past Due": "PAST_DUE",
    Pending: "TRIALING",
  };

  return statusMap[btStatus] || "ACTIVE";
}

export function parseBraintreeAmount(amount) {
  if (!amount) {
    return 0;
  }

  return Math.round(Number(amount) * 100);
}
