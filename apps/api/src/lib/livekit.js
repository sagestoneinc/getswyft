import crypto from "node:crypto";
import { SignJWT } from "jose";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

const TOKEN_TTL_SECONDS = 6 * 60 * 60;

function getApiSecret() {
  if (!env.LIVEKIT_API_SECRET) {
    throw new Error("LIVEKIT_API_SECRET is required for LiveKit token generation");
  }

  return new TextEncoder().encode(env.LIVEKIT_API_SECRET);
}

export function isLiveKitConfigured() {
  return Boolean(env.LIVEKIT_URL && env.LIVEKIT_API_KEY && env.LIVEKIT_API_SECRET);
}

export async function createLiveKitToken({ roomName, participantIdentity, participantName, canPublish = true, canSubscribe = true }) {
  if (!isLiveKitConfigured()) {
    logger.warn("livekit_not_configured", {
      message: "LiveKit environment variables are not set. Token generation skipped.",
    });
    return null;
  }

  const secret = getApiSecret();
  const now = Math.floor(Date.now() / 1000);
  const jti = crypto.randomUUID();

  const videoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish,
    canSubscribe,
    canPublishData: true,
  };

  const token = await new SignJWT({
    video: videoGrant,
    metadata: "",
    name: participantName || participantIdentity,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(env.LIVEKIT_API_KEY)
    .setSubject(participantIdentity)
    .setJti(jti)
    .setIssuedAt(now)
    .setExpirationTime(now + TOKEN_TTL_SECONDS)
    .setNotBefore(now)
    .sign(secret);

  return token;
}

export function getLiveKitUrl() {
  return env.LIVEKIT_URL || null;
}
