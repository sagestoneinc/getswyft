import { SignJWT } from "jose";
import { env } from "../config/env.js";

/**
 * Generates a LiveKit access token for a participant to join a room.
 *
 * LiveKit uses HMAC-SHA256 signed JWTs with a `video` grants payload.
 *
 * @param {object} options
 * @param {string} options.roomName  - The LiveKit room name to grant access to
 * @param {string} options.identity - Participant identity (typically userId)
 * @param {boolean} [options.canPublish=true]    - Allow participant to publish tracks
 * @param {boolean} [options.canSubscribe=true]  - Allow participant to subscribe to tracks
 * @param {number}  [options.ttlSeconds=3600]    - Token TTL in seconds (default 1 hour)
 * @returns {Promise<string>} Signed JWT token string
 */
export async function generateRoomToken({
  roomName,
  identity,
  canPublish = true,
  canSubscribe = true,
  ttlSeconds = 3600,
}) {
  const apiKey = env.LIVEKIT_API_KEY;
  const apiSecret = env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new LiveKitConfigError("LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be configured");
  }

  const secretBytes = new TextEncoder().encode(apiSecret);
  const now = Math.floor(Date.now() / 1000);

  const token = await new SignJWT({
    video: {
      roomJoin: true,
      room: roomName,
      canPublish,
      canSubscribe,
    },
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(apiKey)
    .setSubject(identity)
    .setIssuedAt(now)
    .setNotBefore(now)
    .setExpirationTime(now + ttlSeconds)
    .sign(secretBytes);
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

export class LiveKitConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "LiveKitConfigError";
  }
}

/**
 * Returns true when LiveKit is configured in the environment.
 */
export function isLiveKitConfigured() {
  return Boolean(env.LIVEKIT_URL && env.LIVEKIT_API_KEY && env.LIVEKIT_API_SECRET);
export function getLiveKitUrl() {
  return env.LIVEKIT_URL || null;
}
