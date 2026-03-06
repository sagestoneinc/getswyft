import { getPrismaClient } from "./db.js";
import { env } from "../config/env.js";

function aggregateMemberships(userRoles) {
  const byTenant = new Map();

  for (const userRole of userRoles) {
    if (!byTenant.has(userRole.tenantId)) {
      byTenant.set(userRole.tenantId, {
        tenantId: userRole.tenantId,
        tenantSlug: userRole.tenant.slug,
        tenantName: userRole.tenant.name,
        roleKeys: new Set(),
        permissions: new Set(),
      });
    }

    const membership = byTenant.get(userRole.tenantId);
    membership.roleKeys.add(userRole.role.key);

    for (const rolePermission of userRole.role.permissions) {
      membership.permissions.add(rolePermission.permission.key);
    }
  }

  return Array.from(byTenant.values()).map((membership) => ({
    ...membership,
    roleKeys: Array.from(membership.roleKeys),
    permissions: Array.from(membership.permissions),
  }));
}

export async function loadAccessContextFromClaims(claims, { autoProvision = true } = {}) {
  const prisma = getPrismaClient();
  const externalAuthId = String(claims.sub);

  let user = await prisma.user.findUnique({
    where: { externalAuthId },
  });

  if (!user && autoProvision) {
    user = await prisma.user.create({
      data: {
        externalAuthId,
        email: String(claims.email || `${externalAuthId}@local.invalid`),
        displayName: String(claims.name || claims.nickname || "New User"),
      },
    });
  }

  if (!user) {
    return {
      user: null,
      memberships: [],
      roleKeys: [],
      permissions: [],
    };
  }

  let userRoles = await prisma.userRole.findMany({
    where: {
      userId: user.id,
    },
    include: {
      tenant: true,
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  if (userRoles.length === 0 && env.DEV_AUTH_BYPASS) {
    const [defaultTenant, adminRole] = await Promise.all([
      prisma.tenant.findUnique({ where: { slug: env.DEV_DEFAULT_TENANT_SLUG } }),
      prisma.role.findUnique({ where: { key: "tenant_admin" } }),
    ]);

    if (defaultTenant && adminRole) {
      await prisma.userRole.upsert({
        where: {
          tenantId_userId_roleId: {
            tenantId: defaultTenant.id,
            userId: user.id,
            roleId: adminRole.id,
          },
        },
        update: {},
        create: {
          tenantId: defaultTenant.id,
          userId: user.id,
          roleId: adminRole.id,
        },
      });

      userRoles = await prisma.userRole.findMany({
        where: {
          userId: user.id,
        },
        include: {
          tenant: true,
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });
    }
  }

  const memberships = aggregateMemberships(userRoles);
  const roleKeys = Array.from(new Set(memberships.flatMap((membership) => membership.roleKeys)));
  const permissions = Array.from(new Set(memberships.flatMap((membership) => membership.permissions)));

  return {
    user,
    memberships,
    roleKeys,
    permissions,
  };
}
