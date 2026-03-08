import { env } from "../config/env.js";
import { extractBearerToken, verifyAccessToken } from "../lib/auth-tokens.js";
import { authenticateTenantApiKey } from "../lib/api-keys.js";
import { loadAccessContextFromClaims } from "../lib/access-context.js";
import { extendRequestContext } from "../lib/request-context.js";

function isDevBypassAllowed() {
  return env.DEV_AUTH_BYPASS && env.NODE_ENV !== "production";
}

async function buildAuthenticatedRequest(req, claims) {
  const access = await loadAccessContextFromClaims(claims, {
    autoProvision: true,
  });

  req.auth = {
    isAuthenticated: Boolean(access.user),
    subject: String(claims.sub),
    claims,
    user: access.user,
    apiKey: null,
    memberships: access.memberships,
    roleKeys: access.roleKeys,
    permissions: access.permissions,
    activeTenant: null,
  };

  extendRequestContext(req, {
    userId: access.user?.id || null,
  });
}

async function buildApiKeyAuthenticatedRequest(req, apiKey) {
  const membership = {
    tenantId: apiKey.tenant.id,
    tenantSlug: apiKey.tenant.slug,
    tenantName: apiKey.tenant.name,
    roleKeys: ["api_key"],
    permissions: apiKey.permissions,
  };

  req.auth = {
    isAuthenticated: true,
    subject: `api_key:${apiKey.id}`,
    claims: null,
    user: {
      id: apiKey.createdByUser.id,
      externalAuthId: apiKey.createdByUser.externalAuthId,
      email: apiKey.createdByUser.email,
      displayName: apiKey.createdByUser.displayName,
      avatarUrl: apiKey.createdByUser.avatarUrl,
    },
    apiKey: {
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      permissions: apiKey.permissions,
      tenantId: apiKey.tenantId,
    },
    memberships: [membership],
    roleKeys: membership.roleKeys,
    permissions: membership.permissions,
    activeTenant: null,
  };

  extendRequestContext(req, {
    userId: apiKey.createdByUser.id,
    apiKeyId: apiKey.id,
  });
}

function getDevClaims(req) {
  const userId = req.header("x-dev-user-id") || "local-user";
  const email = req.header("x-dev-user-email") || `${userId}@example.local`;
  const name = req.header("x-dev-user-name") || "Local Developer";

  return {
    sub: `dev|${userId}`,
    email,
    name,
  };
}

export async function authenticateRequest(req, _res, next) {
  try {
    const token = extractBearerToken(req.header("authorization"));
    const rawApiKey = String(req.header("x-api-key") || "").trim();
    const devUserHeader = req.header("x-dev-user-id");
    const devBypassAllowed = isDevBypassAllowed();

    if (rawApiKey) {
      const apiKey = await authenticateTenantApiKey(rawApiKey, {
        ipAddress: req.ip || null,
      });

      if (!apiKey) {
        return resStatus(req, next, 401, "Invalid or disabled API key", new Error("Invalid or disabled API key"));
      }

      await buildApiKeyAuthenticatedRequest(req, apiKey);
      return next();
    }

    if (!token && devBypassAllowed && devUserHeader) {
      await buildAuthenticatedRequest(req, getDevClaims(req));
      return next();
    }

    if (!token) {
      req.auth = {
        isAuthenticated: false,
        subject: null,
        claims: null,
        user: null,
        apiKey: null,
        memberships: [],
        roleKeys: [],
        permissions: [],
        activeTenant: null,
      };
      return next();
    }

    const claims = await verifyAccessToken(token);
    await buildAuthenticatedRequest(req, claims);
    return next();
  } catch (error) {
    return resStatus(req, next, 401, "Invalid or expired access token", error);
  }
}

function resStatus(req, next, statusCode, message, error) {
  req.auth = {
    isAuthenticated: false,
    subject: null,
    claims: null,
    user: null,
    apiKey: null,
    memberships: [],
    roleKeys: [],
    permissions: [],
    activeTenant: null,
  };

  error.statusCode = statusCode;
  error.publicMessage = message;
  return next(error);
}

export function requireAuth(req, res, next) {
  if (!req.auth?.isAuthenticated || !req.auth.user) {
    return res.status(401).json({
      ok: false,
      error: "Authentication required",
    });
  }

  return next();
}
