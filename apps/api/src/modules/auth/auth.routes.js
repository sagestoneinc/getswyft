import { Router } from "express";
import { recordAnalyticsEvent } from "../../lib/analytics.js";
import { writeAuditLog } from "../../lib/audit.js";
import { getPrismaClient } from "../../lib/db.js";
import { dispatchTenantWebhookEvent } from "../../lib/webhooks.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireTenant } from "../../middleware/tenant.js";

export const authRouter = Router();

function serializeProfile(user, profile) {
  return {
    id: user.id,
    externalAuthId: user.externalAuthId,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    phone: profile?.phone || null,
    timezone: profile?.timezone || null,
    locale: profile?.locale || null,
    metadata: profile?.metadata || {},
  };
}

function serializeInvitation(invitation) {
  return {
    id: invitation.id,
    email: invitation.email,
    status: invitation.status.toLowerCase(),
    role: invitation.role.key === "tenant_admin" ? "admin" : "agent",
    roleKey: invitation.role.key,
    expiresAt: invitation.expiresAt,
    sentAt: invitation.sentAt,
    acceptedAt: invitation.acceptedAt,
    revokedAt: invitation.revokedAt,
    invitedBy: invitation.invitedByUser.displayName || invitation.invitedByUser.email,
    tenant: {
      id: invitation.tenant.id,
      slug: invitation.tenant.slug,
      name: invitation.tenant.name,
    },
  };
}

async function expireInvitationIfNeeded(prisma, invitation) {
  if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt > new Date()) {
    return invitation;
  }

  return prisma.tenantInvitation.update({
    where: {
      id: invitation.id,
    },
    data: {
      status: "EXPIRED",
    },
    include: {
      role: true,
      tenant: true,
      invitedByUser: true,
      acceptedUser: true,
    },
  });
}

authRouter.get("/invitations/:token", async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const token = String(req.params.token || "").trim();

    if (!token) {
      return res.status(400).json({
        ok: false,
        error: "Invitation token is required",
      });
    }

    const invitation = await prisma.tenantInvitation.findUnique({
      where: {
        token,
      },
      include: {
        role: true,
        tenant: true,
        invitedByUser: true,
        acceptedUser: true,
      },
    });

    if (!invitation) {
      return res.status(404).json({
        ok: false,
        error: "Invitation not found",
      });
    }

    const freshInvitation = await expireInvitationIfNeeded(prisma, invitation);

    return res.json({
      ok: true,
      invitation: serializeInvitation(freshInvitation),
      canAccept:
        freshInvitation.status === "PENDING" &&
        (!req.auth?.isAuthenticated ||
          String(req.auth.user.email || "").trim().toLowerCase() === String(freshInvitation.email).trim().toLowerCase()),
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.get("/me", requireAuth, requireTenant, (req, res) => {
  res.json({
    ok: true,
    user: {
      id: req.auth.user.id,
      externalAuthId: req.auth.user.externalAuthId,
      email: req.auth.user.email,
      displayName: req.auth.user.displayName,
    },
    tenant: {
      id: req.tenant.id,
      slug: req.tenant.slug,
      name: req.tenant.name,
    },
    roles: req.auth.activeTenant?.roleKeys || [],
    permissions: req.auth.activeTenant?.permissions || [],
  });
});

authRouter.get("/memberships", requireAuth, (req, res) => {
  return res.json({
    ok: true,
    activeTenant: req.auth.activeTenant
      ? {
          tenantId: req.auth.activeTenant.tenantId,
          tenantSlug: req.auth.activeTenant.tenantSlug,
          tenantName: req.auth.activeTenant.tenantName,
          roleKeys: req.auth.activeTenant.roleKeys,
          permissions: req.auth.activeTenant.permissions,
        }
      : null,
    memberships: (req.auth.memberships || []).map((membership) => ({
      tenantId: membership.tenantId,
      tenantSlug: membership.tenantSlug,
      tenantName: membership.tenantName,
      roleKeys: membership.roleKeys,
      permissions: membership.permissions,
    })),
  });
});

authRouter.post("/invitations/accept", requireAuth, async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const token = String(req.body?.token || "").trim();

    if (!token) {
      return res.status(400).json({
        ok: false,
        error: "Invitation token is required",
      });
    }

    const invitation = await prisma.tenantInvitation.findUnique({
      where: {
        token,
      },
      include: {
        role: true,
        tenant: true,
        invitedByUser: true,
        acceptedUser: true,
      },
    });

    if (!invitation) {
      return res.status(404).json({
        ok: false,
        error: "Invitation not found",
      });
    }

    const freshInvitation = await expireInvitationIfNeeded(prisma, invitation);

    if (freshInvitation.status === "EXPIRED") {
      return res.status(410).json({
        ok: false,
        error: "Invitation has expired",
      });
    }

    if (freshInvitation.status === "REVOKED") {
      return res.status(409).json({
        ok: false,
        error: "Invitation has been revoked",
      });
    }

    if (freshInvitation.status === "ACCEPTED") {
      if (freshInvitation.acceptedUserId === req.auth.user.id) {
        return res.json({
          ok: true,
          invitation: serializeInvitation(freshInvitation),
          tenant: {
            id: freshInvitation.tenant.id,
            slug: freshInvitation.tenant.slug,
            name: freshInvitation.tenant.name,
          },
        });
      }

      return res.status(409).json({
        ok: false,
        error: "Invitation has already been accepted",
      });
    }

    if (String(req.auth.user.email || "").trim().toLowerCase() !== String(freshInvitation.email).trim().toLowerCase()) {
      return res.status(403).json({
        ok: false,
        error: "Invitation email does not match the authenticated user",
      });
    }

    const acceptedAt = new Date();
    await prisma.$transaction([
      prisma.userRole.upsert({
        where: {
          tenantId_userId_roleId: {
            tenantId: freshInvitation.tenantId,
            userId: req.auth.user.id,
            roleId: freshInvitation.roleId,
          },
        },
        update: {},
        create: {
          tenantId: freshInvitation.tenantId,
          userId: req.auth.user.id,
          roleId: freshInvitation.roleId,
        },
      }),
      prisma.tenantInvitation.update({
        where: {
          id: freshInvitation.id,
        },
        data: {
          status: "ACCEPTED",
          acceptedAt,
          acceptedUserId: req.auth.user.id,
        },
      }),
    ]);

    const acceptedInvitation = await prisma.tenantInvitation.findUnique({
      where: {
        id: freshInvitation.id,
      },
      include: {
        role: true,
        tenant: true,
        invitedByUser: true,
        acceptedUser: true,
      },
    });

    req.tenant = acceptedInvitation.tenant;

    await Promise.all([
      writeAuditLog(req, {
        action: "team.invite_accepted",
        entityType: "tenant_invitation",
        entityId: acceptedInvitation.id,
        metadata: {
          email: acceptedInvitation.email,
          role: acceptedInvitation.role.key,
        },
      }),
      recordAnalyticsEvent(req, {
        eventName: "team.invite_accepted",
        eventCategory: "team",
        metadata: {
          tenantSlug: acceptedInvitation.tenant.slug,
          role: acceptedInvitation.role.key,
        },
      }),
      dispatchTenantWebhookEvent({
        tenantId: acceptedInvitation.tenant.id,
        tenantSlug: acceptedInvitation.tenant.slug,
        tenantName: acceptedInvitation.tenant.name,
        eventType: "team.invite_accepted",
        payload: {
          invitationId: acceptedInvitation.id,
          email: acceptedInvitation.email,
          acceptedUserId: req.auth.user.id,
          role: acceptedInvitation.role.key === "tenant_admin" ? "admin" : "agent",
        },
        requestId: req.context?.requestId,
      }),
    ]);

    return res.status(201).json({
      ok: true,
      invitation: serializeInvitation(acceptedInvitation),
      tenant: {
        id: acceptedInvitation.tenant.id,
        slug: acceptedInvitation.tenant.slug,
        name: acceptedInvitation.tenant.name,
      },
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.get("/profile", requireAuth, async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const profile = await prisma.profile.findUnique({
      where: {
        userId: req.auth.user.id,
      },
    });

    return res.json({
      ok: true,
      profile: serializeProfile(req.auth.user, profile),
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.patch("/profile", requireAuth, async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const displayName = typeof req.body?.displayName === "string" ? req.body.displayName.trim() : "";
    const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() : "";
    const timezone = typeof req.body?.timezone === "string" ? req.body.timezone.trim() : "";
    const locale = typeof req.body?.locale === "string" ? req.body.locale.trim() : "";
    const avatarUrl = typeof req.body?.avatarUrl === "string" ? req.body.avatarUrl.trim() : "";
    const metadata =
      req.body?.metadata && typeof req.body.metadata === "object" && !Array.isArray(req.body.metadata)
        ? req.body.metadata
        : null;

    const existingProfile = await prisma.profile.findUnique({
      where: {
        userId: req.auth.user.id,
      },
    });

    const nextDisplayName = displayName || req.auth.user.displayName || req.auth.user.email;
    const mergedMetadata =
      metadata === null
        ? existingProfile?.metadata || {}
        : {
            ...(existingProfile?.metadata && typeof existingProfile.metadata === "object" ? existingProfile.metadata : {}),
            ...metadata,
          };

    const [user, profile] = await prisma.$transaction([
      prisma.user.update({
        where: {
          id: req.auth.user.id,
        },
        data: {
          displayName: nextDisplayName,
          avatarUrl: avatarUrl || null,
        },
      }),
      prisma.profile.upsert({
        where: {
          userId: req.auth.user.id,
        },
        update: {
          phone: phone || null,
          timezone: timezone || null,
          locale: locale || null,
          metadata: mergedMetadata,
        },
        create: {
          userId: req.auth.user.id,
          phone: phone || null,
          timezone: timezone || null,
          locale: locale || null,
          metadata: mergedMetadata,
        },
      }),
    ]);

    return res.json({
      ok: true,
      profile: serializeProfile(user, profile),
    });
  } catch (error) {
    return next(error);
  }
});
