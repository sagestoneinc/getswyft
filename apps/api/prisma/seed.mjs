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

const seededTeamMembers = [
  {
    externalAuthId: "seed|sarah-chen",
    email: "sarah@getswyft.local",
    displayName: "Sarah Chen",
    roleKey: "tenant_admin",
  },
  {
    externalAuthId: "seed|marcus-johnson",
    email: "marcus@getswyft.local",
    displayName: "Marcus Johnson",
    roleKey: "agent",
  },
  {
    externalAuthId: "seed|emily-rodriguez",
    email: "emily@getswyft.local",
    displayName: "Emily Rodriguez",
    roleKey: "agent",
  },
];

const seededWebhookEndpoints = [
  {
    id: "wh_seed_crm",
    url: "https://example-crm.invalid/getswyft",
    description: "CRM sync",
    status: "ACTIVE",
    eventTypes: ["message.sent", "conversation.closed", "conversation.assigned"],
  },
  {
    id: "wh_seed_marketing",
    url: "https://example-marketing.invalid/leads",
    description: "Marketing enrichment",
    status: "DISABLED",
    eventTypes: ["team.invite_sent"],
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

  const roleByKey = {
    tenant_admin: adminRole,
    agent: agentRole,
  };
  const teamUsersByExternalAuthId = new Map();

  for (const teamMember of seededTeamMembers) {
    const user = await prisma.user.upsert({
      where: {
        externalAuthId: teamMember.externalAuthId,
      },
      update: {
        email: teamMember.email,
        displayName: teamMember.displayName,
      },
      create: {
        externalAuthId: teamMember.externalAuthId,
        email: teamMember.email,
        displayName: teamMember.displayName,
      },
    });

    await prisma.userRole.upsert({
      where: {
        tenantId_userId_roleId: {
          tenantId: tenant.id,
          userId: user.id,
          roleId: roleByKey[teamMember.roleKey].id,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        userId: user.id,
        roleId: roleByKey[teamMember.roleKey].id,
      },
    });

    teamUsersByExternalAuthId.set(teamMember.externalAuthId, user);
  }

  await prisma.tenantInvitation.upsert({
    where: {
      token: "seed-team-invite-token",
    },
    update: {
      tenantId: tenant.id,
      roleId: agentRole.id,
      invitedByUserId: adminUser.id,
      email: "new.agent@getswyft.local",
      status: "PENDING",
      expiresAt: new Date("2026-03-15T00:00:00Z"),
      sentAt: new Date("2026-03-07T08:30:00Z"),
      acceptedAt: null,
      revokedAt: null,
      acceptedUserId: null,
    },
    create: {
      token: "seed-team-invite-token",
      tenantId: tenant.id,
      roleId: agentRole.id,
      invitedByUserId: adminUser.id,
      email: "new.agent@getswyft.local",
      status: "PENDING",
      expiresAt: new Date("2026-03-15T00:00:00Z"),
      sentAt: new Date("2026-03-07T08:30:00Z"),
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

  const fallbackUser = teamUsersByExternalAuthId.get("seed|marcus-johnson") || adminUser;
  await prisma.tenantRoutingSettings.upsert({
    where: {
      tenantId: tenant.id,
    },
    update: {
      routingMode: "ROUND_ROBIN",
      officeHoursEnabled: true,
      timezone: "America/Chicago",
      officeHoursStart: "09:00",
      officeHoursEnd: "18:00",
      fallbackUserId: fallbackUser.id,
      afterHoursMessage: "Thanks for reaching out after hours. Your inquiry will be queued for the next available agent at 9:00 AM Central.",
    },
    create: {
      tenantId: tenant.id,
      routingMode: "ROUND_ROBIN",
      officeHoursEnabled: true,
      timezone: "America/Chicago",
      officeHoursStart: "09:00",
      officeHoursEnd: "18:00",
      fallbackUserId: fallbackUser.id,
      afterHoursMessage: "Thanks for reaching out after hours. Your inquiry will be queued for the next available agent at 9:00 AM Central.",
    },
  });

  for (const endpointSeed of seededWebhookEndpoints) {
    await prisma.webhookEndpoint.upsert({
      where: {
        id: endpointSeed.id,
      },
      update: {
        tenantId: tenant.id,
        url: endpointSeed.url,
        description: endpointSeed.description,
        status: endpointSeed.status,
        eventTypes: endpointSeed.eventTypes,
        signingSecret: "seed-signing-secret",
      },
      create: {
        id: endpointSeed.id,
        tenantId: tenant.id,
        url: endpointSeed.url,
        description: endpointSeed.description,
        status: endpointSeed.status,
        eventTypes: endpointSeed.eventTypes,
        signingSecret: "seed-signing-secret",
      },
    });
  }

  const subscription = await prisma.billingSubscription.upsert({
    where: {
      tenantId: tenant.id,
    },
    update: {
      provider: "manual",
      planKey: "professional",
      planName: "Professional",
      interval: "MONTHLY",
      status: "ACTIVE",
      seatPriceCents: 4900,
      currency: "USD",
      activeSeats: 4,
      nextBillingAt: new Date("2026-04-01T00:00:00Z"),
    },
    create: {
      tenantId: tenant.id,
      provider: "manual",
      planKey: "professional",
      planName: "Professional",
      interval: "MONTHLY",
      status: "ACTIVE",
      seatPriceCents: 4900,
      currency: "USD",
      activeSeats: 4,
      nextBillingAt: new Date("2026-04-01T00:00:00Z"),
    },
  });

  for (const invoiceSeed of [
    {
      invoiceNumber: "INV-2026-03",
      amountCents: 19600,
      issuedAt: new Date("2026-03-01T00:00:00Z"),
      periodStart: new Date("2026-03-01T00:00:00Z"),
      periodEnd: new Date("2026-03-31T23:59:59Z"),
      paidAt: new Date("2026-03-01T01:15:00Z"),
    },
    {
      invoiceNumber: "INV-2026-02",
      amountCents: 19600,
      issuedAt: new Date("2026-02-01T00:00:00Z"),
      periodStart: new Date("2026-02-01T00:00:00Z"),
      periodEnd: new Date("2026-02-28T23:59:59Z"),
      paidAt: new Date("2026-02-01T01:05:00Z"),
    },
  ]) {
    await prisma.billingInvoice.upsert({
      where: {
        invoiceNumber: invoiceSeed.invoiceNumber,
      },
      update: {
        tenantId: tenant.id,
        subscriptionId: subscription.id,
        status: "PAID",
        amountCents: invoiceSeed.amountCents,
        currency: "USD",
        issuedAt: invoiceSeed.issuedAt,
        periodStart: invoiceSeed.periodStart,
        periodEnd: invoiceSeed.periodEnd,
        paidAt: invoiceSeed.paidAt,
      },
      create: {
        tenantId: tenant.id,
        subscriptionId: subscription.id,
        invoiceNumber: invoiceSeed.invoiceNumber,
        status: "PAID",
        amountCents: invoiceSeed.amountCents,
        currency: "USD",
        issuedAt: invoiceSeed.issuedAt,
        periodStart: invoiceSeed.periodStart,
        periodEnd: invoiceSeed.periodEnd,
        paidAt: invoiceSeed.paidAt,
      },
    });
  }

  const seededEndpoint = await prisma.webhookEndpoint.findUnique({
    where: {
      id: "wh_seed_crm",
    },
  });

  if (seededEndpoint) {
    for (const deliverySeed of [
      {
        id: "wd_seed_message_sent",
        eventType: "message.sent",
        status: "SUCCESS",
        statusCode: 200,
        requestId: "seed-request-message",
        responseBody: "ok",
        durationMs: 128,
        attemptedAt: new Date("2026-03-02T10:24:01Z"),
      },
      {
        id: "wd_seed_conversation_closed",
        eventType: "conversation.closed",
        status: "FAILED",
        statusCode: 503,
        requestId: "seed-request-close",
        responseBody: "upstream unavailable",
        durationMs: 910,
        attemptedAt: new Date("2026-03-01T16:45:00Z"),
      },
    ]) {
      await prisma.webhookDelivery.upsert({
        where: {
          id: deliverySeed.id,
        },
        update: {
          tenantId: tenant.id,
          endpointId: seededEndpoint.id,
          eventType: deliverySeed.eventType,
          status: deliverySeed.status,
          statusCode: deliverySeed.statusCode,
          requestId: deliverySeed.requestId,
          responseBody: deliverySeed.responseBody,
          durationMs: deliverySeed.durationMs,
          attemptedAt: deliverySeed.attemptedAt,
        },
        create: {
          id: deliverySeed.id,
          tenantId: tenant.id,
          endpointId: seededEndpoint.id,
          eventType: deliverySeed.eventType,
          status: deliverySeed.status,
          statusCode: deliverySeed.statusCode,
          requestId: deliverySeed.requestId,
          responseBody: deliverySeed.responseBody,
          durationMs: deliverySeed.durationMs,
          attemptedAt: deliverySeed.attemptedAt,
        },
      });
    }
  }

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
