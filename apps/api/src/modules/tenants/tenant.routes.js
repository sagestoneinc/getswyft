import crypto from "node:crypto";
import { Router } from "express";
import { getPrismaClient } from "../../lib/db.js";
import { recordAnalyticsEvent } from "../../lib/analytics.js";
import { writeAuditLog } from "../../lib/audit.js";
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
    branding,
    featureFlags: featureFlags.map((flag) => ({
      key: flag.key,
      enabled: flag.enabled,
      config: flag.config,
    })),
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

    if (requestedPrimaryColor && !/^#?[0-9a-fA-F]{6}$/.test(requestedPrimaryColor)) {
      return res.status(400).json({
        ok: false,
        error: "primaryColor must be a valid 6-digit hex value",
      });
    }

    const supportEmail = requestedSupportEmail || req.auth.user.email;
    const primaryColor = requestedPrimaryColor
      ? requestedPrimaryColor.startsWith("#")
        ? requestedPrimaryColor
        : `#${requestedPrimaryColor}`
      : "#14b8a6";

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
