import { Router } from "express";
import { getPrismaClient } from "../../lib/db.js";
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
