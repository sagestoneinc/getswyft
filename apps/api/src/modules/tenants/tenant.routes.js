import crypto from "node:crypto";
import { Router } from "express";
import { getPrismaClient } from "../../lib/db.js";
import { recordAnalyticsEvent } from "../../lib/analytics.js";
import { writeAuditLog } from "../../lib/audit.js";
import {
  generateTenantApiKeyValue,
  maskApiKeyPrefix,
  normalizeApiKeyPermissions,
} from "../../lib/api-keys.js";
import {
  SUPPORTED_WEBHOOK_EVENT_TYPES,
  dispatchTenantWebhookEvent,
  sanitizeWebhookEventTypes,
} from "../../lib/webhooks.js";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/rbac.js";
import { requireTenant } from "../../middleware/tenant.js";

export const tenantRouter = Router();

const MANAGED_ROLE_KEYS = ["tenant_admin", "agent"];
const ROUTING_MODE_VALUES = ["manual", "first_available", "round_robin"];
const TIME_PATTERN = /^\d{2}:\d{2}$/;
const TENANT_SLUG_MAX_LENGTH = 48;
const HEX_COLOR_PATTERN = /^#?[0-9a-fA-F]{6}$/;
const BASIC_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOMAIN_PATTERN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

// ─── SIP trunk password encryption helpers ──────────────────────────────────
const SIP_ENCRYPTION_ALGORITHM = "aes-256-gcm";

function getSipEncryptionKey() {
  const secret = process.env.SIP_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      "SIP_ENCRYPTION_KEY environment variable is required for SIP trunk password encryption"
    );
  }
  return crypto.createHash("sha256").update(secret).digest();
}

function encryptSipPassword(plaintext) {
  if (!plaintext) return null;
  const key = getSipEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(SIP_ENCRYPTION_ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${tag}:${encrypted}`;
}
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_FEATURE_FLAGS = [
  {
    key: "phase1_foundations",
    enabled: true,
    config: {
      notes: "Automatically enabled for newly created tenants",
    },
  },
];

function toPrimaryRole(roleKeys) {
  return roleKeys.includes("tenant_admin") ? "admin" : "agent";
}

function serializeTenantBase(tenant, branding, featureFlags) {
  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    status: tenant.status,
    branding: serializeBranding(branding),
    featureFlags: featureFlags.map(serializeFeatureFlag),
  };
}

function serializeBranding(branding) {
  if (!branding) {
    return null;
  }

  return {
    id: branding.id,
    tenantId: branding.tenantId,
    primaryColor: branding.primaryColor,
    logoUrl: branding.logoUrl,
    supportEmail: branding.supportEmail,
    createdAt: branding.createdAt,
    updatedAt: branding.updatedAt,
  };
}

function serializeFeatureFlag(flag) {
  return {
    key: flag.key,
    enabled: flag.enabled,
    config: flag.config,
    createdAt: flag.createdAt,
    updatedAt: flag.updatedAt,
  };
}

function serializeTenantDomain(domain) {
  return {
    id: domain.id,
    domain: domain.domain,
    isPrimary: domain.isPrimary,
    createdAt: domain.createdAt,
  };
}

function serializeTenantApiKey(apiKey) {
  return {
    id: apiKey.id,
    name: apiKey.name,
    keyPrefix: apiKey.keyPrefix,
    keyHint: maskApiKeyPrefix(apiKey.keyPrefix),
    permissions: apiKey.permissions,
    isActive: !apiKey.disabledAt,
    lastUsedAt: apiKey.lastUsedAt,
    lastUsedIp: apiKey.lastUsedIp,
    disabledAt: apiKey.disabledAt,
    createdAt: apiKey.createdAt,
    updatedAt: apiKey.updatedAt,
    createdBy: apiKey.createdByUser
      ? {
          id: apiKey.createdByUser.id,
          email: apiKey.createdByUser.email,
          displayName: apiKey.createdByUser.displayName || null,
        }
      : null,
  };
}

function serializeRoutingSettings(settings, fallbackCandidates) {
  const fallbackCandidate = fallbackCandidates.find((candidate) => candidate.id === settings.fallbackUserId) || null;

  return {
    routingMode: settings.routingMode.toLowerCase(),
    officeHoursEnabled: settings.officeHoursEnabled,
    timezone: settings.timezone,
    officeHoursStart: settings.officeHoursStart,
    officeHoursEnd: settings.officeHoursEnd,
    afterHoursMessage:
      settings.afterHoursMessage ||
      "Thanks for reaching out. We are currently offline, but your message will be routed to the right agent as soon as office hours resume.",
    fallbackUserId: settings.fallbackUserId,
    fallbackUserName: fallbackCandidate?.name || null,
  };
}

function serializeWebhookEndpoint(endpoint) {
  return {
    id: endpoint.id,
    url: endpoint.url,
    description: endpoint.description,
    status: endpoint.status.toLowerCase(),
    eventTypes: endpoint.eventTypes,
    hasSigningSecret: Boolean(endpoint.signingSecret),
    createdAt: endpoint.createdAt,
    updatedAt: endpoint.updatedAt,
    lastDeliveredAt: endpoint.lastDeliveredAt,
    lastErrorAt: endpoint.lastErrorAt,
  };
}

function serializeWebhookDelivery(delivery) {
  return {
    id: delivery.id,
    endpointId: delivery.endpointId,
    endpointUrl: delivery.endpoint.url,
    eventType: delivery.eventType,
    status: delivery.status.toLowerCase(),
    statusCode: delivery.statusCode,
    requestId: delivery.requestId,
    responseBody: delivery.responseBody,
    durationMs: delivery.durationMs,
    attemptedAt: delivery.attemptedAt,
  };
}

function serializeBilling(subscription, invoices, activeSeats) {
  const effectiveSeats = activeSeats || subscription?.activeSeats || 0;
  const subscriptionValue = subscription
    ? {
        provider: subscription.provider,
        paddleCustomerId: subscription.paddleCustomerId || null,
        paddleSubscriptionId: subscription.paddleSubscriptionId || null,
        braintreeCustomerId: subscription.braintreeCustomerId || null,
        braintreeSubscriptionId: subscription.braintreeSubscriptionId || null,
        planKey: subscription.planKey,
        planName: subscription.planName,
        interval: subscription.interval.toLowerCase(),
        status: subscription.status.toLowerCase(),
        seatPriceCents: subscription.seatPriceCents,
        currency: subscription.currency,
        activeSeats: effectiveSeats,
        monthlySubtotalCents: effectiveSeats * subscription.seatPriceCents,
        nextBillingAt: subscription.nextBillingAt,
      }
    : null;

  return {
    subscription: subscriptionValue,
    invoices: invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status.toLowerCase(),
      amountCents: invoice.amountCents,
      currency: invoice.currency,
      issuedAt: invoice.issuedAt,
      periodStart: invoice.periodStart,
      periodEnd: invoice.periodEnd,
      paidAt: invoice.paidAt,
      hostedUrl: invoice.hostedUrl,
    })),
  };
}

async function loadFallbackCandidates(prisma, tenantId) {
  const members = await prisma.user.findMany({
    where: {
      userRoles: {
        some: {
          tenantId,
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
          tenantId,
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
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return members.map((member) => {
    const roleKeys = Array.from(new Set(member.userRoles.map((userRole) => userRole.role.key)));

    return {
      id: member.id,
      name: member.displayName || member.email,
      email: member.email,
      role: toPrimaryRole(roleKeys),
      roleKeys,
    };
  });
}

async function ensureRoutingSettings(prisma, tenantId, fallbackCandidates) {
  return prisma.tenantRoutingSettings.upsert({
    where: {
      tenantId,
    },
    update: fallbackCandidates.length
      ? {}
      : {
          fallbackUserId: null,
        },
    create: {
      tenantId,
      fallbackUserId: fallbackCandidates[0]?.id || null,
    },
  });
}

function normalizeRoutingMode(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ROUTING_MODE_VALUES.includes(normalized) ? normalized : null;
}

function assertValidWebhookUrl(url) {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch (_error) {
    return false;
  }
}

function assertValidHttpUrl(url) {
  return assertValidWebhookUrl(url);
}

function assertValidEmail(value) {
  return BASIC_EMAIL_PATTERN.test(String(value || "").trim());
}

function normalizeHexColor(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return null;
  }

  if (!HEX_COLOR_PATTERN.test(trimmed)) {
    return null;
  }

  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

function normalizeDomainValue(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");

  return normalized;
}

function assertValidDomain(domain) {
  return DOMAIN_PATTERN.test(normalizeDomainValue(domain));
}

async function expireTenantInvitations(prisma, tenantId) {
  await prisma.tenantInvitation.updateMany({
    where: {
      tenantId,
      status: "PENDING",
      expiresAt: {
        lte: new Date(),
      },
    },
    data: {
      status: "EXPIRED",
    },
  });
}

async function resolvePermissionKeys(prisma, permissions, { required = false } = {}) {
  const normalized = normalizeApiKeyPermissions(permissions);
  if (!normalized.length) {
    return required ? null : [];
  }

  const rows = await prisma.permission.findMany({
    where: {
      key: {
        in: normalized,
      },
    },
    select: {
      key: true,
    },
  });

  const resolved = rows.map((row) => row.key);
  if (resolved.length !== normalized.length) {
    return null;
  }

  return normalized;
}

function normalizeTenantSlug(value) {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) {
    return "";
  }

  return slug.slice(0, TENANT_SLUG_MAX_LENGTH).replace(/-+$/g, "");
}

function candidateTenantSlug({ requestedSlug, tenantName }) {
  return normalizeTenantSlug(requestedSlug || tenantName);
}

async function allocateTenantSlug(prisma, baseSlug) {
  const normalizedBase = normalizeTenantSlug(baseSlug);
  if (!normalizedBase) {
    return "";
  }

  let slug = normalizedBase;
  let attempt = 1;

  while (true) {
    const existing = await prisma.tenant.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return slug;
    }

    const suffix = String(attempt).padStart(2, "0");
    const maxPrefixLength = Math.max(1, TENANT_SLUG_MAX_LENGTH - (suffix.length + 1));
    slug = `${normalizedBase.slice(0, maxPrefixLength)}-${suffix}`;
    attempt += 1;

    if (attempt > 9999) {
      throw new Error("Unable to allocate a unique tenant slug");
    }
  }
}

tenantRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const tenantName = String(req.body?.name || "").trim();
    const requestedSlug = String(req.body?.slug || "").trim();
    const requestedSupportEmail = String(req.body?.supportEmail || "").trim().toLowerCase();
    const requestedPrimaryColor = String(req.body?.primaryColor || "").trim();

    if (!tenantName) {
      return res.status(400).json({
        ok: false,
        error: "Tenant name is required",
      });
    }

    const slugCandidate = candidateTenantSlug({
      requestedSlug,
      tenantName,
    });
    if (!slugCandidate) {
      return res.status(400).json({
        ok: false,
        error: "A valid tenant slug could not be generated from the provided name",
      });
    }

    const tenantSlug = await allocateTenantSlug(prisma, slugCandidate);
    const adminRole = await prisma.role.findUnique({
      where: {
        key: "tenant_admin",
      },
    });

    if (!adminRole) {
      return res.status(500).json({
        ok: false,
        error: "System role tenant_admin is not configured",
      });
    }

    const primaryColor = requestedPrimaryColor ? normalizeHexColor(requestedPrimaryColor) : "#14b8a6";
    if (!primaryColor) {
      return res.status(400).json({
        ok: false,
        error: "primaryColor must be a valid 6-digit hex value",
      });
    }

    const supportEmail = requestedSupportEmail || req.auth.user.email;
    if (supportEmail && !assertValidEmail(supportEmail)) {
      return res.status(400).json({
        ok: false,
        error: "supportEmail must be a valid email address",
      });
    }

    const created = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          slug: tenantSlug,
          name: tenantName,
          status: "ACTIVE",
        },
      });

      await tx.tenantBranding.create({
        data: {
          tenantId: tenant.id,
          primaryColor,
          supportEmail,
        },
      });

      await tx.tenantFeatureFlag.createMany({
        data: DEFAULT_FEATURE_FLAGS.map((featureFlag) => ({
          tenantId: tenant.id,
          key: featureFlag.key,
          enabled: featureFlag.enabled,
          config: featureFlag.config,
        })),
        skipDuplicates: true,
      });

      await tx.userRole.create({
        data: {
          tenantId: tenant.id,
          userId: req.auth.user.id,
          roleId: adminRole.id,
        },
      });

      await tx.tenantRoutingSettings.create({
        data: {
          tenantId: tenant.id,
          fallbackUserId: req.auth.user.id,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId: tenant.id,
          actorUserId: req.auth.user.id,
          action: "tenant.created",
          entityType: "tenant",
          entityId: tenant.id,
          metadata: {
            slug: tenantSlug,
            name: tenantName,
          },
          ipAddress: req.ip || null,
          userAgent: req.header("user-agent") || null,
        },
      });

      await tx.analyticsEvent.create({
        data: {
          tenantId: tenant.id,
          userId: req.auth.user.id,
          eventName: "tenant.created",
          eventCategory: "tenant",
          metadata: {
            slug: tenantSlug,
          },
        },
      });

      const [branding, featureFlags] = await Promise.all([
        tx.tenantBranding.findUnique({
          where: {
            tenantId: tenant.id,
          },
        }),
        tx.tenantFeatureFlag.findMany({
          where: {
            tenantId: tenant.id,
          },
          orderBy: {
            key: "asc",
          },
        }),
      ]);

      return {
        tenant,
        branding,
        featureFlags,
      };
    });

    return res.status(201).json({
      ok: true,
      tenant: serializeTenantBase(created.tenant, created.branding, created.featureFlags),
    });
  } catch (error) {
    return next(error);
  }
});

tenantRouter.delete("/:tenantSlug", requireAuth, async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const tenantSlug = String(req.params?.tenantSlug || "").trim();

    if (!tenantSlug) {
      return res.status(400).json({
        ok: false,
        error: "tenantSlug is required",
      });
    }

    const memberships = req.auth.memberships || [];
    const targetMembership = memberships.find((membership) => membership.tenantSlug === tenantSlug);
    if (!targetMembership) {
      return res.status(403).json({
        ok: false,
        error: "You are not assigned to this tenant",
      });
    }

    if (!targetMembership.permissions?.includes("tenant.manage")) {
      return res.status(403).json({
        ok: false,
        error: "tenant.manage permission is required to delete this tenant",
      });
    }

    const remainingMemberships = memberships.filter((membership) => membership.tenantSlug !== tenantSlug);
    if (!remainingMemberships.length) {
      return res.status(400).json({
        ok: false,
        error: "Create or join another tenant before deleting your only workspace",
      });
    }

    const tenant = await prisma.tenant.findUnique({
      where: {
        slug: tenantSlug,
      },
      select: {
        id: true,
        slug: true,
        name: true,
      },
    });

    if (!tenant) {
      return res.status(404).json({
        ok: false,
        error: "Tenant not found",
      });
    }

    const directRoleAssignments = await prisma.userRole.count({
      where: {
        tenantId: tenant.id,
        userId: req.auth.user.id,
      },
    });

    if (!directRoleAssignments) {
      return res.status(403).json({
        ok: false,
        error: "No active role assignment found for this tenant",
      });
    }

    await prisma.tenant.delete({
      where: {
        id: tenant.id,
      },
    });

    const preferredNextMembership =
      remainingMemberships.find((membership) => membership.permissions?.includes("tenant.manage")) ||
      remainingMemberships[0] ||
      null;

    return res.json({
      ok: true,
      tenant,
      deletedByUserId: req.auth.user.id,
      nextActiveTenantSlug: preferredNextMembership?.tenantSlug || null,
    });
  } catch (error) {
    return next(error);
  }
});

tenantRouter.get("/current", requireAuth, requireTenant, async (req, res, next) => {
  try {
    const prisma = getPrismaClient();

    const [branding, featureFlags] = await Promise.all([
      prisma.tenantBranding.findUnique({ where: { tenantId: req.tenant.id } }),
      prisma.tenantFeatureFlag.findMany({
        where: { tenantId: req.tenant.id },
        orderBy: { key: "asc" },
      }),
    ]);

    return res.json({
      ok: true,
      tenant: serializeTenantBase(req.tenant, branding, featureFlags),
    });
  } catch (error) {
    return next(error);
  }
});

tenantRouter.get("/current/settings", requireAuth, requireTenant, requirePermission("tenant.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const [branding, featureFlags, fallbackCandidates] = await Promise.all([
      prisma.tenantBranding.findUnique({ where: { tenantId: req.tenant.id } }),
      prisma.tenantFeatureFlag.findMany({
        where: { tenantId: req.tenant.id },
        orderBy: { key: "asc" },
      }),
      loadFallbackCandidates(prisma, req.tenant.id),
    ]);
    const settings = await ensureRoutingSettings(prisma, req.tenant.id, fallbackCandidates);

    return res.json({
      ok: true,
      tenant: serializeTenantBase(req.tenant, branding, featureFlags),
      settings: serializeRoutingSettings(settings, fallbackCandidates),
      fallbackCandidates,
    });
  } catch (error) {
    return next(error);
  }
});

tenantRouter.patch("/current/settings", requireAuth, requireTenant, requirePermission("tenant.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const fallbackCandidates = await loadFallbackCandidates(prisma, req.tenant.id);
    const data = {};

    if (req.body?.routingMode !== undefined) {
      const routingMode = normalizeRoutingMode(req.body.routingMode);
      if (!routingMode) {
        return res.status(400).json({
          ok: false,
          error: "routingMode must be one of manual, first_available, or round_robin",
        });
      }

      data.routingMode = routingMode.toUpperCase();
    }

    if (req.body?.officeHoursEnabled !== undefined) {
      data.officeHoursEnabled = Boolean(req.body.officeHoursEnabled);
    }

    if (req.body?.timezone !== undefined) {
      const timezone = String(req.body.timezone || "").trim();
      if (!timezone) {
        return res.status(400).json({
          ok: false,
          error: "timezone is required",
        });
      }

      data.timezone = timezone;
    }

    if (req.body?.officeHoursStart !== undefined) {
      const officeHoursStart = String(req.body.officeHoursStart || "").trim();
      if (!TIME_PATTERN.test(officeHoursStart)) {
        return res.status(400).json({
          ok: false,
          error: "officeHoursStart must use HH:MM format",
        });
      }

      data.officeHoursStart = officeHoursStart;
    }

    if (req.body?.officeHoursEnd !== undefined) {
      const officeHoursEnd = String(req.body.officeHoursEnd || "").trim();
      if (!TIME_PATTERN.test(officeHoursEnd)) {
        return res.status(400).json({
          ok: false,
          error: "officeHoursEnd must use HH:MM format",
        });
      }

      data.officeHoursEnd = officeHoursEnd;
    }

    if (req.body?.afterHoursMessage !== undefined) {
      const afterHoursMessage = String(req.body.afterHoursMessage || "").trim();
      data.afterHoursMessage = afterHoursMessage || null;
    }

    if (req.body?.fallbackUserId !== undefined) {
      const fallbackUserId = req.body.fallbackUserId ? String(req.body.fallbackUserId) : null;
      if (fallbackUserId && !fallbackCandidates.some((candidate) => candidate.id === fallbackUserId)) {
        return res.status(400).json({
          ok: false,
          error: "fallbackUserId must belong to a team member in this tenant",
        });
      }

      data.fallbackUserId = fallbackUserId;
    }

    if (!Object.keys(data).length) {
      return res.status(400).json({
        ok: false,
        error: "No supported tenant settings were provided",
      });
    }

    const settings = await prisma.tenantRoutingSettings.upsert({
      where: {
        tenantId: req.tenant.id,
      },
      update: data,
      create: {
        tenantId: req.tenant.id,
        fallbackUserId: fallbackCandidates[0]?.id || null,
        ...data,
      },
    });

    await Promise.all([
      writeAuditLog(req, {
        action: "tenant.settings_updated",
        entityType: "tenant",
        entityId: req.tenant.id,
        metadata: data,
      }),
      recordAnalyticsEvent(req, {
        eventName: "tenant.settings_updated",
        eventCategory: "tenant",
        metadata: {
          keys: Object.keys(data),
        },
      }),
    ]);

    return res.json({
      ok: true,
      settings: serializeRoutingSettings(settings, fallbackCandidates),
      fallbackCandidates,
    });
  } catch (error) {
    return next(error);
  }
});

tenantRouter.get("/current/branding", requireAuth, requireTenant, requirePermission("tenant.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const branding = await prisma.tenantBranding.findUnique({
      where: {
        tenantId: req.tenant.id,
      },
    });

    return res.json({
      ok: true,
      branding: serializeBranding(branding),
    });
  } catch (error) {
    return next(error);
  }
});

tenantRouter.patch("/current/branding", requireAuth, requireTenant, requirePermission("tenant.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const data = {};

    if (req.body?.primaryColor !== undefined) {
      if (!req.body.primaryColor) {
        data.primaryColor = null;
      } else {
        const primaryColor = normalizeHexColor(req.body.primaryColor);
        if (!primaryColor) {
          return res.status(400).json({
            ok: false,
            error: "primaryColor must be a valid 6-digit hex value",
          });
        }

        data.primaryColor = primaryColor;
      }
    }

    if (req.body?.logoUrl !== undefined) {
      const logoUrl = String(req.body.logoUrl || "").trim();
      if (logoUrl && !assertValidHttpUrl(logoUrl)) {
        return res.status(400).json({
          ok: false,
          error: "logoUrl must be a valid http or https URL",
        });
      }

      data.logoUrl = logoUrl || null;
    }

    if (req.body?.supportEmail !== undefined) {
      const supportEmail = String(req.body.supportEmail || "").trim().toLowerCase();
      if (supportEmail && !assertValidEmail(supportEmail)) {
        return res.status(400).json({
          ok: false,
          error: "supportEmail must be a valid email address",
        });
      }

      data.supportEmail = supportEmail || null;
    }

    if (!Object.keys(data).length) {
      return res.status(400).json({
        ok: false,
        error: "No supported branding changes were provided",
      });
    }

    const branding = await prisma.tenantBranding.upsert({
      where: {
        tenantId: req.tenant.id,
      },
      update: data,
      create: {
        tenantId: req.tenant.id,
        ...data,
      },
    });

    await Promise.all([
      writeAuditLog(req, {
        action: "tenant.branding_updated",
        entityType: "tenant_branding",
        entityId: branding.id,
        metadata: {
          keys: Object.keys(data),
        },
      }),
      recordAnalyticsEvent(req, {
        eventName: "tenant.branding_updated",
        eventCategory: "tenant",
        metadata: {
          keys: Object.keys(data),
        },
      }),
    ]);

    return res.json({
      ok: true,
      branding: serializeBranding(branding),
    });
  } catch (error) {
    return next(error);
  }
});

tenantRouter.get("/current/feature-flags", requireAuth, requireTenant, requirePermission("featureflag.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const featureFlags = await prisma.tenantFeatureFlag.findMany({
      where: {
        tenantId: req.tenant.id,
      },
      orderBy: {
        key: "asc",
      },
    });

    return res.json({
      ok: true,
      featureFlags: featureFlags.map(serializeFeatureFlag),
    });
  } catch (error) {
    return next(error);
  }
});

tenantRouter.post("/current/feature-flags", requireAuth, requireTenant, requirePermission("featureflag.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const key = String(req.body?.key || "").trim();
    const enabled = req.body?.enabled !== undefined ? Boolean(req.body.enabled) : false;
    const config = req.body?.config === undefined ? null : req.body.config;

    if (!key || !/^[a-z0-9._-]{2,64}$/i.test(key)) {
      return res.status(400).json({
        ok: false,
        error: "key must be 2-64 characters and use only letters, numbers, dots, underscores, or dashes",
      });
    }

    const existingFlag = await prisma.tenantFeatureFlag.findUnique({
      where: {
        tenantId_key: {
          tenantId: req.tenant.id,
          key,
        },
      },
    });

    if (existingFlag) {
      return res.status(409).json({
        ok: false,
        error: "A feature flag with that key already exists for this tenant",
      });
    }

    const featureFlag = await prisma.tenantFeatureFlag.create({
      data: {
        tenantId: req.tenant.id,
        key,
        enabled,
        config,
      },
    });

    await Promise.all([
      writeAuditLog(req, {
        action: "tenant.feature_flag_created",
        entityType: "tenant_feature_flag",
        entityId: featureFlag.id,
        metadata: {
          key,
          enabled,
        },
      }),
      recordAnalyticsEvent(req, {
        eventName: "tenant.feature_flag_created",
        eventCategory: "tenant",
        metadata: {
          key,
          enabled,
        },
      }),
    ]);

    return res.status(201).json({
      ok: true,
      featureFlag: serializeFeatureFlag(featureFlag),
    });
  } catch (error) {
    return next(error);
  }
});

tenantRouter.patch("/current/feature-flags/:key", requireAuth, requireTenant, requirePermission("featureflag.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const key = String(req.params.key || "").trim();
    const data = {};

    const existingFlag = await prisma.tenantFeatureFlag.findUnique({
      where: {
        tenantId_key: {
          tenantId: req.tenant.id,
          key,
        },
      },
    });

    if (!existingFlag) {
      return res.status(404).json({
        ok: false,
        error: "Feature flag not found",
      });
    }

    if (req.body?.enabled !== undefined) {
      data.enabled = Boolean(req.body.enabled);
    }

    if (req.body?.config !== undefined) {
      data.config = req.body.config;
    }

    if (!Object.keys(data).length) {
      return res.status(400).json({
        ok: false,
        error: "No supported feature flag changes were provided",
      });
    }

    const featureFlag = await prisma.tenantFeatureFlag.update({
      where: {
        id: existingFlag.id,
      },
      data,
    });

    await writeAuditLog(req, {
      action: "tenant.feature_flag_updated",
      entityType: "tenant_feature_flag",
      entityId: featureFlag.id,
      metadata: {
        key,
        keys: Object.keys(data),
      },
    });

    return res.json({
      ok: true,
      featureFlag: serializeFeatureFlag(featureFlag),
    });
  } catch (error) {
    return next(error);
  }
});

tenantRouter.delete("/current/feature-flags/:key", requireAuth, requireTenant, requirePermission("featureflag.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const key = String(req.params.key || "").trim();

    const existingFlag = await prisma.tenantFeatureFlag.findUnique({
      where: {
        tenantId_key: {
          tenantId: req.tenant.id,
          key,
        },
      },
    });

    if (!existingFlag) {
      return res.status(404).json({
        ok: false,
        error: "Feature flag not found",
      });
    }

    await prisma.tenantFeatureFlag.delete({
      where: {
        id: existingFlag.id,
      },
    });

    await writeAuditLog(req, {
      action: "tenant.feature_flag_deleted",
      entityType: "tenant_feature_flag",
      entityId: existingFlag.id,
      metadata: {
        key,
      },
    });

    return res.json({
      ok: true,
      deletedKey: key,
    });
  } catch (error) {
    return next(error);
  }
});

tenantRouter.get("/current/domains", requireAuth, requireTenant, requirePermission("tenant.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const domains = await prisma.tenantDomain.findMany({
      where: {
        tenantId: req.tenant.id,
      },
      orderBy: [
        { isPrimary: "desc" },
        { createdAt: "asc" },
      ],
    });

    return res.json({
      ok: true,
      domains: domains.map(serializeTenantDomain),
    });
  } catch (error) {
    return next(error);
  }
});

tenantRouter.post("/current/domains", requireAuth, requireTenant, requirePermission("tenant.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const domainValue = normalizeDomainValue(req.body?.domain);
    const requestedPrimary = Boolean(req.body?.isPrimary);

    if (!domainValue || !assertValidDomain(domainValue)) {
      return res.status(400).json({
        ok: false,
        error: "domain must be a valid hostname",
      });
    }

    const [existingTenantDomains, existingDomain] = await Promise.all([
      prisma.tenantDomain.findMany({
        where: {
          tenantId: req.tenant.id,
        },
        orderBy: {
          createdAt: "asc",
        },
      }),
      prisma.tenantDomain.findUnique({
        where: {
          domain: domainValue,
        },
      }),
    ]);

    if (existingDomain) {
      return res.status(409).json({
        ok: false,
        error: "That domain is already assigned to a tenant",
      });
    }

    const isPrimary = requestedPrimary || existingTenantDomains.length === 0;
    const domain = await prisma.$transaction(async (tx) => {
      if (isPrimary) {
        await tx.tenantDomain.updateMany({
          where: {
            tenantId: req.tenant.id,
          },
          data: {
            isPrimary: false,
          },
        });
      }

      return tx.tenantDomain.create({
        data: {
          tenantId: req.tenant.id,
          domain: domainValue,
          isPrimary,
        },
      });
    });

    await writeAuditLog(req, {
      action: "tenant.domain_created",
      entityType: "tenant_domain",
      entityId: domain.id,
      metadata: {
        domain: domain.domain,
        isPrimary: domain.isPrimary,
      },
    });

    return res.status(201).json({
      ok: true,
      domain: serializeTenantDomain(domain),
    });
  } catch (error) {
    return next(error);
  }
});

tenantRouter.patch("/current/domains/:domainId", requireAuth, requireTenant, requirePermission("tenant.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const existingDomain = await prisma.tenantDomain.findFirst({
      where: {
        id: req.params.domainId,
        tenantId: req.tenant.id,
      },
    });

    if (!existingDomain) {
      return res.status(404).json({
        ok: false,
        error: "Tenant domain not found",
      });
    }

    const data = {};

    if (req.body?.domain !== undefined) {
      const domainValue = normalizeDomainValue(req.body.domain);
      if (!domainValue || !assertValidDomain(domainValue)) {
        return res.status(400).json({
          ok: false,
          error: "domain must be a valid hostname",
        });
      }

      const conflictingDomain = await prisma.tenantDomain.findUnique({
        where: {
          domain: domainValue,
        },
      });

      if (conflictingDomain && conflictingDomain.id !== existingDomain.id) {
        return res.status(409).json({
          ok: false,
          error: "That domain is already assigned to a tenant",
        });
      }

      data.domain = domainValue;
    }

    if (req.body?.isPrimary !== undefined) {
      const requestedPrimary = Boolean(req.body.isPrimary);
      if (!requestedPrimary && existingDomain.isPrimary) {
        return res.status(400).json({
          ok: false,
          error: "A primary domain cannot be unset without promoting another domain first",
        });
      }

      data.isPrimary = requestedPrimary;
    }

    if (!Object.keys(data).length) {
      return res.status(400).json({
        ok: false,
        error: "No supported domain changes were provided",
      });
    }

    const domain = await prisma.$transaction(async (tx) => {
      if (data.isPrimary) {
        await tx.tenantDomain.updateMany({
          where: {
            tenantId: req.tenant.id,
          },
          data: {
            isPrimary: false,
          },
        });
      }

      return tx.tenantDomain.update({
        where: {
          id: existingDomain.id,
        },
        data,
      });
    });

    await writeAuditLog(req, {
      action: "tenant.domain_updated",
      entityType: "tenant_domain",
      entityId: domain.id,
      metadata: {
        keys: Object.keys(data),
        domain: domain.domain,
        isPrimary: domain.isPrimary,
      },
    });

    return res.json({
      ok: true,
      domain: serializeTenantDomain(domain),
    });
  } catch (error) {
    return next(error);
  }
});

tenantRouter.delete("/current/domains/:domainId", requireAuth, requireTenant, requirePermission("tenant.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const existingDomain = await prisma.tenantDomain.findFirst({
      where: {
        id: req.params.domainId,
        tenantId: req.tenant.id,
      },
    });

    if (!existingDomain) {
      return res.status(404).json({
        ok: false,
        error: "Tenant domain not found",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.tenantDomain.delete({
        where: {
          id: existingDomain.id,
        },
      });

      if (existingDomain.isPrimary) {
        const nextPrimary = await tx.tenantDomain.findFirst({
          where: {
            tenantId: req.tenant.id,
          },
          orderBy: {
            createdAt: "asc",
          },
        });

        if (nextPrimary) {
          await tx.tenantDomain.update({
            where: {
              id: nextPrimary.id,
            },
            data: {
              isPrimary: true,
            },
          });
        }
      }
    });

    await writeAuditLog(req, {
      action: "tenant.domain_deleted",
      entityType: "tenant_domain",
      entityId: existingDomain.id,
      metadata: {
        domain: existingDomain.domain,
        wasPrimary: existingDomain.isPrimary,
      },
    });

    return res.json({
      ok: true,
      deletedId: existingDomain.id,
    });
  } catch (error) {
    return next(error);
  }
});

tenantRouter.get("/current/api-keys", requireAuth, requireTenant, requirePermission("tenant.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const apiKeys = await prisma.tenantApiKey.findMany({
      where: {
        tenantId: req.tenant.id,
      },
      include: {
        createdByUser: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      ok: true,
      apiKeys: apiKeys.map(serializeTenantApiKey),
    });
  } catch (error) {
    return next(error);
  }
});

tenantRouter.post("/current/api-keys", requireAuth, requireTenant, requirePermission("tenant.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const name = String(req.body?.name || "").trim();

    if (!name) {
      return res.status(400).json({
        ok: false,
        error: "name is required",
      });
    }

    const permissions = await resolvePermissionKeys(prisma, req.body?.permissions, {
      required: true,
    });
    if (!permissions) {
      return res.status(400).json({
        ok: false,
        error: "permissions must be a non-empty array of valid permission keys",
      });
    }

    const { rawKey, keyPrefix, secretHash } = generateTenantApiKeyValue();
    const apiKey = await prisma.tenantApiKey.create({
      data: {
        tenantId: req.tenant.id,
        createdByUserId: req.auth.user.id,
        name,
        keyPrefix,
        secretHash,
        permissions,
      },
      include: {
        createdByUser: true,
      },
    });

    await writeAuditLog(req, {
      action: "tenant.api_key_created",
      entityType: "tenant_api_key",
      entityId: apiKey.id,
      metadata: {
        name,
        permissions,
      },
    });

    return res.status(201).json({
      ok: true,
      apiKey: serializeTenantApiKey(apiKey),
      token: rawKey,
    });
  } catch (error) {
    return next(error);
  }
});

tenantRouter.patch("/current/api-keys/:apiKeyId", requireAuth, requireTenant, requirePermission("tenant.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const existingApiKey = await prisma.tenantApiKey.findFirst({
      where: {
        id: req.params.apiKeyId,
        tenantId: req.tenant.id,
      },
      include: {
        createdByUser: true,
      },
    });

    if (!existingApiKey) {
      return res.status(404).json({
        ok: false,
        error: "API key not found",
      });
    }

    const data = {};

    if (req.body?.name !== undefined) {
      const name = String(req.body.name || "").trim();
      if (!name) {
        return res.status(400).json({
          ok: false,
          error: "name cannot be empty",
        });
      }

      data.name = name;
    }

    if (req.body?.permissions !== undefined) {
      const permissions = await resolvePermissionKeys(prisma, req.body.permissions, {
        required: true,
      });
      if (!permissions) {
        return res.status(400).json({
          ok: false,
          error: "permissions must be a non-empty array of valid permission keys",
        });
      }

      data.permissions = permissions;
    }

    if (req.body?.isActive !== undefined) {
      data.disabledAt = Boolean(req.body.isActive) ? null : new Date();
    }

    if (!Object.keys(data).length) {
      return res.status(400).json({
        ok: false,
        error: "No supported API key changes were provided",
      });
    }

    const apiKey = await prisma.tenantApiKey.update({
      where: {
        id: existingApiKey.id,
      },
      data,
      include: {
        createdByUser: true,
      },
    });

    await writeAuditLog(req, {
      action: "tenant.api_key_updated",
      entityType: "tenant_api_key",
      entityId: apiKey.id,
      metadata: {
        keys: Object.keys(data),
      },
    });

    return res.json({
      ok: true,
      apiKey: serializeTenantApiKey(apiKey),
    });
  } catch (error) {
    return next(error);
  }
});

tenantRouter.post("/current/api-keys/:apiKeyId/rotate", requireAuth, requireTenant, requirePermission("tenant.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const existingApiKey = await prisma.tenantApiKey.findFirst({
      where: {
        id: req.params.apiKeyId,
        tenantId: req.tenant.id,
      },
      include: {
        createdByUser: true,
      },
    });

    if (!existingApiKey) {
      return res.status(404).json({
        ok: false,
        error: "API key not found",
      });
    }

    const { rawKey, keyPrefix, secretHash } = generateTenantApiKeyValue();
    const apiKey = await prisma.tenantApiKey.update({
      where: {
        id: existingApiKey.id,
      },
      data: {
        keyPrefix,
        secretHash,
        disabledAt: null,
      },
      include: {
        createdByUser: true,
      },
    });

    await writeAuditLog(req, {
      action: "tenant.api_key_rotated",
      entityType: "tenant_api_key",
      entityId: apiKey.id,
      metadata: {
        name: apiKey.name,
      },
    });

    return res.json({
      ok: true,
      apiKey: serializeTenantApiKey(apiKey),
      token: rawKey,
    });
  } catch (error) {
    return next(error);
  }
});

tenantRouter.delete("/current/api-keys/:apiKeyId", requireAuth, requireTenant, requirePermission("tenant.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const existingApiKey = await prisma.tenantApiKey.findFirst({
      where: {
        id: req.params.apiKeyId,
        tenantId: req.tenant.id,
      },
    });

    if (!existingApiKey) {
      return res.status(404).json({
        ok: false,
        error: "API key not found",
      });
    }

    await prisma.tenantApiKey.delete({
      where: {
        id: existingApiKey.id,
      },
    });

    await writeAuditLog(req, {
      action: "tenant.api_key_deleted",
      entityType: "tenant_api_key",
      entityId: existingApiKey.id,
      metadata: {
        name: existingApiKey.name,
      },
    });

    return res.json({
      ok: true,
      deletedId: existingApiKey.id,
    });
  } catch (error) {
    return next(error);
  }
});

tenantRouter.get("/current/webhooks", requireAuth, requireTenant, requirePermission("tenant.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const [endpoints, deliveries] = await Promise.all([
      prisma.webhookEndpoint.findMany({
        where: {
          tenantId: req.tenant.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.webhookDelivery.findMany({
        where: {
          tenantId: req.tenant.id,
        },
        include: {
          endpoint: true,
        },
        orderBy: {
          attemptedAt: "desc",
        },
        take: 50,
      }),
    ]);

    return res.json({
      ok: true,
      supportedEvents: SUPPORTED_WEBHOOK_EVENT_TYPES,
      endpoints: endpoints.map(serializeWebhookEndpoint),
      deliveries: deliveries.map(serializeWebhookDelivery),
    });
  } catch (error) {
    return next(error);
  }
});

tenantRouter.get("/current/webhooks/deliveries/:deliveryId", requireAuth, requireTenant, requirePermission("tenant.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const delivery = await prisma.webhookDelivery.findFirst({
      where: {
        id: req.params.deliveryId,
        tenantId: req.tenant.id,
      },
      include: {
        endpoint: true,
      },
    });

    if (!delivery) {
      return res.status(404).json({
        ok: false,
        error: "Webhook delivery not found",
      });
    }

    return res.json({
      ok: true,
      delivery: serializeWebhookDelivery(delivery),
      payload: delivery.payload,
    });
  } catch (error) {
    return next(error);
  }
});

tenantRouter.post("/current/webhooks/deliveries/:deliveryId/retry", requireAuth, requireTenant, requirePermission("tenant.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const previousDelivery = await prisma.webhookDelivery.findFirst({
      where: {
        id: req.params.deliveryId,
        tenantId: req.tenant.id,
      },
      include: {
        endpoint: true,
      },
    });

    if (!previousDelivery) {
      return res.status(404).json({
        ok: false,
        error: "Webhook delivery not found",
      });
    }

    if (previousDelivery.endpoint.status !== "ACTIVE") {
      return res.status(400).json({
        ok: false,
        error: "Webhook endpoint is disabled and cannot be retried",
      });
    }

    const retryPayload =
      previousDelivery.payload && typeof previousDelivery.payload === "object" && !Array.isArray(previousDelivery.payload)
        ? {
            ...previousDelivery.payload,
            retryOfDeliveryId: previousDelivery.id,
          }
        : {
            retryOfDeliveryId: previousDelivery.id,
            sourcePayload: previousDelivery.payload || null,
          };

    const dispatchResult = await dispatchTenantWebhookEvent({
      tenantId: req.tenant.id,
      tenantSlug: req.tenant.slug,
      tenantName: req.tenant.name,
      eventType: previousDelivery.eventType,
      payload: retryPayload,
      requestId: req.context?.requestId,
      endpointIds: [previousDelivery.endpointId],
    });

    if (!dispatchResult.dispatched || !dispatchResult.deliveryIds?.length) {
      return res.status(409).json({
        ok: false,
        error: "Retry could not be dispatched",
      });
    }

    const retriedDelivery = await prisma.webhookDelivery.findUnique({
      where: {
        id: dispatchResult.deliveryIds[0],
      },
      include: {
        endpoint: true,
      },
    });

    await writeAuditLog(req, {
      action: "webhook.delivery_retried",
      entityType: "webhook_delivery",
      entityId: previousDelivery.id,
      metadata: {
        previousDeliveryId: previousDelivery.id,
        retryDeliveryId: retriedDelivery?.id || null,
        endpointId: previousDelivery.endpointId,
      },
    });

    return res.status(202).json({
      ok: true,
      dispatched: dispatchResult.dispatched,
      delivery: retriedDelivery ? serializeWebhookDelivery(retriedDelivery) : null,
    });
  } catch (error) {
    return next(error);
  }
});

tenantRouter.post("/current/webhooks", requireAuth, requireTenant, requirePermission("tenant.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const url = String(req.body?.url || "").trim();
    const description = String(req.body?.description || "").trim() || null;
    const eventTypes = sanitizeWebhookEventTypes(req.body?.eventTypes);

    if (!url || !assertValidWebhookUrl(url)) {
      return res.status(400).json({
        ok: false,
        error: "A valid webhook URL is required",
      });
    }

    if (!eventTypes.length) {
      return res.status(400).json({
        ok: false,
        error: "At least one supported webhook event must be selected",
      });
    }

    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        tenantId: req.tenant.id,
        url,
        description,
        eventTypes,
        signingSecret: crypto.randomBytes(24).toString("hex"),
      },
    });

    await Promise.all([
      writeAuditLog(req, {
        action: "webhook.endpoint_created",
        entityType: "webhook_endpoint",
        entityId: endpoint.id,
        metadata: {
          url,
          eventTypes,
        },
      }),
      recordAnalyticsEvent(req, {
        eventName: "webhook.endpoint_created",
        eventCategory: "integration",
        metadata: {
          eventTypes,
        },
      }),
    ]);

    return res.status(201).json({
      ok: true,
      endpoint: serializeWebhookEndpoint(endpoint),
      signingSecret: endpoint.signingSecret,
    });
  } catch (error) {
    return next(error);
  }
});

tenantRouter.patch("/current/webhooks/:webhookId", requireAuth, requireTenant, requirePermission("tenant.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const existingEndpoint = await prisma.webhookEndpoint.findFirst({
      where: {
        id: req.params.webhookId,
        tenantId: req.tenant.id,
      },
    });

    if (!existingEndpoint) {
      return res.status(404).json({
        ok: false,
        error: "Webhook endpoint not found",
      });
    }

    const data = {};

    if (req.body?.url !== undefined) {
      const url = String(req.body.url || "").trim();
      if (!url || !assertValidWebhookUrl(url)) {
        return res.status(400).json({
          ok: false,
          error: "A valid webhook URL is required",
        });
      }
      data.url = url;
    }

    if (req.body?.description !== undefined) {
      data.description = String(req.body.description || "").trim() || null;
    }

    if (req.body?.eventTypes !== undefined) {
      const eventTypes = sanitizeWebhookEventTypes(req.body.eventTypes);
      if (!eventTypes.length) {
        return res.status(400).json({
          ok: false,
          error: "At least one supported webhook event must be selected",
        });
      }

      data.eventTypes = eventTypes;
    }

    if (req.body?.status !== undefined) {
      const normalizedStatus = String(req.body.status || "").trim().toLowerCase();
      if (!["active", "disabled"].includes(normalizedStatus)) {
        return res.status(400).json({
          ok: false,
          error: "status must be active or disabled",
        });
      }

      data.status = normalizedStatus.toUpperCase();
    }

    if (!Object.keys(data).length) {
      return res.status(400).json({
        ok: false,
        error: "No supported webhook changes were provided",
      });
    }

    const endpoint = await prisma.webhookEndpoint.update({
      where: {
        id: existingEndpoint.id,
      },
      data,
    });

    await writeAuditLog(req, {
      action: "webhook.endpoint_updated",
      entityType: "webhook_endpoint",
      entityId: endpoint.id,
      metadata: data,
    });

    return res.json({
      ok: true,
      endpoint: serializeWebhookEndpoint(endpoint),
    });
  } catch (error) {
    return next(error);
  }
});

tenantRouter.delete("/current/webhooks/:webhookId", requireAuth, requireTenant, requirePermission("tenant.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const endpoint = await prisma.webhookEndpoint.findFirst({
      where: {
        id: req.params.webhookId,
        tenantId: req.tenant.id,
      },
    });

    if (!endpoint) {
      return res.status(404).json({
        ok: false,
        error: "Webhook endpoint not found",
      });
    }

    await prisma.webhookEndpoint.delete({
      where: {
        id: endpoint.id,
      },
    });

    await writeAuditLog(req, {
      action: "webhook.endpoint_deleted",
      entityType: "webhook_endpoint",
      entityId: endpoint.id,
      metadata: {
        url: endpoint.url,
      },
    });

    return res.json({
      ok: true,
      deletedId: endpoint.id,
    });
  } catch (error) {
    return next(error);
  }
});

tenantRouter.post("/current/webhooks/:webhookId/test", requireAuth, requireTenant, requirePermission("tenant.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const endpoint = await prisma.webhookEndpoint.findFirst({
      where: {
        id: req.params.webhookId,
        tenantId: req.tenant.id,
      },
    });

    if (!endpoint) {
      return res.status(404).json({
        ok: false,
        error: "Webhook endpoint not found",
      });
    }

    if (endpoint.status !== "ACTIVE") {
      return res.status(400).json({
        ok: false,
        error: "Only active endpoints can receive test deliveries",
      });
    }

    const result = await dispatchTenantWebhookEvent({
      tenantId: req.tenant.id,
      tenantSlug: req.tenant.slug,
      tenantName: req.tenant.name,
      eventType: "system.test",
      payload: {
        initiatedBy: req.auth.user.email,
        endpointId: endpoint.id,
      },
      requestId: req.context?.requestId,
      endpointIds: [endpoint.id],
    });

    await writeAuditLog(req, {
      action: "webhook.test_requested",
      entityType: "webhook_endpoint",
      entityId: endpoint.id,
      metadata: {
        dispatched: result.dispatched,
      },
    });

    return res.status(202).json({
      ok: true,
      dispatched: result.dispatched,
    });
  } catch (error) {
    return next(error);
  }
});

tenantRouter.get("/current/billing", requireAuth, requireTenant, requirePermission("tenant.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const [seatHolders, existingSubscription, invoices] = await Promise.all([
      prisma.userRole.findMany({
        where: {
          tenantId: req.tenant.id,
          role: {
            key: {
              in: MANAGED_ROLE_KEYS,
            },
          },
        },
        distinct: ["userId"],
        select: {
          userId: true,
        },
      }),
      prisma.billingSubscription.findUnique({
        where: {
          tenantId: req.tenant.id,
        },
      }),
      prisma.billingInvoice.findMany({
        where: {
          tenantId: req.tenant.id,
        },
        orderBy: {
          issuedAt: "desc",
        },
        take: 12,
      }),
    ]);

    const activeSeats = seatHolders.length || 1;
    const nextBillingAt = existingSubscription?.nextBillingAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const subscription = await prisma.billingSubscription.upsert({
      where: {
        tenantId: req.tenant.id,
      },
      update: {
        activeSeats,
      },
      create: {
        tenantId: req.tenant.id,
        provider: "manual",
        planKey: "professional",
        planName: "Professional",
        interval: "MONTHLY",
        status: "ACTIVE",
        seatPriceCents: 4900,
        currency: "USD",
        activeSeats,
        nextBillingAt,
      },
    });

    return res.json({
      ok: true,
      billing: serializeBilling(subscription, invoices, activeSeats),
    });
  } catch (error) {
    return next(error);
  }
});

// ---------------------------------------------------------------------------
// Billing write endpoints
// ---------------------------------------------------------------------------

const VALID_BILLING_INTERVALS = ["MONTHLY", "YEARLY"];
const VALID_BILLING_STATUSES = ["TRIALING", "ACTIVE", "PAST_DUE", "CANCELED"];
const VALID_INVOICE_STATUSES = ["DRAFT", "OPEN", "PAID", "VOID"];

async function ensureBillingSubscription(prisma, tenantId) {
  const seatHolders = await prisma.userRole.findMany({
    where: {
      tenantId,
      role: { key: { in: MANAGED_ROLE_KEYS } },
    },
    distinct: ["userId"],
    select: { userId: true },
  });
  const activeSeats = seatHolders.length || 1;
  return prisma.billingSubscription.upsert({
    where: { tenantId },
    create: {
      tenantId,
      provider: "manual",
      planKey: "professional",
      planName: "Professional",
      interval: "MONTHLY",
      status: "ACTIVE",
      seatPriceCents: 4900,
      currency: "USD",
      activeSeats,
      nextBillingAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    update: { activeSeats },
  });
}

// PATCH /current/billing — update subscription plan snapshot
tenantRouter.patch(
  "/current/billing",
  requireAuth,
  requireTenant,
  requirePermission("tenant.manage"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const data = {};

      if (typeof req.body?.planKey === "string") {
        data.planKey = req.body.planKey.trim();
      }

      if (typeof req.body?.planName === "string") {
        data.planName = req.body.planName.trim();
      }

      if (req.body?.interval !== undefined) {
        const interval = String(req.body.interval || "").trim().toUpperCase();
        if (!VALID_BILLING_INTERVALS.includes(interval)) {
          return res.status(400).json({
            ok: false,
            error: `interval must be one of: ${VALID_BILLING_INTERVALS.map((v) => v.toLowerCase()).join(", ")}`,
          });
        }
        data.interval = interval;
      }

      if (req.body?.status !== undefined) {
        const status = String(req.body.status || "").trim().toUpperCase();
        if (!VALID_BILLING_STATUSES.includes(status)) {
          return res.status(400).json({
            ok: false,
            error: `status must be one of: ${VALID_BILLING_STATUSES.map((v) => v.toLowerCase()).join(", ")}`,
          });
        }
        data.status = status;
      }

      if (req.body?.seatPriceCents !== undefined) {
        const price = Number(req.body.seatPriceCents);
        if (!Number.isInteger(price) || price < 0) {
          return res.status(400).json({ ok: false, error: "seatPriceCents must be a non-negative integer" });
        }
        data.seatPriceCents = price;
      }

      if (req.body?.nextBillingAt !== undefined) {
        const date = req.body.nextBillingAt ? new Date(req.body.nextBillingAt) : null;
        if (req.body.nextBillingAt && Number.isNaN(date?.getTime())) {
          return res.status(400).json({ ok: false, error: "nextBillingAt must be a valid ISO date string" });
        }
        data.nextBillingAt = date;
      }

      if (Object.keys(data).length === 0) {
        return res.status(400).json({ ok: false, error: "No supported billing updates were provided" });
      }

      const seatHolders = await prisma.userRole.findMany({
        where: {
          tenantId: req.tenant.id,
          role: { key: { in: MANAGED_ROLE_KEYS } },
        },
        distinct: ["userId"],
        select: { userId: true },
      });
      const activeSeats = seatHolders.length || 1;
      data.activeSeats = activeSeats;
      const [seatHolders, invoices] = await Promise.all([
        prisma.userRole.findMany({
          where: {
            tenantId: req.tenant.id,
            role: { key: { in: MANAGED_ROLE_KEYS } },
          },
          distinct: ["userId"],
          select: { userId: true },
        }),
        prisma.billingInvoice.findMany({
          where: { tenantId: req.tenant.id },
          orderBy: { issuedAt: "desc" },
          take: 12,
        }),
      ]);

      const activeSeats = seatHolders.length || 1;

      const subscription = await prisma.billingSubscription.upsert({
        where: { tenantId: req.tenant.id },
        create: {
          tenantId: req.tenant.id,
          provider: "manual",
          planKey: data.planKey || "professional",
          planName: data.planName || "Professional",
          interval: data.interval || "MONTHLY",
          status: data.status || "ACTIVE",
          seatPriceCents: data.seatPriceCents ?? 4900,
          currency: "USD",
          activeSeats,
          nextBillingAt: "nextBillingAt" in data ? data.nextBillingAt : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          nextBillingAt: data.nextBillingAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          activeSeats: 1,
          nextBillingAt: data.nextBillingAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        update: { ...data, activeSeats },
      });

      await Promise.all([
        writeAuditLog(req, {
          action: "billing.subscription_updated",
          entityType: "billing_subscription",
          entityId: subscription.id,
          metadata: data,
        }),
        recordAnalyticsEvent(req, {
          eventName: "billing.subscription_updated",
          eventCategory: "billing",
          metadata: { planKey: subscription.planKey, status: subscription.status },
        }),
      ]);

      return res.json({
        ok: true,
        billing: serializeBilling(subscription, invoices, activeSeats),
      });
    } catch (error) {
      return next(error);
    }
  },
);

// POST /current/billing/invoices — create an invoice record
tenantRouter.post(
  "/current/billing/invoices",
  requireAuth,
  requireTenant,
  requirePermission("tenant.manage"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const amountCents = Number(req.body?.amountCents);
      if (!Number.isInteger(amountCents) || amountCents < 0) {
        return res.status(400).json({ ok: false, error: "amountCents must be a non-negative integer" });
      }

      const status = req.body?.status
        ? String(req.body.status).trim().toUpperCase()
        : "PAID";

      if (!VALID_INVOICE_STATUSES.includes(status)) {
        return res.status(400).json({
          ok: false,
          error: `status must be one of: ${VALID_INVOICE_STATUSES.map((v) => v.toLowerCase()).join(", ")}`,
        });
      }

      let periodStart = null;
      let periodEnd = null;

      if (req.body?.periodStart) {
        periodStart = new Date(req.body.periodStart);
        if (Number.isNaN(periodStart.getTime())) {
          return res.status(400).json({ ok: false, error: "periodStart must be a valid ISO date string" });
        }
      }

      if (req.body?.periodEnd) {
        periodEnd = new Date(req.body.periodEnd);
        if (Number.isNaN(periodEnd.getTime())) {
          return res.status(400).json({ ok: false, error: "periodEnd must be a valid ISO date string" });
        }
      }

      const hostedUrl = req.body?.hostedUrl ? String(req.body.hostedUrl).trim() : null;
      if (hostedUrl) {
        try {
          const parsed = new URL(hostedUrl);
          if (!["http:", "https:"].includes(parsed.protocol)) {
            throw new Error("invalid protocol");
          }
        } catch {
          return res.status(400).json({ ok: false, error: "hostedUrl must be a valid HTTP(S) URL" });
        }
      }

      const subscription = await ensureBillingSubscription(prisma, req.tenant.id);

      const now = new Date();
      const invoiceNumber = `INV-${req.tenant.slug.toUpperCase()}-${now.getTime()}-${crypto.randomBytes(4).toString("hex")}`;
      const randomSuffix = crypto.randomBytes(4).toString("hex").toUpperCase();
      const invoiceNumber = `INV-${req.tenant.slug.toUpperCase()}-${now.getTime()}-${randomSuffix}`;

      const invoice = await prisma.billingInvoice.create({
        data: {
          tenantId: req.tenant.id,
          subscriptionId: subscription.id,
          invoiceNumber,
          status,
          amountCents,
          currency: req.body?.currency ? String(req.body.currency).trim().toUpperCase() : "USD",
          issuedAt: now,
          periodStart,
          periodEnd,
          paidAt: status === "PAID" ? now : null,
          hostedUrl,
        },
      });

      await Promise.all([
        writeAuditLog(req, {
          action: "billing.invoice_created",
          entityType: "billing_invoice",
          entityId: invoice.id,
          metadata: { invoiceNumber, amountCents, status },
        }),
        recordAnalyticsEvent(req, {
          eventName: "billing.invoice_created",
          eventCategory: "billing",
          metadata: { invoiceId: invoice.id, amountCents, status },
        }),
      ]);

      return res.status(201).json({
        ok: true,
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status.toLowerCase(),
          amountCents: invoice.amountCents,
          currency: invoice.currency,
          issuedAt: invoice.issuedAt,
          periodStart: invoice.periodStart,
          periodEnd: invoice.periodEnd,
          paidAt: invoice.paidAt,
          hostedUrl: invoice.hostedUrl,
        },
      });
    } catch (error) {
      return next(error);
    }
  },
);

// PATCH /current/billing/invoices/:invoiceId — update invoice status
tenantRouter.patch(
  "/current/billing/invoices/:invoiceId",
  requireAuth,
  requireTenant,
  requirePermission("tenant.manage"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const invoice = await prisma.billingInvoice.findFirst({
        where: {
          id: req.params.invoiceId,
          tenantId: req.tenant.id,
        },
      });

      if (!invoice) {
        return res.status(404).json({ ok: false, error: "Invoice not found" });
      }

      const data = {};

      if (req.body?.status !== undefined) {
        const status = String(req.body.status || "").trim().toUpperCase();
        if (!VALID_INVOICE_STATUSES.includes(status)) {
          return res.status(400).json({
            ok: false,
            error: `status must be one of: ${VALID_INVOICE_STATUSES.map((v) => v.toLowerCase()).join(", ")}`,
          });
        }
        data.status = status;
        data.paidAt = status === "PAID" ? new Date() : null;
      }

      if (req.body?.hostedUrl !== undefined) {
        const hostedUrl = req.body.hostedUrl ? String(req.body.hostedUrl).trim() : null;
        if (hostedUrl) {
          try {
            const parsed = new URL(hostedUrl);
            if (!["http:", "https:"].includes(parsed.protocol)) {
              throw new Error("invalid protocol");
            }
          } catch {
            return res.status(400).json({ ok: false, error: "hostedUrl must be a valid HTTP(S) URL" });
          }
        }
        data.hostedUrl = hostedUrl;
      }

      if (Object.keys(data).length === 0) {
        return res.status(400).json({ ok: false, error: "No supported invoice updates were provided" });
      }

      const updated = await prisma.billingInvoice.update({
        where: { id: invoice.id },
        data,
      });

      await writeAuditLog(req, {
        action: "billing.invoice_updated",
        entityType: "billing_invoice",
        entityId: invoice.id,
        metadata: { previousStatus: invoice.status, ...data },
      });

      return res.json({
        ok: true,
        invoice: {
          id: updated.id,
          invoiceNumber: updated.invoiceNumber,
          status: updated.status.toLowerCase(),
          amountCents: updated.amountCents,
          currency: updated.currency,
          issuedAt: updated.issuedAt,
          periodStart: updated.periodStart,
          periodEnd: updated.periodEnd,
          paidAt: updated.paidAt,
          hostedUrl: updated.hostedUrl,
        },
      });
    } catch (error) {
      return next(error);
    }
  },
);
// ─── Add-ons: Phone Numbers ─────────────────────────────────────────────────

// GET /current/addons – Overview of add-ons for the tenant
tenantRouter.get("/current/addons", requireAuth, requireTenant, requirePermission("tenant.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const [phoneNumbers, sipTrunks] = await Promise.all([
      prisma.tenantPhoneNumber.findMany({
        where: { tenantId: req.tenant.id, status: "ACTIVE" },
        orderBy: { provisionedAt: "desc" },
      }),
      prisma.tenantSipTrunk.findMany({
        where: { tenantId: req.tenant.id, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return res.json({
      ok: true,
      addons: {
        phoneNumbers: phoneNumbers.map(serializePhoneNumber),
        sipTrunks: sipTrunks.map(serializeSipTrunk),
      },
    });
  } catch (error) {
    return next(error);
  }
});

// POST /current/addons/phone-numbers – Provision a phone number
tenantRouter.post("/current/addons/phone-numbers", requireAuth, requireTenant, requirePermission("tenant.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();

    const phoneNumber = String(req.body?.phoneNumber || "").trim();
    const label = req.body?.label ? String(req.body.label).trim() : null;

    if (!phoneNumber) {
      return res.status(400).json({ ok: false, error: "phoneNumber is required" });
    }

    if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
      return res.status(400).json({ ok: false, error: "phoneNumber must be in E.164 format (e.g. +15551234567)" });
    }

    const existing = await prisma.tenantPhoneNumber.findFirst({
      where: { tenantId: req.tenant.id, phoneNumber, status: "ACTIVE" },
    });

    if (existing) {
      return res.status(409).json({ ok: false, error: "This phone number is already provisioned for your workspace" });
    }

    // Re-activate a previously released row if one exists, otherwise create new
    const released = await prisma.tenantPhoneNumber.findFirst({
      where: { tenantId: req.tenant.id, phoneNumber, status: "RELEASED" },
      orderBy: { releasedAt: "desc" },
    });

    const record = released
      ? await prisma.tenantPhoneNumber.update({
          where: { id: released.id },
          data: {
            label,
            capabilities: req.body?.capabilities || { voice: true, sms: true },
            status: "ACTIVE",
            provisionedAt: new Date(),
            releasedAt: null,
          },
        })
      : await prisma.tenantPhoneNumber.create({
          data: {
            tenantId: req.tenant.id,
            phoneNumber,
            label,
            provider: "manual",
            capabilities: req.body?.capabilities || { voice: true, sms: true },
            status: "ACTIVE",
            monthlyCostCents: 100,
            currency: "USD",
            provisionedAt: new Date(),
          },
        });

    await Promise.all([
      writeAuditLog(req, {
        action: "addon.phone_number.provisioned",
        entityType: "phone_number",
        entityId: record.id,
        metadata: { phoneNumber },
      }),
      recordAnalyticsEvent(req, {
        eventName: "addon.phone_number.provisioned",
        eventCategory: "addons",
        metadata: { phoneNumberId: record.id },
      }),
    ]);

    return res.status(201).json({
      ok: true,
      phoneNumber: serializePhoneNumber(record),
    });
  } catch (error) {
    return next(error);
  }
});

// DELETE /current/addons/phone-numbers/:phoneNumberId – Release a phone number
tenantRouter.delete("/current/addons/phone-numbers/:phoneNumberId", requireAuth, requireTenant, requirePermission("tenant.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();

    const record = await prisma.tenantPhoneNumber.findFirst({
      where: { id: req.params.phoneNumberId, tenantId: req.tenant.id, status: "ACTIVE" },
    });

    if (!record) {
      return res.status(404).json({ ok: false, error: "Phone number not found" });
    }

    await prisma.tenantPhoneNumber.update({
      where: { id: record.id },
      data: { status: "RELEASED", releasedAt: new Date() },
    });

    await Promise.all([
      writeAuditLog(req, {
        action: "addon.phone_number.released",
        entityType: "phone_number",
        entityId: record.id,
        metadata: { phoneNumber: record.phoneNumber },
      }),
      recordAnalyticsEvent(req, {
        eventName: "addon.phone_number.released",
        eventCategory: "addons",
        metadata: { phoneNumberId: record.id },
      }),
    ]);

    return res.json({ ok: true, releasedId: record.id });
  } catch (error) {
    return next(error);
  }
});

// ─── Add-ons: SIP Trunks ────────────────────────────────────────────────────

// POST /current/addons/sip-trunks – Add a SIP trunk configuration
tenantRouter.post("/current/addons/sip-trunks", requireAuth, requireTenant, requirePermission("tenant.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();

    const name = String(req.body?.name || "").trim();
    const host = String(req.body?.host || "").trim();
    const port = Number(req.body?.port) || 5060;
    const transport = String(req.body?.transport || "tls").toLowerCase();

    if (!name) {
      return res.status(400).json({ ok: false, error: "name is required" });
    }

    if (!host) {
      return res.status(400).json({ ok: false, error: "host is required" });
    }

    if (!["udp", "tcp", "tls"].includes(transport)) {
      return res.status(400).json({ ok: false, error: "transport must be udp, tcp, or tls" });
    }

    if (port < 1 || port > 65535) {
      return res.status(400).json({ ok: false, error: "port must be between 1 and 65535" });
    }

    const record = await prisma.tenantSipTrunk.create({
      data: {
        tenantId: req.tenant.id,
        name,
        host,
        port,
        transport,
        username: req.body?.username ? String(req.body.username).trim() : null,
        password: req.body?.password ? encryptSipPassword(String(req.body.password)) : null,
        realm: req.body?.realm ? String(req.body.realm).trim() : null,
        outboundProxy: req.body?.outboundProxy ? String(req.body.outboundProxy).trim() : null,
        status: "ACTIVE",
      },
    });

    await Promise.all([
      writeAuditLog(req, {
        action: "addon.sip_trunk.created",
        entityType: "sip_trunk",
        entityId: record.id,
        metadata: { name, host },
      }),
      recordAnalyticsEvent(req, {
        eventName: "addon.sip_trunk.created",
        eventCategory: "addons",
        metadata: { sipTrunkId: record.id },
      }),
    ]);

    return res.status(201).json({
      ok: true,
      sipTrunk: serializeSipTrunk(record),
    });
  } catch (error) {
    return next(error);
  }
});

// PATCH /current/addons/sip-trunks/:sipTrunkId – Update a SIP trunk
tenantRouter.patch("/current/addons/sip-trunks/:sipTrunkId", requireAuth, requireTenant, requirePermission("tenant.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();

    const record = await prisma.tenantSipTrunk.findFirst({
      where: { id: req.params.sipTrunkId, tenantId: req.tenant.id },
    });

    if (!record) {
      return res.status(404).json({ ok: false, error: "SIP trunk not found" });
    }

    const data = {};
    if (req.body?.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) {
        return res.status(400).json({ ok: false, error: "name must not be empty" });
      }
      data.name = name;
    }
    if (req.body?.host !== undefined) {
      const host = String(req.body.host).trim();
      if (!host) {
        return res.status(400).json({ ok: false, error: "host must not be empty" });
      }
      data.host = host;
    }
    if (req.body?.port !== undefined) {
      const port = Number(req.body.port);
      if (port < 1 || port > 65535) {
        return res.status(400).json({ ok: false, error: "port must be between 1 and 65535" });
      }
      data.port = port;
    }
    if (req.body?.transport !== undefined) {
      const transport = String(req.body.transport).toLowerCase();
      if (!["udp", "tcp", "tls"].includes(transport)) {
        return res.status(400).json({ ok: false, error: "transport must be udp, tcp, or tls" });
      }
      data.transport = transport;
    }
    if (req.body?.username !== undefined) {
      data.username = req.body.username ? String(req.body.username).trim() : null;
    }
    if (req.body?.password !== undefined) {
      data.password = req.body.password ? encryptSipPassword(String(req.body.password)) : null;
    }
    if (req.body?.realm !== undefined) {
      data.realm = req.body.realm ? String(req.body.realm).trim() : null;
    }
    if (req.body?.outboundProxy !== undefined) {
      data.outboundProxy = req.body.outboundProxy ? String(req.body.outboundProxy).trim() : null;
    }
    if (req.body?.status !== undefined) {
      const status = String(req.body.status).toUpperCase();
      if (!["ACTIVE", "DISABLED"].includes(status)) {
        return res.status(400).json({ ok: false, error: "status must be ACTIVE or DISABLED" });
      }
      data.status = status;
    }

    const updated = await prisma.tenantSipTrunk.update({
      where: { id: record.id },
      data,
    });

    await Promise.all([
      writeAuditLog(req, {
        action: "addon.sip_trunk.updated",
        entityType: "sip_trunk",
        entityId: record.id,
        metadata: { updatedFields: Object.keys(data) },
      }),
      recordAnalyticsEvent(req, {
        eventName: "addon.sip_trunk.updated",
        eventCategory: "addons",
        metadata: { sipTrunkId: record.id },
      }),
    ]);

    return res.json({
      ok: true,
      sipTrunk: serializeSipTrunk(updated),
    });
  } catch (error) {
    return next(error);
  }
});

// DELETE /current/addons/sip-trunks/:sipTrunkId – Remove a SIP trunk
tenantRouter.delete("/current/addons/sip-trunks/:sipTrunkId", requireAuth, requireTenant, requirePermission("tenant.manage"), async (req, res, next) => {
  try {
    const prisma = getPrismaClient();

    const record = await prisma.tenantSipTrunk.findFirst({
      where: { id: req.params.sipTrunkId, tenantId: req.tenant.id },
    });

    if (!record) {
      return res.status(404).json({ ok: false, error: "SIP trunk not found" });
    }

    await prisma.tenantSipTrunk.delete({ where: { id: record.id } });

    await Promise.all([
      writeAuditLog(req, {
        action: "addon.sip_trunk.deleted",
        entityType: "sip_trunk",
        entityId: record.id,
        metadata: { name: record.name },
      }),
      recordAnalyticsEvent(req, {
        eventName: "addon.sip_trunk.deleted",
        eventCategory: "addons",
        metadata: { sipTrunkId: record.id },
      }),
    ]);

    return res.json({ ok: true, deletedId: record.id });
  } catch (error) {
    return next(error);
  }
});

function serializePhoneNumber(record) {
  return {
    id: record.id,
    phoneNumber: record.phoneNumber,
    label: record.label,
    provider: record.provider,
    capabilities: record.capabilities,
    status: record.status.toLowerCase(),
    monthlyCostCents: record.monthlyCostCents,
    currency: record.currency,
    provisionedAt: record.provisionedAt,
  };
}

function serializeSipTrunk(record) {
  return {
    id: record.id,
    name: record.name,
    host: record.host,
    port: record.port,
    transport: record.transport,
    username: record.username,
    hasPassword: !!record.password,
    realm: record.realm,
    outboundProxy: record.outboundProxy,
    status: record.status.toLowerCase(),
    createdAt: record.createdAt,
  };
}
