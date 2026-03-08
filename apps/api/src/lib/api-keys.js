import crypto from "node:crypto";
import { getPrismaClient } from "./db.js";

const API_KEY_PREFIX = "swyft_live";

function hashApiKey(rawKey) {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

function safeCompare(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function generateTenantApiKeyValue() {
  const publicId = crypto.randomBytes(8).toString("hex");
  const keyPrefix = `${API_KEY_PREFIX}_${publicId}`;
  const secret = crypto.randomBytes(24).toString("base64url");
  const rawKey = `${keyPrefix}.${secret}`;

  return {
    rawKey,
    keyPrefix,
    secretHash: hashApiKey(rawKey),
  };
}

export function normalizeApiKeyPermissions(permissions) {
  return Array.from(
    new Set(
      (Array.isArray(permissions) ? permissions : [])
        .map((permission) => String(permission || "").trim())
        .filter(Boolean),
    ),
  );
}

export function maskApiKeyPrefix(keyPrefix) {
  const prefix = String(keyPrefix || "").trim();
  if (!prefix) {
    return "";
  }

  if (prefix.length <= 14) {
    return prefix;
  }

  return `${prefix.slice(0, 14)}…`;
}

export async function authenticateTenantApiKey(rawKey, { ipAddress } = {}) {
  const value = String(rawKey || "").trim();
  if (!value || !value.includes(".")) {
    return null;
  }

  const keyPrefix = value.split(".")[0];
  if (!keyPrefix.startsWith(`${API_KEY_PREFIX}_`)) {
    return null;
  }

  const prisma = getPrismaClient();
  const apiKey = await prisma.tenantApiKey.findUnique({
    where: {
      keyPrefix,
    },
    include: {
      tenant: true,
      createdByUser: true,
    },
  });

  if (!apiKey || apiKey.disabledAt || !apiKey.createdByUser || !apiKey.createdByUser.isActive) {
    return null;
  }

  const presentedHash = hashApiKey(value);
  if (!safeCompare(apiKey.secretHash, presentedHash)) {
    return null;
  }

  const data = {
    lastUsedAt: new Date(),
  };

  if (ipAddress) {
    data.lastUsedIp = ipAddress;
  }

  await prisma.tenantApiKey.update({
    where: {
      id: apiKey.id,
    },
    data,
  });

  return apiKey;
}
