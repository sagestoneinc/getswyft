import { Router } from "express";
import { env } from "../../config/env.js";
import { getPrismaClient } from "../../lib/db.js";
import { recordAnalyticsEvent } from "../../lib/analytics.js";
import { writeAuditLog } from "../../lib/audit.js";
import { createUserNotification } from "../../lib/push.js";
import { startOutboundCall } from "../../lib/telephony.js";
import { emitConversationMessage } from "../../lib/socket-events.js";
import { dispatchTenantWebhookEvent } from "../../lib/webhooks.js";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/rbac.js";
import { requireTenant } from "../../middleware/tenant.js";

export const messagingRouter = Router();
const MANAGED_ROLE_KEYS = ["tenant_admin", "agent"];

function toConversationBucket(conversation, currentUserId) {
  if (conversation.status === "CLOSED") {
    return "closed";
  }

  if (!conversation.assignedUserId) {
    return "unassigned";
  }

  return conversation.assignedUserId === currentUserId ? "mine" : "assigned";
}

function normalizeStatusFilter(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["unassigned", "mine", "closed", "assigned"].includes(normalized)) {
    return normalized;
  }
  return null;
}

function buildConversationWhere({ tenantId, currentUserId, status, query }) {
  const where = {
    tenantId,
  };

  if (status === "closed") {
    where.status = "CLOSED";
  } else if (status === "unassigned") {
    where.status = "OPEN";
    where.assignedUserId = null;
  } else if (status === "mine") {
    where.status = "OPEN";
    where.assignedUserId = currentUserId;
  } else if (status === "assigned") {
    where.status = "OPEN";
    where.assignedUserId = {
      not: null,
    };
  }

  const trimmedQuery = String(query || "").trim();
  if (trimmedQuery) {
    where.OR = [
      { leadName: { contains: trimmedQuery, mode: "insensitive" } },
      { leadEmail: { contains: trimmedQuery, mode: "insensitive" } },
      { leadPhone: { contains: trimmedQuery, mode: "insensitive" } },
      { listingAddress: { contains: trimmedQuery, mode: "insensitive" } },
      { listingMls: { contains: trimmedQuery, mode: "insensitive" } },
      { lastMessagePreview: { contains: trimmedQuery, mode: "insensitive" } },
      { notes: { contains: trimmedQuery, mode: "insensitive" } },
      {
        messages: {
          some: {
            body: { contains: trimmedQuery, mode: "insensitive" },
          },
        },
      },
    ];
  }

  return where;
}

async function getUnreadMap(prisma, tenantId, currentUserId, conversationIds) {
  if (!conversationIds.length) {
    return new Map();
  }

  const unreadMessages = await prisma.conversationMessage.findMany({
    where: {
      conversation: {
        tenantId,
      },
      conversationId: {
        in: conversationIds,
      },
      OR: [
        { senderType: { not: "AGENT" } },
        {
          senderUserId: {
            not: currentUserId,
          },
        },
      ],
      NOT: {
        receipts: {
          some: {
            userId: currentUserId,
            readAt: {
              not: null,
            },
          },
        },
      },
    },
    select: {
      id: true,
      conversationId: true,
    },
  });

  const counts = new Map();
  for (const message of unreadMessages) {
    counts.set(message.conversationId, (counts.get(message.conversationId) || 0) + 1);
  }

  return counts;
}

function aggregateReactionSummary(reactions, currentUserId) {
  const grouped = new Map();

  for (const reaction of reactions) {
    const entry = grouped.get(reaction.emoji) || {
      emoji: reaction.emoji,
      count: 0,
      reacted: false,
    };

    entry.count += 1;
    if (reaction.userId === currentUserId) {
      entry.reacted = true;
    }

    grouped.set(reaction.emoji, entry);
  }

  return Array.from(grouped.values()).sort((left, right) => left.emoji.localeCompare(right.emoji));
}

function serializeMessage(message, currentUserId) {
  const readReceipts = message.receipts.filter((receipt) => receipt.readAt);

  return {
    id: message.id,
    body: message.body,
    sender: message.senderType === "AGENT" ? "agent" : message.senderType === "VISITOR" ? "visitor" : "system",
    senderType: message.senderType.toLowerCase(),
    senderName:
      message.senderUser?.displayName ||
      message.senderUser?.email ||
      (message.senderType === "VISITOR" ? "Visitor" : message.senderType === "SYSTEM" ? "System" : "Agent"),
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    parentMessageId: message.parentMessageId,
    readByCurrentUser: message.receipts.some((receipt) => receipt.userId === currentUserId && Boolean(receipt.readAt)),
    readCount: readReceipts.length,
    reactions: aggregateReactionSummary(message.reactions, currentUserId),
    attachments: message.attachments.map((attachment) => ({
      id: attachment.id,
      storageKey: attachment.storageKey,
      filename: attachment.filename,
      contentType: attachment.contentType,
      sizeBytes: attachment.sizeBytes,
      createdAt: attachment.createdAt,
    })),
  };
}

function serializeConversation(conversation, currentUserId, unreadCount = 0) {
  const bucket = toConversationBucket(conversation, currentUserId);

  return {
    id: conversation.id,
    status: bucket,
    workflowStatus: conversation.status.toLowerCase(),
    assignedTo:
      conversation.assignedUser?.displayName ||
      conversation.assignedUser?.email ||
      null,
    assignedUserId: conversation.assignedUserId,
    afterHours: conversation.afterHours,
    notes: conversation.notes || "",
    unreadCount,
    lastMessage: conversation.lastMessagePreview || "",
    lastMessageAt: conversation.lastMessageAt || conversation.updatedAt,
    lead: {
      name: conversation.leadName,
      email: conversation.leadEmail,
      phone: conversation.leadPhone,
      source: conversation.leadSource,
      utm: conversation.leadUtm,
    },
    listing: {
      address: conversation.listingAddress,
      price: conversation.listingPrice,
      beds: conversation.listingBeds,
      baths: conversation.listingBaths,
      sqft: conversation.listingSqft,
      mls: conversation.listingMls,
    },
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

function normalizeMessageAttachments(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((attachment) => ({
      storageKey: String(attachment?.storageKey || "").trim(),
      filename: String(attachment?.filename || "").trim(),
      contentType: attachment?.contentType ? String(attachment.contentType).trim() : null,
      sizeBytes:
        attachment?.sizeBytes === undefined || attachment?.sizeBytes === null
          ? null
          : Number.isFinite(Number(attachment.sizeBytes))
            ? Number(attachment.sizeBytes)
            : null,
    }))
    .filter((attachment) => attachment.storageKey && attachment.filename)
    .slice(0, 5);
}

async function loadConversationOr404(prisma, tenantId, conversationId) {
  return prisma.conversation.findFirst({
    where: {
      id: conversationId,
      tenantId,
    },
    include: {
      assignedUser: true,
    },
  });
}

messagingRouter.get(
  "/conversations",
  requireAuth,
  requireTenant,
  requirePermission("conversation.read"),
  async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const status = normalizeStatusFilter(req.query.status);
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const currentUserId = req.auth.user.id;

    const where = buildConversationWhere({
      tenantId: req.tenant.id,
      currentUserId,
      status,
      query: req.query.q,
    });

    const [conversations, unassignedCount, mineCount, closedCount] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          assignedUser: true,
        },
        orderBy: [
          { lastMessageAt: "desc" },
          { updatedAt: "desc" },
        ],
        take: limit,
      }),
      prisma.conversation.count({
        where: {
          tenantId: req.tenant.id,
          status: "OPEN",
          assignedUserId: null,
        },
      }),
      prisma.conversation.count({
        where: {
          tenantId: req.tenant.id,
          status: "OPEN",
          assignedUserId: currentUserId,
        },
      }),
      prisma.conversation.count({
        where: {
          tenantId: req.tenant.id,
          status: "CLOSED",
        },
      }),
    ]);

    const unreadMap = await getUnreadMap(
      prisma,
      req.tenant.id,
      currentUserId,
      conversations.map((conversation) => conversation.id),
    );

    return res.json({
      ok: true,
      counts: {
        unassigned: unassignedCount,
        mine: mineCount,
        closed: closedCount,
      },
      conversations: conversations.map((conversation) =>
        serializeConversation(conversation, currentUserId, unreadMap.get(conversation.id) || 0),
      ),
    });
  } catch (error) {
    return next(error);
  }
});

messagingRouter.get(
  "/conversations/:id",
  requireAuth,
  requireTenant,
  requirePermission("conversation.read"),
  async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const conversation = await loadConversationOr404(prisma, req.tenant.id, req.params.id);

    if (!conversation) {
      return res.status(404).json({
        ok: false,
        error: "Conversation not found",
      });
    }

    const unreadMap = await getUnreadMap(prisma, req.tenant.id, req.auth.user.id, [conversation.id]);

    return res.json({
      ok: true,
      conversation: serializeConversation(conversation, req.auth.user.id, unreadMap.get(conversation.id) || 0),
    });
  } catch (error) {
    return next(error);
  }
});

messagingRouter.patch(
  "/conversations/:id",
  requireAuth,
  requireTenant,
  requirePermission("conversation.write"),
  async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const existingConversation = await loadConversationOr404(prisma, req.tenant.id, req.params.id);

    if (!existingConversation) {
      return res.status(404).json({
        ok: false,
        error: "Conversation not found",
      });
    }

    const data = {};
    const previousAssignedUserId = existingConversation.assignedUserId;
    const previousStatus = existingConversation.status;

    if (req.body?.assignToMe === true) {
      data.assignedUserId = req.auth.user.id;
      data.status = "OPEN";
    } else if (req.body?.assignToMe === false) {
      data.assignedUserId = null;
    }

    if (req.body?.assignedUserId !== undefined) {
      const assignedUserId = req.body.assignedUserId ? String(req.body.assignedUserId).trim() : null;

      if (assignedUserId) {
        const assignableMember = await prisma.userRole.findFirst({
          where: {
            tenantId: req.tenant.id,
            userId: assignedUserId,
            role: {
              key: {
                in: MANAGED_ROLE_KEYS,
              },
            },
          },
          select: {
            id: true,
          },
        });

        if (!assignableMember) {
          return res.status(400).json({
            ok: false,
            error: "assignedUserId must belong to an agent or admin in this tenant",
          });
        }
      }

      data.assignedUserId = assignedUserId;
      if (assignedUserId) {
        data.status = "OPEN";
      }
    }

    if (typeof req.body?.status === "string") {
      const normalized = req.body.status.trim().toLowerCase();
      if (normalized === "closed") {
        data.status = "CLOSED";
      } else if (normalized === "open") {
        data.status = "OPEN";
      }
    }

    if (typeof req.body?.notes === "string") {
      data.notes = req.body.notes.trim();
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        ok: false,
        error: "No supported conversation updates were provided",
      });
    }

    const conversation = await prisma.conversation.update({
      where: { id: existingConversation.id },
      data,
      include: {
        assignedUser: true,
      },
    });

    await writeAuditLog(req, {
      action: "conversation.updated",
      entityType: "conversation",
      entityId: conversation.id,
      metadata: data,
    });

    const webhookEvents = [];
    if (previousStatus !== conversation.status) {
      webhookEvents.push(
        conversation.status === "CLOSED" ? "conversation.closed" : "conversation.reopened",
      );
    }

    if (previousAssignedUserId !== conversation.assignedUserId && conversation.assignedUserId) {
      webhookEvents.push(
        previousAssignedUserId && previousAssignedUserId !== conversation.assignedUserId
          ? "conversation.transferred"
          : "conversation.assigned",
      );
    }

    await Promise.all(
      webhookEvents.map((eventType) =>
        dispatchTenantWebhookEvent({
          tenantId: req.tenant.id,
          tenantSlug: req.tenant.slug,
          tenantName: req.tenant.name,
          eventType,
          payload: {
            conversationId: conversation.id,
            assignedUserId: conversation.assignedUserId,
            previousAssignedUserId,
            status: conversation.status,
          },
          requestId: req.context?.requestId,
        }),
      ),
    );

    if (
      previousAssignedUserId !== conversation.assignedUserId &&
      conversation.assignedUserId &&
      conversation.assignedUserId !== req.auth.user.id
    ) {
      await createUserNotification({
        tenantId: req.tenant.id,
        userId: conversation.assignedUserId,
        type:
          previousAssignedUserId && previousAssignedUserId !== conversation.assignedUserId
            ? "conversation.transferred"
            : "conversation.assigned",
        title:
          previousAssignedUserId && previousAssignedUserId !== conversation.assignedUserId
            ? "Conversation transferred to you"
            : "Conversation assigned to you",
        body: `${existingConversation.leadName} at ${existingConversation.listingAddress} is now in your queue.`,
        payload: {
          conversationId: conversation.id,
        },
        link: `${req.header("origin") || env.APP_BASE_URL.replace(/\/$/, "")}/app/conversation/${conversation.id}`,
      });
    }

    const unreadMap = await getUnreadMap(prisma, req.tenant.id, req.auth.user.id, [conversation.id]);

    return res.json({
      ok: true,
      conversation: serializeConversation(conversation, req.auth.user.id, unreadMap.get(conversation.id) || 0),
    });
  } catch (error) {
    return next(error);
  }
});

messagingRouter.get(
  "/conversations/:id/messages",
  requireAuth,
  requireTenant,
  requirePermission("conversation.read"),
  async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const conversation = await loadConversationOr404(prisma, req.tenant.id, req.params.id);

    if (!conversation) {
      return res.status(404).json({
        ok: false,
        error: "Conversation not found",
      });
    }

    const limit = Math.min(Number(req.query.limit) || 200, 500);
    const messages = await prisma.conversationMessage.findMany({
      where: {
        conversationId: conversation.id,
      },
      include: {
        senderUser: true,
        reactions: true,
        receipts: true,
        attachments: true,
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    return res.json({
      ok: true,
      messages: messages.map((message) => serializeMessage(message, req.auth.user.id)),
    });
  } catch (error) {
    return next(error);
  }
});

messagingRouter.post(
  "/conversations/:id/call",
  requireAuth,
  requireTenant,
  requirePermission("conversation.write"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();
      const conversation = await loadConversationOr404(prisma, req.tenant.id, req.params.id);

      if (!conversation) {
        return res.status(404).json({
          ok: false,
          error: "Conversation not found",
        });
      }

      if (!conversation.leadPhone) {
        return res.status(400).json({
          ok: false,
          error: "Lead phone is not available for this conversation",
        });
      }

      const call = await startOutboundCall({
        to: conversation.leadPhone,
      });

      await Promise.all([
        writeAuditLog(req, {
          action: "conversation.call_started",
          entityType: "conversation",
          entityId: conversation.id,
          metadata: {
            provider: env.TELEPHONY_PROVIDER,
            to: conversation.leadPhone,
          },
        }),
        recordAnalyticsEvent(req, {
          eventName: "conversation.call_started",
          eventCategory: "call",
          metadata: {
            conversationId: conversation.id,
            provider: env.TELEPHONY_PROVIDER,
          },
        }),
      ]);

      return res.status(201).json({
        ok: true,
        call: {
          provider: env.TELEPHONY_PROVIDER,
          to: conversation.leadPhone,
          externalCallId: call?.data?.call_control_id || call?.data?.call_leg_id || null,
        },
      });
    } catch (error) {
      return next(error);
    }
  },
);

messagingRouter.post(
  "/conversations/:id/messages",
  requireAuth,
  requireTenant,
  requirePermission("conversation.write"),
  async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const conversation = await loadConversationOr404(prisma, req.tenant.id, req.params.id);

    if (!conversation) {
      return res.status(404).json({
        ok: false,
        error: "Conversation not found",
      });
    }

    const body = String(req.body?.body || "").trim();
    const attachments = normalizeMessageAttachments(req.body?.attachments);

    if (!body && attachments.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "Message body or attachments are required",
      });
    }

    const parentMessageId = req.body?.parentMessageId ? String(req.body.parentMessageId) : null;
    if (parentMessageId) {
      const parent = await prisma.conversationMessage.findFirst({
        where: {
          id: parentMessageId,
          conversationId: conversation.id,
        },
        select: { id: true },
      });

      if (!parent) {
        return res.status(400).json({
          ok: false,
          error: "parentMessageId is not part of this conversation",
        });
      }
    }

    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.conversationMessage.create({
        data: {
          conversationId: conversation.id,
          senderType: "AGENT",
          senderUserId: req.auth.user.id,
          parentMessageId,
          body: body || "Shared attachments",
          ...(attachments.length
            ? {
                attachments: {
                  create: attachments,
                },
              }
            : {}),
        },
        include: {
          senderUser: true,
          reactions: true,
          receipts: true,
          attachments: true,
        },
      });

      await tx.messageReceipt.create({
        data: {
          messageId: created.id,
          userId: req.auth.user.id,
          deliveredAt: new Date(),
          readAt: new Date(),
        },
      });

      await tx.conversation.update({
        where: { id: conversation.id },
        data: {
          status: "OPEN",
          lastMessagePreview: body || `Shared ${attachments.length} attachment${attachments.length === 1 ? "" : "s"}`,
          lastMessageAt: created.createdAt,
          assignedUserId: conversation.assignedUserId || req.auth.user.id,
        },
      });

      return tx.conversationMessage.findUnique({
        where: { id: created.id },
        include: {
          senderUser: true,
          reactions: true,
          receipts: true,
          attachments: true,
        },
      });
    });

    await Promise.all([
      writeAuditLog(req, {
        action: "conversation.message_sent",
        entityType: "conversation_message",
        entityId: message.id,
        metadata: {
          conversationId: conversation.id,
          parentMessageId,
        },
      }),
      recordAnalyticsEvent(req, {
        eventName: "conversation.message_sent",
        eventCategory: "message",
        metadata: {
          conversationId: conversation.id,
          senderType: "agent",
          parentMessageId,
          attachmentCount: attachments.length,
        },
      }),
      dispatchTenantWebhookEvent({
        tenantId: req.tenant.id,
        tenantSlug: req.tenant.slug,
        tenantName: req.tenant.name,
        eventType: "message.sent",
        payload: {
          conversationId: conversation.id,
          messageId: message.id,
          senderUserId: req.auth.user.id,
          attachmentCount: attachments.length,
        },
        requestId: req.context?.requestId,
      }),
    ]);

    const io = req.app.get("io");
    if (io) {
      emitConversationMessage(io, {
        tenantId: req.tenant.id,
        conversationId: conversation.id,
        message,
      });
    }

    if (conversation.assignedUserId && conversation.assignedUserId !== req.auth.user.id) {
      await createUserNotification({
        tenantId: req.tenant.id,
        userId: conversation.assignedUserId,
        type: "conversation.message_sent",
        title: "New activity in an assigned conversation",
        body: `${req.auth.user.displayName || req.auth.user.email} sent an update to ${conversation.leadName}.`,
        payload: {
          conversationId: conversation.id,
          messageId: message.id,
        },
        link: `${req.header("origin") || env.APP_BASE_URL.replace(/\/$/, "")}/app/conversation/${conversation.id}`,
      });
    }

    return res.status(201).json({
      ok: true,
      message: serializeMessage(message, req.auth.user.id),
    });
  } catch (error) {
    return next(error);
  }
});

messagingRouter.post(
  "/conversations/:id/read",
  requireAuth,
  requireTenant,
  requirePermission("conversation.read"),
  async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const conversation = await loadConversationOr404(prisma, req.tenant.id, req.params.id);

    if (!conversation) {
      return res.status(404).json({
        ok: false,
        error: "Conversation not found",
      });
    }

    const messages = await prisma.conversationMessage.findMany({
      where: {
        conversationId: conversation.id,
        OR: [
          { senderType: { not: "AGENT" } },
          {
            senderUserId: {
              not: req.auth.user.id,
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    const timestamp = new Date();
    await prisma.$transaction(
      messages.map((message) =>
        prisma.messageReceipt.upsert({
          where: {
            messageId_userId: {
              messageId: message.id,
              userId: req.auth.user.id,
            },
          },
          update: {
            deliveredAt: timestamp,
            readAt: timestamp,
          },
          create: {
            messageId: message.id,
            userId: req.auth.user.id,
            deliveredAt: timestamp,
            readAt: timestamp,
          },
        }),
      ),
    );

    return res.json({
      ok: true,
      updatedCount: messages.length,
      readAt: timestamp,
    });
  } catch (error) {
    return next(error);
  }
});

messagingRouter.post(
  "/messages/:id/reactions",
  requireAuth,
  requireTenant,
  requirePermission("conversation.write"),
  async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const emoji = String(req.body?.emoji || "").trim();

    if (!emoji) {
      return res.status(400).json({
        ok: false,
        error: "emoji is required",
      });
    }

    const message = await prisma.conversationMessage.findFirst({
      where: {
        id: req.params.id,
        conversation: {
          tenantId: req.tenant.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!message) {
      return res.status(404).json({
        ok: false,
        error: "Message not found",
      });
    }

    const existingReaction = await prisma.messageReaction.findFirst({
      where: {
        messageId: message.id,
        userId: req.auth.user.id,
        emoji,
      },
      select: {
        id: true,
      },
    });

    if (existingReaction) {
      await prisma.messageReaction.delete({
        where: { id: existingReaction.id },
      });
    } else {
      await prisma.messageReaction.create({
        data: {
          messageId: message.id,
          userId: req.auth.user.id,
          emoji,
        },
      });
    }

    const updatedMessage = await prisma.conversationMessage.findUnique({
      where: { id: message.id },
      include: {
        senderUser: true,
        reactions: true,
        receipts: true,
        attachments: true,
      },
    });

    return res.json({
      ok: true,
      action: existingReaction ? "removed" : "added",
      message: serializeMessage(updatedMessage, req.auth.user.id),
    });
  } catch (error) {
    return next(error);
  }
});
