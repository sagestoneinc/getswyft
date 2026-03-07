import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "../config/env.js";

let jwks;
let jwksUrlCache;

export function normalizeIssuer(issuer) {
  if (!issuer) {
    return null;
  }

  return issuer.endsWith("/") ? issuer.slice(0, -1) : issuer;
}

export function resolveAuthConfig() {
  if (env.AUTH_PROVIDER === "supabase") {
    const supabaseUrl = normalizeIssuer(env.SUPABASE_URL);
    const issuer = normalizeIssuer(env.AUTH_ISSUER_URL) || (supabaseUrl ? `${supabaseUrl}/auth/v1` : null);
    const jwksUrl =
      env.AUTH_JWKS_URI || (issuer ? `${issuer}/.well-known/jwks.json` : null);

    return {
      issuer,
      jwksUrl,
      audience: env.AUTH_AUDIENCE || undefined,
    };
  }

  const issuer = normalizeIssuer(env.AUTH_ISSUER_URL);
  return {
    issuer,
    jwksUrl: env.AUTH_JWKS_URI || (issuer ? new URL(".well-known/jwks.json", `${issuer}/`).toString() : null),
    audience: env.AUTH_AUDIENCE || undefined,
  };
}

export async function verifyAccessToken(token) {
  const { issuer, jwksUrl, audience } = resolveAuthConfig();
  if (!issuer) {
    throw new Error("Auth issuer configuration is missing");
  }

  if (!jwksUrl) {
    throw new Error("Auth JWKS configuration is missing");
  }

  if (!jwks || jwksUrlCache !== jwksUrl) {
    jwks = createRemoteJWKSet(new URL(jwksUrl));
    jwksUrlCache = jwksUrl;
  }

  const { payload } = await jwtVerify(token, jwks, {
    issuer,
    audience,
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
