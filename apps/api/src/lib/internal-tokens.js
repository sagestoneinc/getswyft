import crypto from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { env } from "../config/env.js";

const INTERNAL_TOKEN_AUDIENCE = "getswyft-widget";
const INTERNAL_TOKEN_ISSUER = new URL("/internal/widget", env.APP_BASE_URL).toString();

function getSecret() {
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required for internal widget tokens");
  }

  return new TextEncoder().encode(env.JWT_SECRET);
}

export function isVisitorClaims(claims) {
  return claims?.token_use === "visitor";
}

export async function signVisitorAccessToken({
  tenantId,
  conversationId,
  leadName,
  leadEmail,
}) {
  const secret = getSecret();
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({
    token_use: "visitor",
    tenant_id: tenantId,
    conversation_id: conversationId,
    lead_name: leadName || null,
    lead_email: leadEmail || null,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(INTERNAL_TOKEN_ISSUER)
    .setAudience(INTERNAL_TOKEN_AUDIENCE)
    .setSubject(`visitor:${conversationId}:${crypto.randomUUID()}`)
    .setIssuedAt(now)
    .setExpirationTime(now + 60 * 60 * 12)
    .sign(secret);
}

export async function verifyInternalAccessToken(token) {
  const secret = getSecret();
  const { payload } = await jwtVerify(token, secret, {
    issuer: INTERNAL_TOKEN_ISSUER,
    audience: INTERNAL_TOKEN_AUDIENCE,
  });

  return payload;
}
