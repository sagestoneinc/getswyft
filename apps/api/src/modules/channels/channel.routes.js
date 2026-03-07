import { Router } from "express";
import { getPrismaClient } from "../../lib/db.js";
import { writeAuditLog } from "../../lib/audit.js";
import { recordAnalyticsEvent } from "../../lib/analytics.js";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/rbac.js";
import { requireTenant } from "../../middleware/tenant.js";

export const channelRouter = Router();

const VALID_CHANNEL_TYPES = ["PUBLIC", "PRIVATE", "DIRECT"];
const DEFAULT_PAGE_LIMIT = 50;
const MAX_PAGE_LIMIT = 100;

function generateSlug(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
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

function serializeChannelMessage(message, currentUserId) {
  return {
    id: message.id,
    channelId: message.channelId,
    body: message.body,
    senderUserId: message.senderUserId,
    senderName:
      message.senderUser?.displayName ||
      message.senderUser?.email ||
      null,
    parentMessageId: message.parentMessageId,
    metadata: message.metadata,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    reactions: aggregateReactionSummary(message.reactions, currentUserId),
  };
}

// GET / — List channels for the current tenant
channelRouter.get(
  "/",
  requireAuth,
  requireTenant,
  requirePermission("conversation.read"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const channels = await prisma.channel.findMany({
        where: { tenantId: req.tenant.id },
        include: {
          _count: {
            select: { members: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return res.json({
        ok: true,
        channels: channels.map((channel) => ({
          id: channel.id,
          name: channel.name,
          slug: channel.slug,
          type: channel.type,
          description: channel.description,
          topic: channel.topic,
          isArchived: channel.isArchived,
          createdByUserId: channel.createdByUserId,
          memberCount: channel._count.members,
          createdAt: channel.createdAt,
          updatedAt: channel.updatedAt,
        })),
      });
    } catch (error) {
      return next(error);
    }
  },
);

// POST / — Create a channel
channelRouter.post(
  "/",
  requireAuth,
  requireTenant,
  requirePermission("conversation.write"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();
      const name = String(req.body?.name || "").trim();

      if (!name) {
        return res.status(400).json({
          ok: false,
          error: "name is required",
        });
      }

      const slug = generateSlug(name);
      if (!slug) {
        return res.status(400).json({
          ok: false,
          error: "name must contain at least one alphanumeric character",
        });
      }

      const existingChannel = await prisma.channel.findUnique({
        where: {
          tenantId_slug: {
            tenantId: req.tenant.id,
            slug,
          },
        },
        select: { id: true },
      });

      if (existingChannel) {
        return res.status(400).json({
          ok: false,
          error: "A channel with this name already exists",
        });
      }

      const type = String(req.body?.type || "PUBLIC").trim().toUpperCase();
      const description = req.body?.description ? String(req.body.description).trim() : null;

      const channel = await prisma.channel.create({
        data: {
          tenantId: req.tenant.id,
          name,
          slug,
          type: VALID_CHANNEL_TYPES.includes(type) ? type : "PUBLIC",
          description,
          createdByUserId: req.auth.user.id,
          members: {
            create: {
              userId: req.auth.user.id,
              role: "owner",
            },
          },
        },
        include: {
          _count: {
            select: { members: true },
          },
        },
      });

      await Promise.all([
        writeAuditLog(req, {
          action: "channel.created",
          entityType: "channel",
          entityId: channel.id,
          metadata: { name, slug, type: channel.type },
        }),
        recordAnalyticsEvent(req, {
          eventName: "channel.created",
          eventCategory: "channel",
          metadata: { channelId: channel.id, type: channel.type },
        }),
      ]);

      return res.status(201).json({
        ok: true,
        channel: {
          id: channel.id,
          name: channel.name,
          slug: channel.slug,
          type: channel.type,
          description: channel.description,
          topic: channel.topic,
          isArchived: channel.isArchived,
          createdByUserId: channel.createdByUserId,
          memberCount: channel._count.members,
          createdAt: channel.createdAt,
          updatedAt: channel.updatedAt,
        },
      });
    } catch (error) {
      return next(error);
    }
  },
);

// GET /:channelId — Get channel details with members list
channelRouter.get(
  "/:channelId",
  requireAuth,
  requireTenant,
  requirePermission("conversation.read"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const channel = await prisma.channel.findFirst({
        where: {
          id: req.params.channelId,
          tenantId: req.tenant.id,
        },
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!channel) {
        return res.status(404).json({
          ok: false,
          error: "Channel not found",
        });
      }

      return res.json({
        ok: true,
        channel: {
          id: channel.id,
          name: channel.name,
          slug: channel.slug,
          type: channel.type,
          description: channel.description,
          topic: channel.topic,
          isArchived: channel.isArchived,
          createdByUserId: channel.createdByUserId,
          createdAt: channel.createdAt,
          updatedAt: channel.updatedAt,
          members: channel.members.map((member) => ({
            id: member.id,
            userId: member.userId,
            role: member.role,
            displayName: member.user?.displayName || member.user?.email || null,
            email: member.user?.email || null,
            joinedAt: member.joinedAt,
          })),
        },
      });
    } catch (error) {
      return next(error);
    }
  },
);

// PATCH /:channelId — Update channel
channelRouter.patch(
  "/:channelId",
  requireAuth,
  requireTenant,
  requirePermission("conversation.write"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const channel = await prisma.channel.findFirst({
        where: {
          id: req.params.channelId,
          tenantId: req.tenant.id,
        },
        include: {
          members: {
            where: { userId: req.auth.user.id },
            select: { role: true },
          },
        },
      });

      if (!channel) {
        return res.status(404).json({
          ok: false,
          error: "Channel not found",
        });
      }

      const isTenantAdmin = (req.auth.activeTenant?.roleKeys || []).includes("tenant_admin");
      const memberRole = channel.members[0]?.role;
      const isChannelOwnerOrAdmin = memberRole === "owner" || memberRole === "admin";

      if (!isTenantAdmin && !isChannelOwnerOrAdmin) {
        return res.status(403).json({
          ok: false,
          error: "Only channel owners, channel admins, or tenant admins can update this channel",
        });
      }

      const data = {};

      if (typeof req.body?.name === "string") {
        data.name = req.body.name.trim();
      }

      if (typeof req.body?.description === "string") {
        data.description = req.body.description.trim();
      }

      if (typeof req.body?.topic === "string") {
        data.topic = req.body.topic.trim();
      }

      if (typeof req.body?.isArchived === "boolean") {
        data.isArchived = req.body.isArchived;
      }

      if (Object.keys(data).length === 0) {
        return res.status(400).json({
          ok: false,
          error: "No supported channel updates were provided",
        });
      }

      const updated = await prisma.channel.update({
        where: { id: channel.id },
        data,
        include: {
          _count: {
            select: { members: true },
          },
        },
      });

      await writeAuditLog(req, {
        action: "channel.updated",
        entityType: "channel",
        entityId: channel.id,
        metadata: data,
      });

      return res.json({
        ok: true,
        channel: {
          id: updated.id,
          name: updated.name,
          slug: updated.slug,
          type: updated.type,
          description: updated.description,
          topic: updated.topic,
          isArchived: updated.isArchived,
          createdByUserId: updated.createdByUserId,
          memberCount: updated._count.members,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        },
      });
    } catch (error) {
      return next(error);
    }
  },
);

// POST /:channelId/members — Add a member to the channel
channelRouter.post(
  "/:channelId/members",
  requireAuth,
  requireTenant,
  requirePermission("conversation.write"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const channel = await prisma.channel.findFirst({
        where: {
          id: req.params.channelId,
          tenantId: req.tenant.id,
        },
        select: { id: true },
      });

      if (!channel) {
        return res.status(404).json({
          ok: false,
          error: "Channel not found",
        });
      }

      const userId = String(req.body?.userId || "").trim();
      if (!userId) {
        return res.status(400).json({
          ok: false,
          error: "userId is required",
        });
      }

      const existingMember = await prisma.channelMember.findUnique({
        where: {
          channelId_userId: {
            channelId: channel.id,
            userId,
          },
        },
        select: { id: true },
      });

      if (existingMember) {
        return res.status(400).json({
          ok: false,
          error: "User is already a member of this channel",
        });
      }

      const role = String(req.body?.role || "member").trim().toLowerCase();

      const member = await prisma.channelMember.create({
        data: {
          channelId: channel.id,
          userId,
          role,
        },
        include: {
          user: true,
        },
      });

      await Promise.all([
        writeAuditLog(req, {
          action: "channel.member_added",
          entityType: "channel_member",
          entityId: member.id,
          metadata: { channelId: channel.id, userId, role },
        }),
        recordAnalyticsEvent(req, {
          eventName: "channel.member_added",
          eventCategory: "channel",
          metadata: { channelId: channel.id, userId },
        }),
      ]);

      return res.status(201).json({
        ok: true,
        member: {
          id: member.id,
          userId: member.userId,
          role: member.role,
          displayName: member.user?.displayName || member.user?.email || null,
          email: member.user?.email || null,
          joinedAt: member.joinedAt,
        },
      });
    } catch (error) {
      return next(error);
    }
  },
);

// DELETE /:channelId/members/:userId — Remove a member from the channel
channelRouter.delete(
  "/:channelId/members/:userId",
  requireAuth,
  requireTenant,
  requirePermission("conversation.write"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const channel = await prisma.channel.findFirst({
        where: {
          id: req.params.channelId,
          tenantId: req.tenant.id,
        },
        select: { id: true },
      });

      if (!channel) {
        return res.status(404).json({
          ok: false,
          error: "Channel not found",
        });
      }

      const member = await prisma.channelMember.findUnique({
        where: {
          channelId_userId: {
            channelId: channel.id,
            userId: req.params.userId,
          },
        },
        select: { id: true },
      });

      if (!member) {
        return res.status(404).json({
          ok: false,
          error: "Member not found in this channel",
        });
      }

      await prisma.channelMember.delete({
        where: { id: member.id },
      });

      await Promise.all([
        writeAuditLog(req, {
          action: "channel.member_removed",
          entityType: "channel_member",
          entityId: member.id,
          metadata: { channelId: channel.id, userId: req.params.userId },
        }),
        recordAnalyticsEvent(req, {
          eventName: "channel.member_removed",
          eventCategory: "channel",
          metadata: { channelId: channel.id, userId: req.params.userId },
        }),
      ]);

      return res.json({
        ok: true,
        removedUserId: req.params.userId,
      });
    } catch (error) {
      return next(error);
    }
  },
);

// GET /:channelId/messages — List messages in a channel with pagination
channelRouter.get(
  "/:channelId/messages",
  requireAuth,
  requireTenant,
  requirePermission("conversation.read"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const channel = await prisma.channel.findFirst({
        where: {
          id: req.params.channelId,
          tenantId: req.tenant.id,
        },
        select: { id: true },
      });

      if (!channel) {
        return res.status(404).json({
          ok: false,
          error: "Channel not found",
        });
      }

      const limit = Math.min(Number(req.query.limit) || DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT);
      const cursor = req.query.cursor ? String(req.query.cursor) : undefined;

      const findArgs = {
        where: { channelId: channel.id },
        include: {
          senderUser: true,
          reactions: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
      };

      if (cursor) {
        findArgs.cursor = { id: cursor };
        findArgs.skip = 1;
      }

      const messages = await prisma.channelMessage.findMany(findArgs);

      const hasMore = messages.length > limit;
      if (hasMore) {
        messages.pop();
      }

      return res.json({
        ok: true,
        messages: messages.map((message) => serializeChannelMessage(message, req.auth.user.id)),
        nextCursor: hasMore ? messages[messages.length - 1].id : null,
      });
    } catch (error) {
      return next(error);
    }
  },
);

// POST /:channelId/messages — Send a message to a channel
channelRouter.post(
  "/:channelId/messages",
  requireAuth,
  requireTenant,
  requirePermission("conversation.write"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const channel = await prisma.channel.findFirst({
        where: {
          id: req.params.channelId,
          tenantId: req.tenant.id,
        },
        select: { id: true },
      });

      if (!channel) {
        return res.status(404).json({
          ok: false,
          error: "Channel not found",
        });
      }

      const body = String(req.body?.body || "").trim();
      if (!body) {
        return res.status(400).json({
          ok: false,
          error: "body is required",
        });
      }

      const parentMessageId = req.body?.parentMessageId ? String(req.body.parentMessageId) : null;
      if (parentMessageId) {
        const parent = await prisma.channelMessage.findFirst({
          where: {
            id: parentMessageId,
            channelId: channel.id,
          },
          select: { id: true },
        });

        if (!parent) {
          return res.status(400).json({
            ok: false,
            error: "parentMessageId is not part of this channel",
          });
        }
      }

      const message = await prisma.channelMessage.create({
        data: {
          channelId: channel.id,
          senderUserId: req.auth.user.id,
          parentMessageId,
          body,
        },
        include: {
          senderUser: true,
          reactions: true,
        },
      });

      await Promise.all([
        writeAuditLog(req, {
          action: "channel.message_sent",
          entityType: "channel_message",
          entityId: message.id,
          metadata: {
            channelId: channel.id,
            parentMessageId,
          },
        }),
        recordAnalyticsEvent(req, {
          eventName: "channel.message_sent",
          eventCategory: "message",
          metadata: {
            channelId: channel.id,
            parentMessageId,
          },
        }),
      ]);

      return res.status(201).json({
        ok: true,
        message: serializeChannelMessage(message, req.auth.user.id),
      });
    } catch (error) {
      return next(error);
    }
  },
);

// POST /:channelId/messages/:messageId/reactions — Toggle reaction on a message
channelRouter.post(
  "/:channelId/messages/:messageId/reactions",
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

      const message = await prisma.channelMessage.findFirst({
        where: {
          id: req.params.messageId,
          channelId: req.params.channelId,
          channel: {
            tenantId: req.tenant.id,
          },
        },
        select: { id: true },
      });

      if (!message) {
        return res.status(404).json({
          ok: false,
          error: "Message not found",
        });
      }

      const existingReaction = await prisma.channelMessageReaction.findUnique({
        where: {
          messageId_userId_emoji: {
            messageId: message.id,
            userId: req.auth.user.id,
            emoji,
          },
        },
        select: { id: true },
      });

      if (existingReaction) {
        await prisma.channelMessageReaction.delete({
          where: { id: existingReaction.id },
        });
      } else {
        await prisma.channelMessageReaction.create({
          data: {
            messageId: message.id,
            userId: req.auth.user.id,
            emoji,
          },
        });
      }

      const updatedMessage = await prisma.channelMessage.findUnique({
        where: { id: message.id },
        include: {
          senderUser: true,
          reactions: true,
        },
      });

      return res.json({
        ok: true,
        action: existingReaction ? "removed" : "added",
        message: serializeChannelMessage(updatedMessage, req.auth.user.id),
      });
    } catch (error) {
      return next(error);
    }
  },
);
