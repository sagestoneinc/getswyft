import { Router } from "express";
import { getPrismaClient } from "../../lib/db.js";
import { writeAuditLog } from "../../lib/audit.js";
import { recordAnalyticsEvent } from "../../lib/analytics.js";
import { emitConversationMessage } from "../../lib/socket-events.js";
import { extractBearerToken } from "../../lib/auth-tokens.js";
import { signVisitorAccessToken, verifyInternalAccessToken } from "../../lib/internal-tokens.js";
import { widgetRateLimit } from "../../lib/rate-limit.js";

export const widgetRouter = Router();

function toCleanString(value, fallback = "") {
  const result = String(value || "").trim();
  return result || fallback;
}

function toOptionalString(value) {
  const result = String(value || "").trim();
  return result || null;
}

function toOptionalNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseTime(value, fallbackMinutes) {
  const match = String(value || "").match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    return fallbackMinutes;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

function isAfterHours(settings) {
  if (!settings?.officeHoursEnabled) {
    return false;
  }

  const timezone = settings.timezone || "UTC";
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });

  const parts = formatter.formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour")?.value || "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value || "0");
  const currentMinutes = hour * 60 + minute;
  const startMinutes = parseTime(settings.officeHoursStart, 9 * 60);
  const endMinutes = parseTime(settings.officeHoursEnd, 18 * 60);

  return currentMinutes < startMinutes || currentMinutes >= endMinutes;
}

async function resolveTenant(prisma, tenantId, tenantSlug) {
  if (tenantId) {
    return prisma.tenant.findUnique({ where: { id: tenantId } });
  }

  if (tenantSlug) {
    return prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  }

  return prisma.tenant.findFirst({
    orderBy: { createdAt: "asc" },
  });
}

async function requireVisitorAccess(req, res) {
  const token = extractBearerToken(req.header("authorization"));
  if (!token) {
    res.status(401).json({ ok: false, error: "Visitor token is required" });
    return null;
  }

  try {
    return await verifyInternalAccessToken(token);
  } catch (_error) {
    res.status(401).json({ ok: false, error: "Visitor token is invalid or expired" });
    return null;
  }
}

widgetRouter.post("/session", widgetRateLimit, async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const tenantId = toOptionalString(req.body?.tenantId);
    const tenantSlug = toOptionalString(req.body?.tenantSlug);
    const lead = req.body?.lead && typeof req.body.lead === "object" ? req.body.lead : {};
    const listing = req.body?.listing && typeof req.body.listing === "object" ? req.body.listing : {};
    const pageUrl = toOptionalString(req.body?.pageUrl);

    const tenant = await resolveTenant(prisma, tenantId, tenantSlug);
    if (!tenant) {
      return res.status(404).json({
        ok: false,
        error: "Tenant not found",
      });
    }

    req.tenant = tenant;

    const routingSettings = await prisma.tenantRoutingSettings.findUnique({
      where: { tenantId: tenant.id },
    });
    const afterHours = isAfterHours(routingSettings);

    const conversation = await prisma.conversation.create({
      data: {
        tenantId: tenant.id,
        leadName: toCleanString(lead.name, "Website visitor"),
        leadEmail: toOptionalString(lead.email),
        leadPhone: toOptionalString(lead.phone),
        leadSource: "widget",
        leadUtm: pageUrl,
        listingAddress: toCleanString(listing.address || listing.url || pageUrl, "Website inquiry"),
        listingPrice: toCleanString(listing.price, "Undisclosed"),
        listingBeds: toOptionalNumber(listing.beds),
        listingBaths: toOptionalNumber(listing.baths),
        listingSqft: toOptionalNumber(listing.sqft),
        listingMls: toOptionalString(listing.mls),
        afterHours,
        notes: pageUrl ? `Widget session created from ${pageUrl}` : null,
      },
    });

    const visitorJwt = await signVisitorAccessToken({
      tenantId: tenant.id,
      conversationId: conversation.id,
      leadName: conversation.leadName,
      leadEmail: conversation.leadEmail,
    });

    await Promise.all([
      writeAuditLog(req, {
        action: "widget.session_created",
        entityType: "conversation",
        entityId: conversation.id,
        metadata: {
          pageUrl,
          afterHours,
        },
      }),
      recordAnalyticsEvent(req, {
        eventName: "widget.session_created",
        eventCategory: "widget",
        metadata: {
          conversationId: conversation.id,
          afterHours,
        },
      }),
    ]);

    return res.status(201).json({
      ok: true,
      visitorJwt,
      visitorId: `visitor:${conversation.id}`,
      conversationId: conversation.id,
      afterHours,
    });
  } catch (error) {
    return next(error);
  }
});

widgetRouter.post("/conversations/:id/messages", widgetRateLimit, async (req, res, next) => {
  try {
    const claims = await requireVisitorAccess(req, res);
    if (!claims) {
      return;
    }

    const conversationId = String(req.params.id);
    if (claims.conversation_id !== conversationId) {
      return res.status(403).json({
        ok: false,
        error: "Visitor token does not match this conversation",
      });
    }

    const prisma = getPrismaClient();
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        tenantId: claims.tenant_id,
      },
    });

    if (!conversation) {
      return res.status(404).json({
        ok: false,
        error: "Conversation not found",
      });
    }

    req.tenant = { id: conversation.tenantId };

    const body = toCleanString(req.body?.body || req.body?.text);
    if (!body) {
      return res.status(400).json({
        ok: false,
        error: "Message body is required",
      });
    }

    const clientMsgId = toOptionalString(req.body?.clientMsgId);

    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.conversationMessage.create({
        data: {
          conversationId: conversation.id,
          senderType: "VISITOR",
          body,
          metadata: clientMsgId ? { clientMsgId } : null,
        },
      });

      await tx.conversation.update({
        where: { id: conversation.id },
        data: {
          status: "OPEN",
          lastMessagePreview: body,
          lastMessageAt: created.createdAt,
        },
      });

      return created;
    });

    message.clientMsgId = clientMsgId;

    const io = req.app.get("io");
    if (io) {
      emitConversationMessage(io, {
        tenantId: conversation.tenantId,
        conversationId: conversation.id,
        message,
      });
    }

    await Promise.all([
      writeAuditLog(req, {
        action: "widget.message_sent",
        entityType: "conversation_message",
        entityId: message.id,
        metadata: {
          conversationId: conversation.id,
        },
      }),
      recordAnalyticsEvent(req, {
        eventName: "widget.message_sent",
        eventCategory: "widget",
        metadata: {
          conversationId: conversation.id,
        },
      }),
    ]);

    return res.status(201).json({
      ok: true,
      message: {
        id: message.id,
        body: message.body,
        senderType: "visitor",
        createdAt: message.createdAt,
      },
    });
  } catch (error) {
    return next(error);
  }
});
