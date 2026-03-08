import { Router } from "express";
import { getPrismaClient } from "../../lib/db.js";
import { writeAuditLog } from "../../lib/audit.js";
import { recordAnalyticsEvent } from "../../lib/analytics.js";
import { runAiTask } from "../../lib/ai-runtime.js";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/rbac.js";
import { requireTenant } from "../../middleware/tenant.js";

export const aiRouter = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const INTERACTION_TYPE_MAP = {
  chatbot: "CHATBOT",
  assistant: "ASSISTANT",
  summarization: "SUMMARIZATION",
  moderation: "MODERATION",
  voice_bot: "VOICE_BOT",
};

async function findEnabledConfig(prisma, tenantId, key) {
  return prisma.aIConfig.findFirst({
    where: { tenantId, key, isEnabled: true },
  });
}

// ---------------------------------------------------------------------------
// 1. GET /config — list AI configurations for the tenant
// ---------------------------------------------------------------------------
aiRouter.get(
  "/config",
  requireAuth,
  requireTenant,
  requirePermission("tenant.manage"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();
      const configs = await prisma.aIConfig.findMany({
        where: { tenantId: req.tenant.id },
        orderBy: { createdAt: "asc" },
      });

      return res.json({ ok: true, configs });
    } catch (error) {
      return next(error);
    }
  },
);

// ---------------------------------------------------------------------------
// 2. PUT /config/:key — create or update an AI configuration
// ---------------------------------------------------------------------------
aiRouter.put(
  "/config/:key",
  requireAuth,
  requireTenant,
  requirePermission("tenant.manage"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();
      const { key } = req.params;
      const { provider, config, isEnabled } = req.body;

      if (!provider || config === undefined) {
        return res.status(400).json({
          ok: false,
          error: "provider and config are required",
        });
      }

      const aiConfig = await prisma.aIConfig.upsert({
        where: {
          tenantId_key: { tenantId: req.tenant.id, key },
        },
        create: {
          tenantId: req.tenant.id,
          key,
          provider,
          config,
          isEnabled: isEnabled ?? false,
        },
        update: {
          provider,
          config,
          ...(isEnabled !== undefined && { isEnabled }),
        },
      });

      await Promise.all([
        writeAuditLog(req, {
          action: "ai_config.upserted",
          entityType: "ai_config",
          entityId: aiConfig.id,
          metadata: { key, provider },
        }),
        recordAnalyticsEvent(req, {
          eventName: "ai_config.upserted",
          eventCategory: "ai",
          metadata: { key, provider },
        }),
      ]);

      return res.json({ ok: true, config: aiConfig });
    } catch (error) {
      return next(error);
    }
  },
);

// ---------------------------------------------------------------------------
// 3. DELETE /config/:key — delete an AI configuration
// ---------------------------------------------------------------------------
aiRouter.delete(
  "/config/:key",
  requireAuth,
  requireTenant,
  requirePermission("tenant.manage"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();
      const { key } = req.params;

      const existing = await prisma.aIConfig.findUnique({
        where: {
          tenantId_key: { tenantId: req.tenant.id, key },
        },
      });

      if (!existing) {
        return res.status(404).json({
          ok: false,
          error: "AI configuration not found",
        });
      }

      await prisma.aIConfig.delete({
        where: {
          tenantId_key: { tenantId: req.tenant.id, key },
        },
      });

      await Promise.all([
        writeAuditLog(req, {
          action: "ai_config.deleted",
          entityType: "ai_config",
          entityId: existing.id,
          metadata: { key },
        }),
        recordAnalyticsEvent(req, {
          eventName: "ai_config.deleted",
          eventCategory: "ai",
          metadata: { key },
        }),
      ]);

      return res.json({ ok: true });
    } catch (error) {
      return next(error);
    }
  },
);

// ---------------------------------------------------------------------------
// 4. POST /chat — chatbot endpoint
// ---------------------------------------------------------------------------
aiRouter.post(
  "/chat",
  requireAuth,
  requireTenant,
  requirePermission("conversation.write"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();
      const { input, conversationId, channelId, metadata } = req.body;

      if (!input) {
        return res.status(400).json({ ok: false, error: "input is required" });
      }

      const config = await findEnabledConfig(prisma, req.tenant.id, "CHATBOT");
      if (!config) {
        return res.status(400).json({
          ok: false,
          error: "AI chatbot is not configured for this tenant",
        });
      }

      const aiResult = await runAiTask({
        provider: config.provider,
        config: config.config,
        task: "chat",
        input,
        metadata: {
          conversationId: conversationId || null,
          channelId: channelId || null,
          ...(metadata && typeof metadata === "object" ? metadata : {}),
        },
      });

      const interaction = await prisma.aIInteraction.create({
        data: {
          tenantId: req.tenant.id,
          userId: req.auth?.user?.id || null,
          type: "CHATBOT",
          conversationId: conversationId || null,
          channelId: channelId || null,
          input,
          output: aiResult.output,
          model: aiResult.model,
          provider: config.provider,
          tokensUsed: aiResult.tokensUsed,
          durationMs: aiResult.durationMs,
          metadata: metadata || null,
        },
      });

      await Promise.all([
        writeAuditLog(req, {
          action: "ai.chat",
          entityType: "ai_interaction",
          entityId: interaction.id,
          metadata: { type: "CHATBOT" },
        }),
        recordAnalyticsEvent(req, {
          eventName: "ai.chat",
          eventCategory: "ai",
          metadata: { interactionId: interaction.id },
        }),
      ]);

      return res.json({ ok: true, output: aiResult.output, interaction });
    } catch (error) {
      return next(error);
    }
  },
);

// ---------------------------------------------------------------------------
// 5. POST /summarize — summarization endpoint
// ---------------------------------------------------------------------------
aiRouter.post(
  "/summarize",
  requireAuth,
  requireTenant,
  requirePermission("conversation.read"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();
      const { conversationId, channelId, input: directInput } = req.body;

      let inputText = directInput || "";

      if (conversationId) {
        const messages = await prisma.conversationMessage.findMany({
          where: { conversationId },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: { body: true, createdAt: true },
        });
        inputText = messages
          .reverse()
          .map((m) => m.body)
          .join("\n");
      } else if (channelId) {
        const messages = await prisma.channelMessage.findMany({
          where: { channelId },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: { body: true, createdAt: true },
        });
        inputText = messages
          .reverse()
          .map((m) => m.body)
          .join("\n");
      }

      if (!inputText) {
        return res.status(400).json({
          ok: false,
          error: "No input provided — supply conversationId, channelId, or input",
        });
      }

      const config = await findEnabledConfig(prisma, req.tenant.id, "SUMMARIZATION");
      if (!config) {
        return res.status(400).json({
          ok: false,
          error: "AI summarization is not configured for this tenant",
        });
      }

      const aiResult = await runAiTask({
        provider: config.provider,
        config: config.config,
        task: "summarize",
        input: inputText,
        metadata: {
          conversationId: conversationId || null,
          channelId: channelId || null,
        },
      });

      const interaction = await prisma.aIInteraction.create({
        data: {
          tenantId: req.tenant.id,
          userId: req.auth?.user?.id || null,
          type: "SUMMARIZATION",
          conversationId: conversationId || null,
          channelId: channelId || null,
          input: inputText,
          output: aiResult.output,
          model: aiResult.model,
          provider: config.provider,
          tokensUsed: aiResult.tokensUsed,
          durationMs: aiResult.durationMs,
        },
      });

      await Promise.all([
        writeAuditLog(req, {
          action: "ai.summarize",
          entityType: "ai_interaction",
          entityId: interaction.id,
          metadata: { type: "SUMMARIZATION", conversationId, channelId },
        }),
        recordAnalyticsEvent(req, {
          eventName: "ai.summarize",
          eventCategory: "ai",
          metadata: { interactionId: interaction.id },
        }),
      ]);

      return res.json({ ok: true, output: aiResult.output, interaction });
    } catch (error) {
      return next(error);
    }
  },
);

// ---------------------------------------------------------------------------
// 6. POST /moderate — content moderation endpoint
// ---------------------------------------------------------------------------
aiRouter.post(
  "/moderate",
  requireAuth,
  requireTenant,
  requirePermission("moderation.manage"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();
      const { content, targetType, targetId } = req.body;

      if (!content) {
        return res.status(400).json({
          ok: false,
          error: "content is required",
        });
      }

      const config = await findEnabledConfig(prisma, req.tenant.id, "MODERATION");
      if (!config) {
        return res.status(400).json({
          ok: false,
          error: "AI moderation is not configured for this tenant",
        });
      }

      const aiResult = await runAiTask({
        provider: config.provider,
        config: config.config,
        task: "moderate",
        input: content,
        metadata: {
          targetType: targetType || null,
          targetId: targetId || null,
        },
      });

      const interaction = await prisma.aIInteraction.create({
        data: {
          tenantId: req.tenant.id,
          userId: req.auth?.user?.id || null,
          type: "MODERATION",
          input: content,
          output: aiResult.output,
          model: aiResult.model,
          provider: config.provider,
          tokensUsed: aiResult.tokensUsed,
          durationMs: aiResult.durationMs,
          metadata: { targetType: targetType || null, targetId: targetId || null },
        },
      });

      await Promise.all([
        writeAuditLog(req, {
          action: "ai.moderate",
          entityType: "ai_interaction",
          entityId: interaction.id,
          metadata: { type: "MODERATION", targetType, targetId },
        }),
        recordAnalyticsEvent(req, {
          eventName: "ai.moderate",
          eventCategory: "ai",
          metadata: { interactionId: interaction.id },
        }),
      ]);

      return res.json({
        ok: true,
        flagged: aiResult.flagged,
        categories: aiResult.categories,
        output: aiResult.output,
        reason: aiResult.reason,
        interaction,
      });
    } catch (error) {
      return next(error);
    }
  },
);

// ---------------------------------------------------------------------------
// 7. POST /assist — assistant orchestration endpoint
// ---------------------------------------------------------------------------
aiRouter.post(
  "/assist",
  requireAuth,
  requireTenant,
  requirePermission("conversation.write"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();
      const { input, conversationId, channelId, metadata } = req.body;

      if (!input) {
        return res.status(400).json({ ok: false, error: "input is required" });
      }

      const config = await findEnabledConfig(prisma, req.tenant.id, "ASSISTANT");
      if (!config) {
        return res.status(400).json({
          ok: false,
          error: "AI assistant is not configured for this tenant",
        });
      }

      const aiResult = await runAiTask({
        provider: config.provider,
        config: config.config,
        task: "assist",
        input,
        metadata: {
          conversationId: conversationId || null,
          channelId: channelId || null,
          ...(metadata && typeof metadata === "object" ? metadata : {}),
        },
      });

      const interaction = await prisma.aIInteraction.create({
        data: {
          tenantId: req.tenant.id,
          userId: req.auth?.user?.id || null,
          type: "ASSISTANT",
          conversationId: conversationId || null,
          channelId: channelId || null,
          input,
          output: aiResult.output,
          model: aiResult.model,
          provider: config.provider,
          tokensUsed: aiResult.tokensUsed,
          durationMs: aiResult.durationMs,
          metadata: metadata || null,
        },
      });

      await Promise.all([
        writeAuditLog(req, {
          action: "ai.assist",
          entityType: "ai_interaction",
          entityId: interaction.id,
          metadata: { type: "ASSISTANT" },
        }),
        recordAnalyticsEvent(req, {
          eventName: "ai.assist",
          eventCategory: "ai",
          metadata: { interactionId: interaction.id },
        }),
      ]);

      return res.json({ ok: true, output: aiResult.output, interaction });
    } catch (error) {
      return next(error);
    }
  },
);

// ---------------------------------------------------------------------------
// 8. GET /interactions — list AI interactions for the tenant
// ---------------------------------------------------------------------------
aiRouter.get(
  "/interactions",
  requireAuth,
  requireTenant,
  requirePermission("analytics.read"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const where = { tenantId: req.tenant.id };

      if (req.query.type) {
        const mapped = INTERACTION_TYPE_MAP[req.query.type.toLowerCase()];
        if (mapped) {
          where.type = mapped;
        }
      }

      const limit = Math.min(Number(req.query.limit) || 50, 100);
      const interactions = await prisma.aIInteraction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return res.json({ ok: true, interactions });
    } catch (error) {
      return next(error);
    }
  },
);

// ---------------------------------------------------------------------------
// 9. POST /voice-bot — voice bot extension point
// ---------------------------------------------------------------------------
aiRouter.post(
  "/voice-bot",
  requireAuth,
  requireTenant,
  requirePermission("conversation.write"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();
      const { input, callSessionId, metadata } = req.body;

      if (!input) {
        return res.status(400).json({ ok: false, error: "input is required" });
      }

      const config = await findEnabledConfig(prisma, req.tenant.id, "VOICE_BOT");
      if (!config) {
        return res.status(400).json({
          ok: false,
          error: "AI voice bot is not configured for this tenant",
        });
      }

      const aiResult = await runAiTask({
        provider: config.provider,
        config: config.config,
        task: "voice_bot",
        input,
        metadata: {
          callSessionId: callSessionId || null,
          ...(metadata && typeof metadata === "object" ? metadata : {}),
        },
      });

      const interaction = await prisma.aIInteraction.create({
        data: {
          tenantId: req.tenant.id,
          userId: req.auth?.user?.id || null,
          type: "VOICE_BOT",
          input,
          output: aiResult.output,
          model: aiResult.model,
          provider: config.provider,
          tokensUsed: aiResult.tokensUsed,
          durationMs: aiResult.durationMs,
          metadata: {
            ...(metadata || {}),
            callSessionId: callSessionId || null,
          },
        },
      });

      await Promise.all([
        writeAuditLog(req, {
          action: "ai.voice_bot",
          entityType: "ai_interaction",
          entityId: interaction.id,
          metadata: { type: "VOICE_BOT", callSessionId },
        }),
        recordAnalyticsEvent(req, {
          eventName: "ai.voice_bot",
          eventCategory: "ai",
          metadata: { interactionId: interaction.id },
        }),
      ]);

      return res.json({ ok: true, output: aiResult.output, interaction });
    } catch (error) {
      return next(error);
    }
  },
);
