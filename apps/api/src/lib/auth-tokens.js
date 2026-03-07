import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "../config/env.js";

let jwks;

function normalizeIssuer(issuer) {
  if (!issuer) {
    return null;
  }

  return issuer.endsWith("/") ? issuer : `${issuer}/`;
}

export async function verifyAccessToken(token) {
  const issuer = normalizeIssuer(env.AUTH_ISSUER_URL);
  if (!issuer) {
    throw new Error("AUTH_ISSUER_URL is not configured");
  }

  if (!jwks) {
    const jwksUrl = env.AUTH_JWKS_URI || `${issuer}.well-known/jwks.json`;
    jwks = createRemoteJWKSet(new URL(jwksUrl));
  }

  const { payload } = await jwtVerify(token, jwks, {
    issuer,
    audience: env.AUTH_AUDIENCE || undefined,
  });

  return payload;
}

export function extractBearerToken(authorizationHeader) {
  if (!authorizationHeader || typeof authorizationHeader !== "string") {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }

  return token;
}
