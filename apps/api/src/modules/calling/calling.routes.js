import { Router } from "express";
import { getPrismaClient } from "../../lib/db.js";
import { writeAuditLog } from "../../lib/audit.js";
import { recordAnalyticsEvent } from "../../lib/analytics.js";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/rbac.js";
import { requireTenant } from "../../middleware/tenant.js";
import { createLiveKitToken, isLiveKitConfigured, getLiveKitUrl } from "../../lib/livekit.js";

const DEFAULT_PAGE_LIMIT = 50;
const MAX_PAGE_LIMIT = 100;

export const callingRouter = Router();

// POST /sessions – Initiate a new call session
callingRouter.post(
  "/sessions",
  requireAuth,
  requireTenant,
  requirePermission("conversation.write"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const conversationId = req.body?.conversationId || null;
      const channelId = req.body?.channelId || null;
      const callType = String(req.body?.callType || "VOICE").toUpperCase();

      if (!["VOICE", "VIDEO"].includes(callType)) {
        return res.status(400).json({
          ok: false,
          error: "callType must be either VOICE or VIDEO",
        });
      }

      const roomName = `${req.tenant.slug}-${Date.now()}`;

      const session = await prisma.callSession.create({
        data: {
          tenantId: req.tenant.id,
          conversationId,
          channelId,
          callType,
          status: "RINGING",
          initiatedByUserId: req.auth.user.id,
          roomName,
          provider: "default",
          startedAt: new Date(),
          metadata: {},
        },
        include: {
          participants: true,
        },
      });

      await prisma.callParticipant.create({
        data: {
          callSessionId: session.id,
          userId: req.auth.user.id,
          joinedAt: new Date(),
        },
      });

      const created = await prisma.callSession.findUnique({
        where: { id: session.id },
        include: { participants: true },
      });

      await Promise.all([
        writeAuditLog(req, {
          action: "call_session.created",
          entityType: "call_session",
          entityId: session.id,
          metadata: { callType, roomName, conversationId, channelId },
        }),
        recordAnalyticsEvent(req, {
          eventName: "call_session.created",
          eventCategory: "calling",
          metadata: { callSessionId: session.id, callType },
        }),
      ]);

      return res.status(201).json({
        ok: true,
        session: created,
      });
    } catch (error) {
      return next(error);
    }
  },
);

// GET /sessions – List call sessions for the tenant
callingRouter.get(
  "/sessions",
  requireAuth,
  requireTenant,
  requirePermission("conversation.read"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const limit = Math.min(
        Number(req.query.limit) || DEFAULT_PAGE_LIMIT,
        MAX_PAGE_LIMIT,
      );
      const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
      const status = req.query.status
        ? String(req.query.status).toUpperCase()
        : undefined;

      const where = { tenantId: req.tenant.id };
      if (status) {
        where.status = status;
      }

      const findArgs = {
        where,
        include: {
          _count: {
            select: { participants: true },
          },
        },
        orderBy: { startedAt: "desc" },
        take: limit + 1,
      };

      if (cursor) {
        findArgs.cursor = { id: cursor };
        findArgs.skip = 1;
      }

      const sessions = await prisma.callSession.findMany(findArgs);

      const hasMore = sessions.length > limit;
      if (hasMore) {
        sessions.pop();
      }

      return res.json({
        ok: true,
        sessions: sessions.map((s) => ({
          ...s,
          participantCount: s._count.participants,
          _count: undefined,
        })),
        nextCursor: hasMore ? sessions[sessions.length - 1].id : null,
      });
    } catch (error) {
      return next(error);
    }
  },
);

// GET /sessions/:sessionId – Get call session details with participants
callingRouter.get(
  "/sessions/:sessionId",
  requireAuth,
  requireTenant,
  requirePermission("conversation.read"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const session = await prisma.callSession.findFirst({
        where: {
          id: req.params.sessionId,
          tenantId: req.tenant.id,
        },
        include: {
          participants: true,
        },
      });

      if (!session) {
        return res.status(404).json({
          ok: false,
          error: "Call session not found",
        });
      }

      return res.json({
        ok: true,
        session,
      });
    } catch (error) {
      return next(error);
    }
  },
);

// PATCH /sessions/:sessionId – Update call status (answer, end)
callingRouter.patch(
  "/sessions/:sessionId",
  requireAuth,
  requireTenant,
  requirePermission("conversation.write"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const status = String(req.body?.status || "").toUpperCase();

      if (!["ANSWERED", "ENDED"].includes(status)) {
        return res.status(400).json({
          ok: false,
          error: "status must be either ANSWERED or ENDED",
        });
      }

      const session = await prisma.callSession.findFirst({
        where: {
          id: req.params.sessionId,
          tenantId: req.tenant.id,
        },
      });

      if (!session) {
        return res.status(404).json({
          ok: false,
          error: "Call session not found",
        });
      }

      const data = { status };

      if (status === "ANSWERED") {
        data.answeredAt = new Date();
      }

      if (status === "ENDED") {
        const now = new Date();
        data.endedAt = now;
        data.durationSeconds = Math.round(
          (now.getTime() - new Date(session.startedAt).getTime()) / 1000,
        );
      }

      const updated = await prisma.callSession.update({
        where: { id: session.id },
        data,
        include: { participants: true },
      });

      await Promise.all([
        writeAuditLog(req, {
          action: "call_session.updated",
          entityType: "call_session",
          entityId: session.id,
          metadata: { status },
        }),
        recordAnalyticsEvent(req, {
          eventName: "call_session.updated",
          eventCategory: "calling",
          metadata: { callSessionId: session.id, status },
        }),
      ]);

      return res.json({
        ok: true,
        session: updated,
      });
    } catch (error) {
      return next(error);
    }
  },
);

// POST /sessions/:sessionId/participants – Add a participant
callingRouter.post(
  "/sessions/:sessionId/participants",
  requireAuth,
  requireTenant,
  requirePermission("conversation.write"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const userId = req.body?.userId;

      if (!userId) {
        return res.status(400).json({
          ok: false,
          error: "userId is required",
        });
      }

      const session = await prisma.callSession.findFirst({
        where: {
          id: req.params.sessionId,
          tenantId: req.tenant.id,
        },
      });

      if (!session) {
        return res.status(404).json({
          ok: false,
          error: "Call session not found",
        });
      }

      const participant = await prisma.callParticipant.create({
        data: {
          callSessionId: session.id,
          userId,
          joinedAt: new Date(),
        },
      });

      await Promise.all([
        writeAuditLog(req, {
          action: "call_participant.added",
          entityType: "call_session",
          entityId: session.id,
          metadata: { userId },
        }),
        recordAnalyticsEvent(req, {
          eventName: "call_participant.added",
          eventCategory: "calling",
          metadata: { callSessionId: session.id, userId },
        }),
      ]);

      return res.status(201).json({
        ok: true,
        participant,
      });
    } catch (error) {
      return next(error);
    }
  },
);

// PATCH /sessions/:sessionId/participants/:userId – Update participant state
callingRouter.patch(
  "/sessions/:sessionId/participants/:userId",
  requireAuth,
  requireTenant,
  requirePermission("conversation.write"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const session = await prisma.callSession.findFirst({
        where: {
          id: req.params.sessionId,
          tenantId: req.tenant.id,
        },
      });

      if (!session) {
        return res.status(404).json({
          ok: false,
          error: "Call session not found",
        });
      }

      const participant = await prisma.callParticipant.findFirst({
        where: {
          callSessionId: session.id,
          userId: req.params.userId,
          leftAt: null,
        },
      });

      if (!participant) {
        return res.status(404).json({
          ok: false,
          error: "Participant not found",
        });
      }

      const data = {};
      if (typeof req.body?.isMuted === "boolean") {
        data.isMuted = req.body.isMuted;
      }
      if (typeof req.body?.isOnHold === "boolean") {
        data.isOnHold = req.body.isOnHold;
      }

      const updated = await prisma.callParticipant.update({
        where: { id: participant.id },
        data,
      });

      await Promise.all([
        writeAuditLog(req, {
          action: "call_participant.updated",
          entityType: "call_session",
          entityId: session.id,
          metadata: { userId: req.params.userId, ...data },
        }),
        recordAnalyticsEvent(req, {
          eventName: "call_participant.updated",
          eventCategory: "calling",
          metadata: {
            callSessionId: session.id,
            userId: req.params.userId,
          },
        }),
      ]);

      return res.json({
        ok: true,
        participant: updated,
      });
    } catch (error) {
      return next(error);
    }
  },
);

// DELETE /sessions/:sessionId/participants/:userId – Remove participant
callingRouter.delete(
  "/sessions/:sessionId/participants/:userId",
  requireAuth,
  requireTenant,
  requirePermission("conversation.write"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const session = await prisma.callSession.findFirst({
        where: {
          id: req.params.sessionId,
          tenantId: req.tenant.id,
        },
      });

      if (!session) {
        return res.status(404).json({
          ok: false,
          error: "Call session not found",
        });
      }

      const participant = await prisma.callParticipant.findFirst({
        where: {
          callSessionId: session.id,
          userId: req.params.userId,
          leftAt: null,
        },
      });

      if (!participant) {
        return res.status(404).json({
          ok: false,
          error: "Participant not found",
        });
      }

      await prisma.callParticipant.update({
        where: { id: participant.id },
        data: { leftAt: new Date() },
      });

      await Promise.all([
        writeAuditLog(req, {
          action: "call_participant.removed",
          entityType: "call_session",
          entityId: session.id,
          metadata: { userId: req.params.userId },
        }),
        recordAnalyticsEvent(req, {
          eventName: "call_participant.removed",
          eventCategory: "calling",
          metadata: {
            callSessionId: session.id,
            userId: req.params.userId,
          },
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

// GET /history – List completed calls with pagination
callingRouter.get(
  "/history",
  requireAuth,
  requireTenant,
  requirePermission("conversation.read"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const limit = Math.min(
        Number(req.query.limit) || DEFAULT_PAGE_LIMIT,
        MAX_PAGE_LIMIT,
      );
      const cursor = req.query.cursor ? String(req.query.cursor) : undefined;

      const findArgs = {
        where: {
          tenantId: req.tenant.id,
          status: "ENDED",
        },
        include: {
          _count: {
            select: { participants: true },
          },
        },
        orderBy: { endedAt: "desc" },
        take: limit + 1,
      };

      if (cursor) {
        findArgs.cursor = { id: cursor };
        findArgs.skip = 1;
      }

      const sessions = await prisma.callSession.findMany(findArgs);

      const hasMore = sessions.length > limit;
      if (hasMore) {
        sessions.pop();
      }

      return res.json({
        ok: true,
        sessions: sessions.map((s) => ({
          ...s,
          participantCount: s._count.participants,
          _count: undefined,
        })),
        nextCursor: hasMore ? sessions[sessions.length - 1].id : null,
      });
    } catch (error) {
      return next(error);
    }
  },
);

// POST /sessions/:sessionId/telemetry – Record a telemetry event
callingRouter.post(
  "/sessions/:sessionId/telemetry",
  requireAuth,
  requireTenant,
  requirePermission("conversation.write"),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();

      const eventName = String(req.body?.eventName || "").trim();

      if (!eventName) {
        return res.status(400).json({
          ok: false,
          error: "eventName is required",
        });
      }

      const session = await prisma.callSession.findFirst({
        where: {
          id: req.params.sessionId,
          tenantId: req.tenant.id,
        },
      });

      if (!session) {
        return res.status(404).json({
          ok: false,
          error: "Call session not found",
        });
      }

      const telemetry = await prisma.callTelemetry.create({
        data: {
          callSessionId: session.id,
          userId: req.auth.user.id,
          eventName,
          value: req.body?.value ?? null,
          metadata: req.body?.metadata ?? {},
          occurredAt: new Date(),
        },
      });

      await Promise.all([
        writeAuditLog(req, {
          action: "call_telemetry.recorded",
          entityType: "call_session",
          entityId: session.id,
          metadata: { eventName },
        }),
        recordAnalyticsEvent(req, {
          eventName: "call_telemetry.recorded",
          eventCategory: "calling",
          metadata: { callSessionId: session.id, eventName },
        }),
      ]);

      return res.status(201).json({
        ok: true,
        telemetry,
      });
    } catch (error) {
      return next(error);
    }
  },
);

// POST /sessions/:sessionId/token – Generate a LiveKit access token for a call participant
callingRouter.post(
  "/sessions/:sessionId/token",
  requireAuth,
  requireTenant,
  requirePermission("conversation.write"),
  async (req, res, next) => {
    try {
      if (!isLiveKitConfigured()) {
        return res.status(503).json({
          ok: false,
          error: "Voice/video signaling is not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET.",
        });
      }

      const prisma = getPrismaClient();
      const sessionId = String(req.params.sessionId);

      const session = await prisma.callSession.findFirst({
        where: {
          id: sessionId,
          tenantId: req.tenant.id,
        },
      });

      if (!session) {
        return res.status(404).json({
          ok: false,
          error: "Call session not found",
        });
      }

      if (session.status === "ENDED") {
        return res.status(400).json({
          ok: false,
          error: "Cannot join an ended call session",
        });
      }

      const roomName = session.roomName || `${req.tenant.slug}-${session.id}`;
      const participantIdentity = `user:${req.auth.user.id}`;
      const participantName = req.auth.user.displayName || req.auth.user.email || req.auth.user.id;

      const token = await createLiveKitToken({
        roomName,
        participantIdentity,
        participantName,
        canPublish: true,
        canSubscribe: true,
      });

      const existingParticipant = await prisma.callParticipant.findUnique({
        where: {
          callSessionId_userId: {
            callSessionId: session.id,
            userId: req.auth.user.id,
          },
        },
      });

      if (!existingParticipant) {
        await prisma.callParticipant.create({
          data: {
            callSessionId: session.id,
            userId: req.auth.user.id,
            joinedAt: new Date(),
          },
        });
      }

      await Promise.all([
        writeAuditLog(req, {
          action: "call_session.token_generated",
          entityType: "call_session",
          entityId: session.id,
          metadata: { roomName, callType: session.callType },
        }),
        recordAnalyticsEvent(req, {
          eventName: "call_session.token_generated",
          eventCategory: "calling",
          metadata: { callSessionId: session.id, callType: session.callType },
        }),
      ]);

      return res.json({
        ok: true,
        token,
        livekitUrl: getLiveKitUrl(),
        roomName,
        participantIdentity,
      });
    } catch (error) {
      return next(error);
    }
  },
);
