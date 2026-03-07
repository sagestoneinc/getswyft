import { Router } from "express";
import { getPrismaClient } from "../../lib/db.js";
import { writeAuditLog } from "../../lib/audit.js";
import { recordAnalyticsEvent } from "../../lib/analytics.js";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/rbac.js";
import { requireTenant } from "../../middleware/tenant.js";

export const feedRouter = Router();

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

// GET / – List posts for the tenant
feedRouter.get(
  "/",
  requireAuth,
  requireTenant,
  requirePermission("conversation.read"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();
      const currentUserId = req.auth.user.id;
      const limit = Math.min(Number(req.query.limit) || 50, 100);

      const posts = await prisma.post.findMany({
        where: {
          tenantId: req.tenant.id,
          OR: [
            { visibility: "TEAM" },
            { visibility: "PUBLIC" },
            { visibility: "PRIVATE", authorUserId: currentUserId },
          ],
        },
        include: {
          _count: { select: { comments: true } },
          reactions: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return res.json({
        ok: true,
        posts: posts.map((post) => ({
          id: post.id,
          body: post.body,
          mediaUrls: post.mediaUrls,
          visibility: post.visibility,
          isPinned: post.isPinned,
          authorUserId: post.authorUserId,
          commentCount: post._count.comments,
          reactions: aggregateReactionSummary(post.reactions, currentUserId),
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        })),
      });
    } catch (error) {
      return next(error);
    }
  },
);

// POST / – Create a post
feedRouter.post(
  "/",
  requireAuth,
  requireTenant,
  requirePermission("conversation.write"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();
      const body = String(req.body?.body || "").trim();

      if (!body) {
        return res.status(400).json({
          ok: false,
          error: "Post body is required",
        });
      }

      const mediaUrls = Array.isArray(req.body?.mediaUrls)
        ? req.body.mediaUrls.filter((url) => typeof url === "string" && url.trim()).map((url) => url.trim())
        : [];

      const visibility = ["TEAM", "PUBLIC", "PRIVATE"].includes(req.body?.visibility)
        ? req.body.visibility
        : "TEAM";

      const post = await prisma.post.create({
        data: {
          tenantId: req.tenant.id,
          authorUserId: req.auth.user.id,
          body,
          mediaUrls,
          visibility,
        },
      });

      await Promise.all([
        writeAuditLog(req, {
          action: "post.created",
          entityType: "post",
          entityId: post.id,
          metadata: { visibility },
        }),
        recordAnalyticsEvent(req, {
          eventName: "post.created",
          eventCategory: "feed",
          metadata: { postId: post.id, visibility },
        }),
      ]);

      return res.status(201).json({
        ok: true,
        post: {
          id: post.id,
          body: post.body,
          mediaUrls: post.mediaUrls,
          visibility: post.visibility,
          isPinned: post.isPinned,
          authorUserId: post.authorUserId,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        },
      });
    } catch (error) {
      return next(error);
    }
  },
);

// GET /:postId – Get post details with comments and reactions
feedRouter.get(
  "/:postId",
  requireAuth,
  requireTenant,
  requirePermission("conversation.read"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();
      const currentUserId = req.auth.user.id;

      const post = await prisma.post.findFirst({
        where: {
          id: req.params.postId,
          tenantId: req.tenant.id,
        },
        include: {
          comments: {
            orderBy: { createdAt: "asc" },
          },
          reactions: true,
        },
      });

      if (!post) {
        return res.status(404).json({
          ok: false,
          error: "Post not found",
        });
      }

      if (post.visibility === "PRIVATE" && post.authorUserId !== currentUserId) {
        return res.status(404).json({
          ok: false,
          error: "Post not found",
        });
      }

      return res.json({
        ok: true,
        post: {
          id: post.id,
          body: post.body,
          mediaUrls: post.mediaUrls,
          visibility: post.visibility,
          isPinned: post.isPinned,
          authorUserId: post.authorUserId,
          reactions: aggregateReactionSummary(post.reactions, currentUserId),
          comments: post.comments.map((comment) => ({
            id: comment.id,
            body: comment.body,
            authorUserId: comment.authorUserId,
            parentCommentId: comment.parentCommentId,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
          })),
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        },
      });
    } catch (error) {
      return next(error);
    }
  },
);

// PATCH /:postId – Update a post (author only)
feedRouter.patch(
  "/:postId",
  requireAuth,
  requireTenant,
  requirePermission("conversation.write"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const existingPost = await prisma.post.findFirst({
        where: {
          id: req.params.postId,
          tenantId: req.tenant.id,
        },
      });

      if (!existingPost) {
        return res.status(404).json({
          ok: false,
          error: "Post not found",
        });
      }

      if (existingPost.authorUserId !== req.auth.user.id) {
        return res.status(403).json({
          ok: false,
          error: "Only the post author can update this post",
        });
      }

      const data = {};

      if (typeof req.body?.body === "string") {
        const trimmed = req.body.body.trim();
        if (!trimmed) {
          return res.status(400).json({
            ok: false,
            error: "Post body cannot be empty",
          });
        }
        data.body = trimmed;
      }

      if (req.body?.visibility !== undefined) {
        if (["TEAM", "PUBLIC", "PRIVATE"].includes(req.body.visibility)) {
          data.visibility = req.body.visibility;
        }
      }

      if (typeof req.body?.isPinned === "boolean") {
        data.isPinned = req.body.isPinned;
      }

      if (Object.keys(data).length === 0) {
        return res.status(400).json({
          ok: false,
          error: "No supported post updates were provided",
        });
      }

      const post = await prisma.post.update({
        where: { id: existingPost.id },
        data,
      });

      await Promise.all([
        writeAuditLog(req, {
          action: "post.updated",
          entityType: "post",
          entityId: post.id,
          metadata: data,
        }),
        recordAnalyticsEvent(req, {
          eventName: "post.updated",
          eventCategory: "feed",
          metadata: { postId: post.id },
        }),
      ]);

      return res.json({
        ok: true,
        post: {
          id: post.id,
          body: post.body,
          mediaUrls: post.mediaUrls,
          visibility: post.visibility,
          isPinned: post.isPinned,
          authorUserId: post.authorUserId,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        },
      });
    } catch (error) {
      return next(error);
    }
  },
);

// DELETE /:postId – Delete a post (author or moderator)
feedRouter.delete(
  "/:postId",
  requireAuth,
  requireTenant,
  requirePermission("conversation.write"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const post = await prisma.post.findFirst({
        where: {
          id: req.params.postId,
          tenantId: req.tenant.id,
        },
      });

      if (!post) {
        return res.status(404).json({
          ok: false,
          error: "Post not found",
        });
      }

      const isModerator = req.auth?.activeTenant?.permissions?.includes("moderation.manage");
      if (post.authorUserId !== req.auth.user.id && !isModerator) {
        return res.status(403).json({
          ok: false,
          error: "Only the post author or a moderator can delete this post",
        });
      }

      await prisma.post.delete({
        where: { id: post.id },
      });

      await Promise.all([
        writeAuditLog(req, {
          action: "post.deleted",
          entityType: "post",
          entityId: post.id,
          metadata: { deletedByModerator: isModerator && post.authorUserId !== req.auth.user.id },
        }),
        recordAnalyticsEvent(req, {
          eventName: "post.deleted",
          eventCategory: "feed",
          metadata: { postId: post.id },
        }),
      ]);

      return res.json({ ok: true });
    } catch (error) {
      return next(error);
    }
  },
);

// POST /:postId/comments – Add a comment
feedRouter.post(
  "/:postId/comments",
  requireAuth,
  requireTenant,
  requirePermission("conversation.write"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const post = await prisma.post.findFirst({
        where: {
          id: req.params.postId,
          tenantId: req.tenant.id,
        },
      });

      if (!post) {
        return res.status(404).json({
          ok: false,
          error: "Post not found",
        });
      }

      const body = String(req.body?.body || "").trim();
      if (!body) {
        return res.status(400).json({
          ok: false,
          error: "Comment body is required",
        });
      }

      const parentCommentId = req.body?.parentCommentId ? String(req.body.parentCommentId) : null;
      if (parentCommentId) {
        const parent = await prisma.postComment.findFirst({
          where: {
            id: parentCommentId,
            postId: post.id,
          },
          select: { id: true },
        });

        if (!parent) {
          return res.status(400).json({
            ok: false,
            error: "parentCommentId is not part of this post",
          });
        }
      }

      const comment = await prisma.postComment.create({
        data: {
          postId: post.id,
          authorUserId: req.auth.user.id,
          parentCommentId,
          body,
        },
      });

      await Promise.all([
        writeAuditLog(req, {
          action: "post.comment.created",
          entityType: "postComment",
          entityId: comment.id,
          metadata: { postId: post.id },
        }),
        recordAnalyticsEvent(req, {
          eventName: "post.comment.created",
          eventCategory: "feed",
          metadata: { postId: post.id, commentId: comment.id },
        }),
      ]);

      return res.status(201).json({
        ok: true,
        comment: {
          id: comment.id,
          body: comment.body,
          authorUserId: comment.authorUserId,
          parentCommentId: comment.parentCommentId,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
        },
      });
    } catch (error) {
      return next(error);
    }
  },
);

// DELETE /:postId/comments/:commentId – Delete a comment (author or moderator)
feedRouter.delete(
  "/:postId/comments/:commentId",
  requireAuth,
  requireTenant,
  requirePermission("conversation.write"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const post = await prisma.post.findFirst({
        where: {
          id: req.params.postId,
          tenantId: req.tenant.id,
        },
        select: { id: true },
      });

      if (!post) {
        return res.status(404).json({
          ok: false,
          error: "Post not found",
        });
      }

      const comment = await prisma.postComment.findFirst({
        where: {
          id: req.params.commentId,
          postId: post.id,
        },
      });

      if (!comment) {
        return res.status(404).json({
          ok: false,
          error: "Comment not found",
        });
      }

      const isModerator = req.auth?.activeTenant?.permissions?.includes("moderation.manage");
      if (comment.authorUserId !== req.auth.user.id && !isModerator) {
        return res.status(403).json({
          ok: false,
          error: "Only the comment author or a moderator can delete this comment",
        });
      }

      await prisma.postComment.delete({
        where: { id: comment.id },
      });

      await Promise.all([
        writeAuditLog(req, {
          action: "post.comment.deleted",
          entityType: "postComment",
          entityId: comment.id,
          metadata: { postId: post.id, deletedByModerator: isModerator && comment.authorUserId !== req.auth.user.id },
        }),
        recordAnalyticsEvent(req, {
          eventName: "post.comment.deleted",
          eventCategory: "feed",
          metadata: { postId: post.id, commentId: comment.id },
        }),
      ]);

      return res.json({ ok: true });
    } catch (error) {
      return next(error);
    }
  },
);

// POST /:postId/reactions – Toggle a reaction on a post
feedRouter.post(
  "/:postId/reactions",
  requireAuth,
  requireTenant,
  requirePermission("conversation.write"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const post = await prisma.post.findFirst({
        where: {
          id: req.params.postId,
          tenantId: req.tenant.id,
        },
        select: { id: true },
      });

      if (!post) {
        return res.status(404).json({
          ok: false,
          error: "Post not found",
        });
      }

      const emoji = String(req.body?.emoji || "").trim();
      if (!emoji) {
        return res.status(400).json({
          ok: false,
          error: "Emoji is required",
        });
      }

      const existingReaction = await prisma.postReaction.findFirst({
        where: {
          postId: post.id,
          userId: req.auth.user.id,
          emoji,
        },
      });

      if (existingReaction) {
        await prisma.postReaction.delete({
          where: { id: existingReaction.id },
        });
      } else {
        await prisma.postReaction.create({
          data: {
            postId: post.id,
            userId: req.auth.user.id,
            emoji,
          },
        });
      }

      const reactions = await prisma.postReaction.findMany({
        where: { postId: post.id },
      });

      await Promise.all([
        writeAuditLog(req, {
          action: existingReaction ? "post.reaction.removed" : "post.reaction.added",
          entityType: "postReaction",
          entityId: post.id,
          metadata: { emoji },
        }),
        recordAnalyticsEvent(req, {
          eventName: existingReaction ? "post.reaction.removed" : "post.reaction.added",
          eventCategory: "feed",
          metadata: { postId: post.id, emoji },
        }),
      ]);

      return res.json({
        ok: true,
        toggled: existingReaction ? "removed" : "added",
        reactions: aggregateReactionSummary(reactions, req.auth.user.id),
      });
    } catch (error) {
      return next(error);
    }
  },
);
