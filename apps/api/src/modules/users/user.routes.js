import crypto from "node:crypto";
import { Router } from "express";
import { env } from "../../config/env.js";
import { recordAnalyticsEvent } from "../../lib/analytics.js";
import { writeAuditLog } from "../../lib/audit.js";
import { getPrismaClient } from "../../lib/db.js";
import { sendTeamInviteEmail } from "../../lib/email.js";
import { dispatchTenantWebhookEvent } from "../../lib/webhooks.js";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/rbac.js";
import { requireTenant } from "../../middleware/tenant.js";

export const userRouter = Router();

const MANAGED_ROLE_KEYS = ["tenant_admin", "agent"];

function toPrimaryRole(roleKeys) {
  return roleKeys.includes("tenant_admin") ? "admin" : "agent";
}

function toPresenceStatus(sessions) {
  const latestStatus = sessions[0]?.status;

  if (latestStatus === "BUSY") {
    return "busy";
  }

  if (latestStatus === "AWAY") {
    return "away";
  }

  if (latestStatus === "ONLINE") {
    return "online";
  }

  return "offline";
}

function serializeMember(member, conversationCountMap) {
  const roleKeys = Array.from(new Set(member.userRoles.map((userRole) => userRole.role.key)));
  const primaryRole = toPrimaryRole(roleKeys);

  return {
    id: member.id,
    name: member.displayName || member.email,
    email: member.email,
    role: primaryRole,
    roleKeys,
    status: toPresenceStatus(member.presenceSessions),
    conversations: conversationCountMap.get(member.id) || 0,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
  };
}

function serializeInvitation(invitation) {
  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role.key === "tenant_admin" ? "admin" : "agent",
    roleKey: invitation.role.key,
    status: invitation.status.toLowerCase(),
    invitedBy: invitation.invitedByUser.displayName || invitation.invitedByUser.email,
    sentAt: invitation.sentAt,
    expiresAt: invitation.expiresAt,
    acceptedAt: invitation.acceptedAt,
    createdAt: invitation.createdAt,
  };
}

async function resolveManagedRoles(prisma) {
  const roles = await prisma.role.findMany({
    where: {
      key: {
        in: MANAGED_ROLE_KEYS,
      },
    },
  });

  const roleMap = new Map(roles.map((role) => [role.key, role]));
  return {
    adminRole: roleMap.get("tenant_admin") || null,
    agentRole: roleMap.get("agent") || null,
  };
}

userRouter.get("/me/roles", requireAuth, requireTenant, (req, res) => {
  return res.json({
    ok: true,
    userId: req.auth.user.id,
    tenantId: req.tenant.id,
    roles: req.auth.activeTenant?.roleKeys || [],
    permissions: req.auth.activeTenant?.permissions || [],
  });
});

userRouter.get("/team/assignable", requireAuth, requireTenant, requirePermission("conversation.write"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const members = await prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            tenantId: req.tenant.id,
            role: {
              key: {
                in: MANAGED_ROLE_KEYS,
              },
            },
          },
        },
      },
      include: {
        userRoles: {
          where: {
            tenantId: req.tenant.id,
            role: {
              key: {
                in: MANAGED_ROLE_KEYS,
              },
            },
          },
          include: {
            role: true,
          },
        },
        presenceSessions: {
          where: {
            tenantId: req.tenant.id,
          },
          orderBy: {
            lastSeenAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return res.json({
      ok: true,
      members: members.map((member) => serializeMember(member, new Map())),
    });
  } catch (error) {
    return next(error);
  }
});

userRouter.get("/team", requireAuth, requireTenant, requirePermission("user.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const [members, pendingInvitations, conversationCounts] = await Promise.all([
      prisma.user.findMany({
        where: {
          userRoles: {
            some: {
              tenantId: req.tenant.id,
              role: {
                key: {
                  in: MANAGED_ROLE_KEYS,
                },
              },
            },
          },
        },
        include: {
          userRoles: {
            where: {
              tenantId: req.tenant.id,
              role: {
                key: {
                  in: MANAGED_ROLE_KEYS,
                },
              },
            },
            include: {
              role: true,
            },
          },
          presenceSessions: {
            where: {
              tenantId: req.tenant.id,
            },
            orderBy: {
              lastSeenAt: "desc",
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      }),
      prisma.tenantInvitation.findMany({
        where: {
          tenantId: req.tenant.id,
          status: "PENDING",
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          role: true,
          invitedByUser: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.conversation.groupBy({
        by: ["assignedUserId"],
        where: {
          tenantId: req.tenant.id,
          status: "OPEN",
          assignedUserId: {
            not: null,
          },
        },
        _count: {
          assignedUserId: true,
        },
      }),
    ]);

    const conversationCountMap = new Map(
      conversationCounts
        .filter((entry) => entry.assignedUserId)
        .map((entry) => [entry.assignedUserId, entry._count.assignedUserId]),
    );

    return res.json({
      ok: true,
      members: members.map((member) => serializeMember(member, conversationCountMap)),
      invitations: pendingInvitations.map(serializeInvitation),
    });
  } catch (error) {
    return next(error);
  }
});

userRouter.post("/team/invitations", requireAuth, requireTenant, requirePermission("user.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const requestedRole = String(req.body?.role || "agent").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        ok: false,
        error: "Email is required",
      });
    }

    if (!["admin", "agent"].includes(requestedRole)) {
      return res.status(400).json({
        ok: false,
        error: "Role must be either admin or agent",
      });
    }

    const { adminRole, agentRole } = await resolveManagedRoles(prisma);
    const selectedRole = requestedRole === "admin" ? adminRole : agentRole;

    if (!selectedRole) {
      return res.status(500).json({
        ok: false,
        error: "Required tenant role is not configured",
      });
    }

    const existingMember = await prisma.userRole.findFirst({
      where: {
        tenantId: req.tenant.id,
        user: {
          email: {
            equals: email,
            mode: "insensitive",
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (existingMember) {
      return res.status(409).json({
        ok: false,
        error: "That email already belongs to a team member in this tenant",
      });
    }

    await prisma.tenantInvitation.updateMany({
      where: {
        tenantId: req.tenant.id,
        email: {
          equals: email,
          mode: "insensitive",
        },
        status: "PENDING",
      },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
      },
    });

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const invitation = await prisma.tenantInvitation.create({
      data: {
        tenantId: req.tenant.id,
        roleId: selectedRole.id,
        invitedByUserId: req.auth.user.id,
        email,
        token,
        expiresAt,
      },
      include: {
        role: true,
        invitedByUser: true,
      },
    });

    const inviteUrl = `${env.APP_BASE_URL.replace(/\/$/, "")}/login?invite=${token}&tenant=${req.tenant.slug}&email=${encodeURIComponent(email)}`;
    await sendTeamInviteEmail({
      email,
      tenantName: req.tenant.name,
      inviterName: req.auth.user.displayName || req.auth.user.email,
      inviteUrl,
      roleName: requestedRole === "admin" ? "Admin" : "Agent",
    });

    const updatedInvitation = await prisma.tenantInvitation.update({
      where: {
        id: invitation.id,
      },
      data: {
        sentAt: new Date(),
      },
      include: {
        role: true,
        invitedByUser: true,
      },
    });

    await Promise.all([
      writeAuditLog(req, {
        action: "team.invite_sent",
        entityType: "tenant_invitation",
        entityId: updatedInvitation.id,
        metadata: {
          email,
          role: requestedRole,
        },
      }),
      recordAnalyticsEvent(req, {
        eventName: "team.invite_sent",
        eventCategory: "team",
        metadata: {
          emailDomain: email.split("@")[1] || null,
          role: requestedRole,
        },
      }),
      dispatchTenantWebhookEvent({
        tenantId: req.tenant.id,
        tenantSlug: req.tenant.slug,
        tenantName: req.tenant.name,
        eventType: "team.invite_sent",
        payload: {
          invitationId: updatedInvitation.id,
          email,
          role: requestedRole,
        },
        requestId: req.context?.requestId,
      }),
    ]);

    return res.status(201).json({
      ok: true,
      invitation: serializeInvitation(updatedInvitation),
    });
  } catch (error) {
    return next(error);
  }
});

userRouter.patch("/team/members/:userId/role", requireAuth, requireTenant, requirePermission("user.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const requestedRole = String(req.body?.role || "").trim().toLowerCase();

    if (!["admin", "agent"].includes(requestedRole)) {
      return res.status(400).json({
        ok: false,
        error: "Role must be either admin or agent",
      });
    }

    const { adminRole, agentRole } = await resolveManagedRoles(prisma);
    const selectedRole = requestedRole === "admin" ? adminRole : agentRole;

    if (!selectedRole || !adminRole || !agentRole) {
      return res.status(500).json({
        ok: false,
        error: "Required tenant roles are not configured",
      });
    }

    const existingMember = await prisma.user.findFirst({
      where: {
        id: req.params.userId,
        userRoles: {
          some: {
            tenantId: req.tenant.id,
            roleId: {
              in: [adminRole.id, agentRole.id],
            },
          },
        },
      },
      include: {
        userRoles: {
          where: {
            tenantId: req.tenant.id,
            roleId: {
              in: [adminRole.id, agentRole.id],
            },
          },
          include: {
            role: true,
          },
        },
        presenceSessions: {
          where: {
            tenantId: req.tenant.id,
          },
          orderBy: {
            lastSeenAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!existingMember) {
      return res.status(404).json({
        ok: false,
        error: "Team member not found",
      });
    }

    await prisma.$transaction([
      prisma.userRole.deleteMany({
        where: {
          tenantId: req.tenant.id,
          userId: existingMember.id,
          roleId: {
            in: [adminRole.id, agentRole.id],
          },
        },
      }),
      prisma.userRole.create({
        data: {
          tenantId: req.tenant.id,
          userId: existingMember.id,
          roleId: selectedRole.id,
        },
      }),
    ]);

    const updatedMember = await prisma.user.findUnique({
      where: {
        id: existingMember.id,
      },
      include: {
        userRoles: {
          where: {
            tenantId: req.tenant.id,
            roleId: {
              in: [adminRole.id, agentRole.id],
            },
          },
          include: {
            role: true,
          },
        },
        presenceSessions: {
          where: {
            tenantId: req.tenant.id,
          },
          orderBy: {
            lastSeenAt: "desc",
          },
          take: 1,
        },
      },
    });

    const openConversationCount = await prisma.conversation.count({
      where: {
        tenantId: req.tenant.id,
        status: "OPEN",
        assignedUserId: existingMember.id,
      },
    });

    await Promise.all([
      writeAuditLog(req, {
        action: "team.role_updated",
        entityType: "user",
        entityId: existingMember.id,
        metadata: {
          role: requestedRole,
        },
      }),
      recordAnalyticsEvent(req, {
        eventName: "team.role_updated",
        eventCategory: "team",
        metadata: {
          role: requestedRole,
          targetUserId: existingMember.id,
        },
      }),
    ]);

    return res.json({
      ok: true,
      member: serializeMember(updatedMember, new Map([[existingMember.id, openConversationCount]])),
    });
  } catch (error) {
    return next(error);
  }
});

userRouter.delete("/team/members/:userId", requireAuth, requireTenant, requirePermission("user.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const { adminRole, agentRole } = await resolveManagedRoles(prisma);

    if (!adminRole || !agentRole) {
      return res.status(500).json({
        ok: false,
        error: "Required tenant roles are not configured",
      });
    }

    const managedRoleIds = [adminRole.id, agentRole.id];

    const existingMember = await prisma.user.findFirst({
      where: {
        id: req.params.userId,
        userRoles: {
          some: {
            tenantId: req.tenant.id,
            roleId: {
              in: managedRoleIds,
            },
          },
        },
      },
      include: {
        userRoles: {
          where: {
            tenantId: req.tenant.id,
            roleId: {
              in: managedRoleIds,
            },
          },
          include: {
            role: true,
          },
        },
      },
    });

    if (!existingMember) {
      return res.status(404).json({
        ok: false,
        error: "Team member not found",
      });
    }

    const adminAssignments = await prisma.userRole.count({
      where: {
        tenantId: req.tenant.id,
        roleId: adminRole.id,
      },
    });
    const isAdminMember = existingMember.userRoles.some((userRole) => userRole.role.key === "tenant_admin");

    if (isAdminMember && adminAssignments <= 1) {
      return res.status(400).json({
        ok: false,
        error: "At least one tenant admin must remain in the tenant",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({
        where: {
          tenantId: req.tenant.id,
          userId: existingMember.id,
          roleId: {
            in: managedRoleIds,
          },
        },
      });

      const nextFallback = await tx.userRole.findFirst({
        where: {
          tenantId: req.tenant.id,
          roleId: {
            in: managedRoleIds,
          },
          userId: {
            not: existingMember.id,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
        select: {
          userId: true,
        },
      });

      await tx.tenantRoutingSettings.updateMany({
        where: {
          tenantId: req.tenant.id,
          fallbackUserId: existingMember.id,
        },
        data: {
          fallbackUserId: nextFallback?.userId || null,
        },
      });
    });

    await Promise.all([
      writeAuditLog(req, {
        action: "team.member_revoked",
        entityType: "user",
        entityId: existingMember.id,
        metadata: {
          email: existingMember.email,
          revokedByUserId: req.auth.user.id,
        },
      }),
      recordAnalyticsEvent(req, {
        eventName: "team.member_revoked",
        eventCategory: "team",
        metadata: {
          targetUserId: existingMember.id,
        },
      }),
    ]);

    return res.json({
      ok: true,
      removedUserId: existingMember.id,
    });
  } catch (error) {
    return next(error);
  }
});
