import { getPrismaClient } from "../lib/db.js";
import { extendRequestContext } from "../lib/request-context.js";

function pickMembershipForTenant(auth, tenant) {
  if (!auth?.memberships?.length || !tenant) {
    return null;
  }

  return auth.memberships.find((membership) => membership.tenantId === tenant.id) || null;
}

export async function resolveTenant(req, _res, next) {
  try {
    const prisma = getPrismaClient();
    const tenantIdHeader = req.header("x-tenant-id");
    const tenantSlugHeader = req.header("x-tenant-slug");

    let tenant = null;

    if (tenantIdHeader) {
      tenant = await prisma.tenant.findUnique({ where: { id: tenantIdHeader } });
    } else if (tenantSlugHeader) {
      tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlugHeader } });
    } else if (req.auth?.isAuthenticated && req.auth.memberships.length > 0) {
      const defaultMembership = req.auth.memberships[0];
      tenant = await prisma.tenant.findUnique({ where: { id: defaultMembership.tenantId } });
    }

    req.tenant = tenant;

    const membership = pickMembershipForTenant(req.auth, tenant);
    if (req.auth) {
      req.auth.activeTenant = membership
        ? {
            tenantId: membership.tenantId,
            tenantSlug: membership.tenantSlug,
            tenantName: membership.tenantName,
            roleKeys: membership.roleKeys,
            permissions: membership.permissions,
          }
        : null;
    }

    extendRequestContext(req, {
      tenantId: tenant?.id || null,
      roles: req.auth?.activeTenant?.roleKeys || [],
      permissions: req.auth?.activeTenant?.permissions || [],
    });

    return next();
  } catch (error) {
    return next(error);
  }
}

export function requireTenant(req, res, next) {
  if (!req.tenant) {
    return res.status(400).json({
      ok: false,
      error: "Tenant context is required",
    });
  }

  if (req.auth?.isAuthenticated && !req.auth.activeTenant) {
    return res.status(403).json({
      ok: false,
      error: "Authenticated user is not assigned to this tenant",
    });
  }

  return next();
}
