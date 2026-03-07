import { importPKCS8, SignJWT } from "jose";
import { env } from "../config/env.js";
import { getPrismaClient } from "./db.js";
import { logger } from "./logger.js";

let fcmAccessToken;
let fcmAccessTokenExpiresAt = 0;

function getNormalizedPrivateKey() {
  if (!env.FCM_PRIVATE_KEY) {
    return null;
  }

  return env.FCM_PRIVATE_KEY.replace(/\\n/g, "\n");
}

async function getFcmAccessToken() {
  if (!env.FCM_CLIENT_EMAIL || !env.FCM_PRIVATE_KEY) {
    throw new Error("FCM_CLIENT_EMAIL and FCM_PRIVATE_KEY are required when PUSH_PROVIDER=fcm");
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (fcmAccessToken && fcmAccessTokenExpiresAt - nowSeconds > 60) {
    return fcmAccessToken;
  }

  const key = await importPKCS8(getNormalizedPrivateKey(), "RS256");
  const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/firebase.messaging" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(env.FCM_CLIENT_EMAIL)
    .setSubject(env.FCM_CLIENT_EMAIL)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(nowSeconds)
    .setExpirationTime(nowSeconds + 3600)
    .sign(key);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`FCM OAuth token request failed with ${response.status}: ${errorBody}`);
  }

  const result = await response.json();
  fcmAccessToken = result.access_token;
  fcmAccessTokenExpiresAt = nowSeconds + Number(result.expires_in || 3600);
  return fcmAccessToken;
}

async function sendWithFcm(token, payload) {
  if (!env.FCM_PROJECT_ID) {
    throw new Error("FCM_PROJECT_ID is required when PUSH_PROVIDER=fcm");
  }

  const accessToken = await getFcmAccessToken();
  const response = await fetch(`https://fcm.googleapis.com/v1/projects/${env.FCM_PROJECT_ID}/messages:send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: Object.fromEntries(
          Object.entries(payload.data || {}).map(([key, value]) => [key, String(value)]),
        ),
        webpush: {
          notification: {
            title: payload.title,
            body: payload.body,
          },
          fcm_options: payload.link ? { link: payload.link } : undefined,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`FCM send failed with ${response.status}: ${errorBody}`);
  }

  return response.json();
}

async function sendDevicePush(device, payload) {
  if (env.PUSH_PROVIDER === "fcm") {
    return sendWithFcm(device.token, payload);
  }

  logger.info("push_log_delivery", {
    provider: "log",
    tenantId: device.tenantId,
    userId: device.userId,
    tokenPreview: `${device.token.slice(0, 8)}...`,
    title: payload.title,
  });

  return { provider: "log" };
}

export async function upsertNotificationDevice({ tenantId, userId, token, deviceLabel, userAgent, platform = "WEB" }) {
  const prisma = getPrismaClient();

  return prisma.notificationDevice.upsert({
    where: {
      token,
    },
    update: {
      tenantId,
      userId,
      platform,
      deviceLabel: deviceLabel || null,
      userAgent: userAgent || null,
      disabledAt: null,
      lastSeenAt: new Date(),
    },
    create: {
      tenantId,
      userId,
      token,
      platform,
      deviceLabel: deviceLabel || null,
      userAgent: userAgent || null,
      lastSeenAt: new Date(),
    },
  });
}

export async function disableNotificationDevice({ tenantId, userId, token }) {
  const prisma = getPrismaClient();

  await prisma.notificationDevice.updateMany({
    where: {
      tenantId,
      userId,
      token,
      disabledAt: null,
    },
    data: {
      disabledAt: new Date(),
    },
  });
}

export async function createUserNotification({ tenantId, userId, type, title, body, payload, link }) {
  const prisma = getPrismaClient();
  const notification = await prisma.notification.create({
    data: {
      tenantId,
      userId,
      type,
      title,
      body,
      payload: payload || undefined,
    },
  });

  const devices = await prisma.notificationDevice.findMany({
    where: {
      tenantId,
      userId,
      disabledAt: null,
    },
    orderBy: {
      lastSeenAt: "desc",
    },
  });

  await Promise.all(
    devices.map(async (device) => {
      try {
        await sendDevicePush(device, {
          title,
          body,
          data: {
            notificationId: notification.id,
            type,
            ...payload,
          },
          link,
        });
      } catch (error) {
        logger.warn("push_delivery_failed", {
          notificationId: notification.id,
          tenantId,
          userId,
          tokenPreview: `${device.token.slice(0, 8)}...`,
          error: error instanceof Error ? error.message : "Unknown push delivery error",
        });
      }
    }),
  );

  return notification;
}
