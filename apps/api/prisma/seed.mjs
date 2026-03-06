import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const permissionSeeds = [
  { key: "tenant.manage", description: "Manage tenant settings" },
  { key: "user.manage", description: "Manage tenant users" },
  { key: "conversation.read", description: "Read conversations" },
  { key: "conversation.write", description: "Write conversations and messages" },
  { key: "moderation.manage", description: "Moderate reports and content" },
  { key: "analytics.read", description: "Read tenant analytics" },
  { key: "featureflag.manage", description: "Manage feature flags" },
];

async function seed() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "default" },
    update: { name: "Default Tenant" },
    create: {
      slug: "default",
      name: "Default Tenant",
      status: "ACTIVE",
    },
  });

  await prisma.tenantBranding.upsert({
    where: { tenantId: tenant.id },
    update: {
      primaryColor: "#14b8a6",
      supportEmail: "support@getswyft.local",
    },
    create: {
      tenantId: tenant.id,
      primaryColor: "#14b8a6",
      supportEmail: "support@getswyft.local",
    },
  });

  const permissions = [];
  for (const permissionSeed of permissionSeeds) {
    const permission = await prisma.permission.upsert({
      where: { key: permissionSeed.key },
      update: permissionSeed,
      create: permissionSeed,
    });
    permissions.push(permission);
  }

  const adminRole = await prisma.role.upsert({
    where: { key: "tenant_admin" },
    update: { name: "Tenant Admin", isSystem: true },
    create: { key: "tenant_admin", name: "Tenant Admin", isSystem: true },
  });

  const agentRole = await prisma.role.upsert({
    where: { key: "agent" },
    update: { name: "Agent", isSystem: true },
    create: { key: "agent", name: "Agent", isSystem: true },
  });

  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  for (const permissionKey of ["conversation.read", "conversation.write"]) {
    const permission = permissions.find((entry) => entry.key === permissionKey);
    if (!permission) {
      continue;
    }

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: agentRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: agentRole.id,
        permissionId: permission.id,
      },
    });
  }

  const adminUser = await prisma.user.upsert({
    where: { externalAuthId: "dev|local-user" },
    update: {
      email: "admin@getswyft.local",
      displayName: "Local Admin",
    },
    create: {
      externalAuthId: "dev|local-user",
      email: "admin@getswyft.local",
      displayName: "Local Admin",
    },
  });

  await prisma.userRole.upsert({
    where: {
      tenantId_userId_roleId: {
        tenantId: tenant.id,
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  await prisma.tenantFeatureFlag.upsert({
    where: {
      tenantId_key: {
        tenantId: tenant.id,
        key: "phase1_foundations",
      },
    },
    update: {
      enabled: true,
    },
    create: {
      tenantId: tenant.id,
      key: "phase1_foundations",
      enabled: true,
      config: {
        notes: "Seeded baseline feature flag",
      },
    },
  });

  await prisma.notification.create({
    data: {
      tenantId: tenant.id,
      userId: adminUser.id,
      type: "system",
      title: "Tenant initialized",
      body: "Phase 1 foundations have been seeded successfully.",
      payload: {
        phase: 1,
      },
    },
  });
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
