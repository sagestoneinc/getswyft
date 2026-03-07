import { env } from "../config/env.js";
import { logger } from "./logger.js";

async function telnyxRequest(path, payload) {
  if (!env.TELNYX_API_KEY) {
    throw new Error("TELNYX_API_KEY is required when TELEPHONY_PROVIDER=telnyx");
  }

  const response = await fetch(`https://api.telnyx.com${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.TELNYX_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Telnyx request failed with ${response.status}: ${errorBody}`);
  }

  return response.json();
}

export async function sendSmsMessage({ to, text }) {
  if (env.TELEPHONY_PROVIDER === "telnyx") {
    if (!env.TELNYX_MESSAGING_PROFILE_ID || !env.TELNYX_FROM_NUMBER) {
      throw new Error("TELNYX_MESSAGING_PROFILE_ID and TELNYX_FROM_NUMBER are required for Telnyx SMS");
    }

    return telnyxRequest("/v2/messages", {
      from: env.TELNYX_FROM_NUMBER,
      to,
      text,
      messaging_profile_id: env.TELNYX_MESSAGING_PROFILE_ID,
    });
  }

  logger.info("sms_log_delivery", {
    provider: "log",
    to,
    textPreview: text.slice(0, 64),
  });

  return { provider: "log" };
}

export async function startOutboundCall({ to, from }) {
  if (env.TELEPHONY_PROVIDER === "telnyx") {
    if (!env.TELNYX_CONNECTION_ID || !(from || env.TELNYX_FROM_NUMBER)) {
      throw new Error("TELNYX_CONNECTION_ID and TELNYX_FROM_NUMBER are required for Telnyx voice");
    }

    return telnyxRequest("/v2/calls", {
      connection_id: env.TELNYX_CONNECTION_ID,
      to,
      from: from || env.TELNYX_FROM_NUMBER,
    });
  }

  logger.info("voice_log_delivery", {
    provider: "log",
    to,
    from: from || env.TELNYX_FROM_NUMBER || null,
  });

  return { provider: "log" };
}
