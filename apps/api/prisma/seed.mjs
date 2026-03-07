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

const seededConversations = [
  {
    id: "conv_seed_unassigned_1",
    status: "OPEN",
    assignedUserId: null,
    afterHours: false,
    leadName: "Robert Chen",
    leadEmail: "robert.c@email.com",
    leadPhone: "(555) 456-7890",
    leadSource: "Website",
    listingAddress: "789 Pine Rd, Austin TX",
    listingPrice: "$340,000",
    listingBeds: 2,
    listingBaths: 2,
    listingSqft: 1200,
    listingMls: "MLS-78903",
    lastMessagePreview: "What's the HOA fee?",
    lastMessageAt: new Date("2026-03-02T09:15:00Z"),
    notes: "",
    messages: [
      {
        id: "msg_seed_unassigned_1",
        senderType: "VISITOR",
        body: "What's the HOA fee for 789 Pine Rd?",
        createdAt: new Date("2026-03-02T09:15:00Z"),
      },
    ],
  },
  {
    id: "conv_seed_mine_1",
    status: "OPEN",
    afterHours: false,
    leadName: "James Wilson",
    leadEmail: "james.w@email.com",
    leadPhone: "(555) 234-5678",
    leadSource: "Website",
    leadUtm: "google_ads",
    listingAddress: "123 Oak Street, Austin TX",
    listingPrice: "$485,000",
    listingBeds: 3,
    listingBaths: 2,
    listingSqft: 1850,
    listingMls: "MLS-78901",
    lastMessagePreview: "Yes, this Saturday works for the tour!",
    lastMessageAt: new Date("2026-03-02T10:26:00Z"),
    notes: "Very interested buyer. Pre-approved for $500k.",
    messages: [
      {
        id: "msg_seed_mine_1",
        senderType: "VISITOR",
        body: "Hi, I'm interested in the listing at 123 Oak Street.",
        createdAt: new Date("2026-03-02T10:23:00Z"),
      },
      {
        id: "msg_seed_mine_2",
        senderType: "AGENT",
        body: "Great choice! That's a beautiful 3BR/2BA listed at $485,000. Would you like to schedule a tour?",
        createdAt: new Date("2026-03-02T10:24:00Z"),
        readByAdmin: true,
      },
      {
        id: "msg_seed_mine_3",
        senderType: "VISITOR",
        body: "Yes, this Saturday works for the tour!",
        createdAt: new Date("2026-03-02T10:26:00Z"),
      },
    ],
  },
  {
    id: "conv_seed_closed_1",
    status: "CLOSED",
    afterHours: false,
    leadName: "Patricia Moore",
    leadEmail: "pat.m@email.com",
    leadPhone: "(555) 789-0123",
    leadSource: "Website",
    listingAddress: "890 Birch Way, Austin TX",
    listingPrice: "$420,000",
    listingBeds: 3,
    listingBaths: 2,
    listingSqft: 1650,
    listingMls: "MLS-78906",
    lastMessagePreview: "Wonderful news! I'll prepare the offer paperwork right away. Congratulations!",
    lastMessageAt: new Date("2026-03-01T18:10:00Z"),
    notes: "Closed deal! Offer accepted at $415,000.",
    messages: [
      {
        id: "msg_seed_closed_1",
        senderType: "VISITOR",
        body: "We've decided to go with this property. What's the next step?",
        createdAt: new Date("2026-03-01T18:05:00Z"),
        readByAdmin: true,
      },
      {
        id: "msg_seed_closed_2",
        senderType: "AGENT",
        body: "Wonderful news! I'll prepare the offer paperwork right away. Congratulations!",
        createdAt: new Date("2026-03-01T18:10:00Z"),
        readByAdmin: true,
      },
    ],
  },
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

  for (const conversationSeed of seededConversations) {
    const conversation = await prisma.conversation.upsert({
      where: { id: conversationSeed.id },
      update: {
        tenantId: tenant.id,
        assignedUserId: conversationSeed.status === "OPEN" && conversationSeed.id === "conv_seed_unassigned_1" ? null : adminUser.id,
        status: conversationSeed.status,
        leadName: conversationSeed.leadName,
        leadEmail: conversationSeed.leadEmail,
        leadPhone: conversationSeed.leadPhone,
        leadSource: conversationSeed.leadSource,
        leadUtm: conversationSeed.leadUtm || null,
        listingAddress: conversationSeed.listingAddress,
        listingPrice: conversationSeed.listingPrice,
        listingBeds: conversationSeed.listingBeds,
        listingBaths: conversationSeed.listingBaths,
        listingSqft: conversationSeed.listingSqft,
        listingMls: conversationSeed.listingMls,
        lastMessagePreview: conversationSeed.lastMessagePreview,
        lastMessageAt: conversationSeed.lastMessageAt,
        afterHours: conversationSeed.afterHours,
        notes: conversationSeed.notes,
      },
      create: {
        id: conversationSeed.id,
        tenantId: tenant.id,
        assignedUserId: conversationSeed.status === "OPEN" && conversationSeed.id === "conv_seed_unassigned_1" ? null : adminUser.id,
        status: conversationSeed.status,
        leadName: conversationSeed.leadName,
        leadEmail: conversationSeed.leadEmail,
        leadPhone: conversationSeed.leadPhone,
        leadSource: conversationSeed.leadSource,
        leadUtm: conversationSeed.leadUtm || null,
        listingAddress: conversationSeed.listingAddress,
        listingPrice: conversationSeed.listingPrice,
        listingBeds: conversationSeed.listingBeds,
        listingBaths: conversationSeed.listingBaths,
        listingSqft: conversationSeed.listingSqft,
        listingMls: conversationSeed.listingMls,
        lastMessagePreview: conversationSeed.lastMessagePreview,
        lastMessageAt: conversationSeed.lastMessageAt,
        afterHours: conversationSeed.afterHours,
        notes: conversationSeed.notes,
      },
    });

    for (const messageSeed of conversationSeed.messages) {
      const message = await prisma.conversationMessage.upsert({
        where: { id: messageSeed.id },
        update: {
          conversationId: conversation.id,
          senderType: messageSeed.senderType,
          senderUserId: messageSeed.senderType === "AGENT" ? adminUser.id : null,
          body: messageSeed.body,
          createdAt: messageSeed.createdAt,
        },
        create: {
          id: messageSeed.id,
          conversationId: conversation.id,
          senderType: messageSeed.senderType,
          senderUserId: messageSeed.senderType === "AGENT" ? adminUser.id : null,
          body: messageSeed.body,
          createdAt: messageSeed.createdAt,
        },
      });

      if (messageSeed.readByAdmin) {
        await prisma.messageReceipt.upsert({
          where: {
            messageId_userId: {
              messageId: message.id,
              userId: adminUser.id,
            },
          },
          update: {
            deliveredAt: messageSeed.createdAt,
            readAt: messageSeed.createdAt,
          },
          create: {
            messageId: message.id,
            userId: adminUser.id,
            deliveredAt: messageSeed.createdAt,
            readAt: messageSeed.createdAt,
          },
        });
      }
    }
  }

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
