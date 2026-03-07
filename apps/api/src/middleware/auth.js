import { env } from "../config/env.js";
import { extractBearerToken, verifyAccessToken } from "../lib/auth-tokens.js";
import { loadAccessContextFromClaims } from "../lib/access-context.js";
import { extendRequestContext } from "../lib/request-context.js";

async function buildAuthenticatedRequest(req, claims) {
  const access = await loadAccessContextFromClaims(claims, {
    autoProvision: true,
  });

  req.auth = {
    isAuthenticated: Boolean(access.user),
    subject: String(claims.sub),
    claims,
    user: access.user,
    memberships: access.memberships,
    roleKeys: access.roleKeys,
    permissions: access.permissions,
    activeTenant: null,
  };

  extendRequestContext(req, {
    userId: access.user?.id || null,
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
    const devUserHeader = req.header("x-dev-user-id");

    if (!token && env.DEV_AUTH_BYPASS && devUserHeader) {
      await buildAuthenticatedRequest(req, getDevClaims(req));
      return next();
    }

    if (!token) {
      req.auth = {
        isAuthenticated: false,
        subject: null,
        claims: null,
        user: null,
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
