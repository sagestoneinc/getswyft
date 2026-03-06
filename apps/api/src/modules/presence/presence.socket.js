import crypto from "node:crypto";
import { env } from "../../config/env.js";
import { loadAccessContextFromClaims } from "../../lib/access-context.js";
import { verifyAccessToken } from "../../lib/auth-tokens.js";
import { getPrismaClient } from "../../lib/db.js";
import { logger } from "../../lib/logger.js";

const messageHistoryByConversation = new Map();

function safeAck(callback, payload) {
  if (typeof callback === "function") {
    callback(payload);
  }
}

function normalizePresenceStatus(status) {
  const value = String(status || "ONLINE").toUpperCase();
  if (["ONLINE", "AWAY", "BUSY", "OFFLINE"].includes(value)) {
    return value;
  }
  return "ONLINE";
}

function buildMessage({ conversationId, sender, body, tenantId }) {
  return {
    id: crypto.randomUUID(),
    conversationId,
    tenantId,
    sender: sender || "visitor",
    body,
    createdAt: new Date().toISOString(),
  };
}

function getConversationKey(tenantId, conversationId) {
  return `${tenantId}:${conversationId}`;
}

function getTokenFromSocket(socket) {
  const fromAuth = socket.handshake?.auth?.token;
  if (fromAuth) {
    return fromAuth;
  }

  const header = socket.handshake?.headers?.authorization;
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice(7);
  }

  return null;
}

function getDevClaims(socket) {
  const userId = socket.handshake?.auth?.devUserId || "local-user";
  return {
    sub: `dev|${userId}`,
    email: socket.handshake?.auth?.devEmail || `${userId}@example.local`,
    name: socket.handshake?.auth?.devName || "Local Developer",
  };
}

function resolveSocketTenant(access, socket) {
  const tenantId = socket.handshake?.auth?.tenantId;
  const tenantSlug = socket.handshake?.auth?.tenantSlug;

  if (tenantId) {
    return access.memberships.find((membership) => membership.tenantId === tenantId) || null;
  }

  if (tenantSlug) {
    return access.memberships.find((membership) => membership.tenantSlug === tenantSlug) || null;
  }

  return access.memberships[0] || null;
}

export function registerPresenceSocket(io) {
  const prisma = getPrismaClient();

  io.use(async (socket, next) => {
    try {
      const token = getTokenFromSocket(socket);
      const claims = token
        ? await verifyAccessToken(token)
        : env.DEV_AUTH_BYPASS
          ? getDevClaims(socket)
          : null;

      if (!claims) {
        return next(new Error("Socket authentication required"));
      }

      const access = await loadAccessContextFromClaims(claims, {
        autoProvision: true,
      });

      const tenantMembership = resolveSocketTenant(access, socket);
      if (!tenantMembership) {
        return next(new Error("No tenant membership found for socket connection"));
      }

      socket.data.auth = {
        claims,
        user: access.user,
        memberships: access.memberships,
        tenant: tenantMembership,
      };

      return next();
    } catch (error) {
      return next(new Error(error.message || "Socket authentication failed"));
    }
  });

  io.on("connection", async (socket) => {
    const auth = socket.data.auth;
    const tenantRoom = `tenant:${auth.tenant.tenantId}:presence`;
    const userRoom = `tenant:${auth.tenant.tenantId}:user:${auth.user.id}`;

    socket.join(tenantRoom);
    socket.join(userRoom);

    socket.emit("auth:ready", {
      socketId: socket.id,
      userId: auth.user.id,
      tenantId: auth.tenant.tenantId,
      tenantSlug: auth.tenant.tenantSlug,
      connectedAt: new Date().toISOString(),
    });

    try {
      await prisma.presenceSession.upsert({
        where: {
          tenantId_userId_connectionId: {
            tenantId: auth.tenant.tenantId,
            userId: auth.user.id,
            connectionId: socket.id,
          },
        },
        create: {
          tenantId: auth.tenant.tenantId,
          userId: auth.user.id,
          connectionId: socket.id,
          status: "ONLINE",
          metadata: {
            source: "socket",
          },
        },
        update: {
          status: "ONLINE",
          lastSeenAt: new Date(),
        },
      });
    } catch (error) {
      logger.warn("presence_upsert_failed", { error: error.message });
    }

    io.to(tenantRoom).emit("presence:update", {
      userId: auth.user.id,
      tenantId: auth.tenant.tenantId,
      status: "ONLINE",
      socketId: socket.id,
      updatedAt: new Date().toISOString(),
    });

    socket.on("presence:subscribe", ({ userIds } = {}, callback) => {
      safeAck(callback, {
        ok: true,
        tenantId: auth.tenant.tenantId,
        userIds: Array.isArray(userIds) ? userIds : [],
      });
    });

    socket.on("presence:update", async (payload = {}, callback) => {
      const status = normalizePresenceStatus(payload.status);

      try {
        await prisma.presenceSession.updateMany({
          where: {
            tenantId: auth.tenant.tenantId,
            userId: auth.user.id,
            connectionId: socket.id,
          },
          data: {
            status,
            lastSeenAt: new Date(),
            metadata: payload.metadata || null,
          },
        });
      } catch (error) {
        logger.warn("presence_update_failed", { error: error.message });
      }

      const event = {
        userId: auth.user.id,
        tenantId: auth.tenant.tenantId,
        status,
        socketId: socket.id,
        updatedAt: new Date().toISOString(),
      };

      io.to(tenantRoom).emit("presence:update", event);
      safeAck(callback, { ok: true, ...event });
    });

    socket.on("conversation:join", ({ conversationId }, callback) => {
      if (!conversationId || typeof conversationId !== "string") {
        safeAck(callback, { ok: false, error: "conversationId is required" });
        return;
      }

      const room = `tenant:${auth.tenant.tenantId}:conversation:${conversationId}`;
      socket.join(room);
      const history = messageHistoryByConversation.get(getConversationKey(auth.tenant.tenantId, conversationId)) || [];
      safeAck(callback, {
        ok: true,
        tenantId: auth.tenant.tenantId,
        conversationId,
        history,
      });
    });

    socket.on("conversation:leave", ({ conversationId }, callback) => {
      if (!conversationId || typeof conversationId !== "string") {
        safeAck(callback, { ok: false, error: "conversationId is required" });
        return;
      }

      const room = `tenant:${auth.tenant.tenantId}:conversation:${conversationId}`;
      socket.leave(room);
      safeAck(callback, { ok: true, conversationId });
    });

    socket.on("conversation:history", ({ conversationId }, callback) => {
      if (!conversationId || typeof conversationId !== "string") {
        safeAck(callback, { ok: false, error: "conversationId is required" });
        return;
      }

      safeAck(callback, {
        ok: true,
        conversationId,
        history: messageHistoryByConversation.get(getConversationKey(auth.tenant.tenantId, conversationId)) || [],
      });
    });

    socket.on("message:send", (payload, callback) => {
      const conversationId = payload?.conversationId;
      const body = payload?.body?.toString()?.trim();
      const sender = payload?.sender || auth.user.displayName || auth.user.email || "user";

      if (!conversationId || typeof conversationId !== "string") {
        safeAck(callback, { ok: false, error: "conversationId is required" });
        return;
      }

      if (!body) {
        safeAck(callback, { ok: false, error: "message body is required" });
        return;
      }

      const room = `tenant:${auth.tenant.tenantId}:conversation:${conversationId}`;
      const key = getConversationKey(auth.tenant.tenantId, conversationId);
      const message = buildMessage({
        conversationId,
        sender,
        body,
        tenantId: auth.tenant.tenantId,
      });

      const history = messageHistoryByConversation.get(key) || [];
      history.push(message);
      messageHistoryByConversation.set(key, history.slice(-100));

      io.to(room).emit("message:new", message);
      safeAck(callback, { ok: true, message });
    });

    socket.on("disconnect", async () => {
      try {
        await prisma.presenceSession.updateMany({
          where: {
            tenantId: auth.tenant.tenantId,
            userId: auth.user.id,
            connectionId: socket.id,
          },
          data: {
            status: "OFFLINE",
            lastSeenAt: new Date(),
          },
        });
      } catch (error) {
        logger.warn("presence_disconnect_update_failed", { error: error.message });
      }

      io.to(tenantRoom).emit("presence:update", {
        userId: auth.user.id,
        tenantId: auth.tenant.tenantId,
        status: "OFFLINE",
        socketId: socket.id,
        updatedAt: new Date().toISOString(),
      });
    });
  });
}
