import { env } from "../../config/env.js";
import { loadAccessContextFromClaims } from "../../lib/access-context.js";
import { verifyAccessToken } from "../../lib/auth-tokens.js";
import { getPrismaClient } from "../../lib/db.js";
import { logger } from "../../lib/logger.js";

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

function serializeSocketMessage(message) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    tenantId: message.conversation?.tenantId,
    sender: message.senderType === "AGENT" ? "agent" : message.senderType === "SYSTEM" ? "system" : "visitor",
    body: message.body,
    createdAt: message.createdAt instanceof Date ? message.createdAt.toISOString() : message.createdAt,
  };
}

function hasSocketPermission(auth, permission) {
  return auth?.tenant?.permissions?.includes(permission);
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

    socket.on("conversation:join", async ({ conversationId }, callback) => {
      if (!hasSocketPermission(auth, "conversation.read")) {
        safeAck(callback, { ok: false, error: "Missing permission: conversation.read" });
        return;
      }

      if (!conversationId || typeof conversationId !== "string") {
        safeAck(callback, { ok: false, error: "conversationId is required" });
        return;
      }

      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          tenantId: auth.tenant.tenantId,
        },
        select: {
          id: true,
        },
      });

      if (!conversation) {
        safeAck(callback, { ok: false, error: "Conversation not found" });
        return;
      }

      const room = `tenant:${auth.tenant.tenantId}:conversation:${conversationId}`;
      socket.join(room);

      const history = await prisma.conversationMessage.findMany({
        where: {
          conversationId,
          conversation: {
            tenantId: auth.tenant.tenantId,
          },
        },
        include: {
          conversation: {
            select: {
              tenantId: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 100,
      });

      safeAck(callback, {
        ok: true,
        tenantId: auth.tenant.tenantId,
        conversationId,
        history: history.map(serializeSocketMessage),
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

    socket.on("conversation:history", async ({ conversationId }, callback) => {
      if (!hasSocketPermission(auth, "conversation.read")) {
        safeAck(callback, { ok: false, error: "Missing permission: conversation.read" });
        return;
      }

      if (!conversationId || typeof conversationId !== "string") {
        safeAck(callback, { ok: false, error: "conversationId is required" });
        return;
      }

      const history = await prisma.conversationMessage.findMany({
        where: {
          conversationId,
          conversation: {
            tenantId: auth.tenant.tenantId,
          },
        },
        include: {
          conversation: {
            select: {
              tenantId: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 100,
      });

      safeAck(callback, {
        ok: true,
        conversationId,
        history: history.map(serializeSocketMessage),
      });
    });

    socket.on("message:send", async (payload, callback) => {
      if (!hasSocketPermission(auth, "conversation.write")) {
        safeAck(callback, { ok: false, error: "Missing permission: conversation.write" });
        return;
      }

      const conversationId = payload?.conversationId;
      const body = payload?.body?.toString()?.trim();

      if (!conversationId || typeof conversationId !== "string") {
        safeAck(callback, { ok: false, error: "conversationId is required" });
        return;
      }

      if (!body) {
        safeAck(callback, { ok: false, error: "message body is required" });
        return;
      }

      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          tenantId: auth.tenant.tenantId,
        },
        select: {
          id: true,
        },
      });

      if (!conversation) {
        safeAck(callback, { ok: false, error: "Conversation not found" });
        return;
      }

      const createdMessage = await prisma.$transaction(async (tx) => {
        const message = await tx.conversationMessage.create({
          data: {
            conversationId,
            senderType: "AGENT",
            senderUserId: auth.user.id,
            body,
          },
          include: {
            conversation: {
              select: {
                tenantId: true,
              },
            },
          },
        });

        await tx.messageReceipt.create({
          data: {
            messageId: message.id,
            userId: auth.user.id,
            deliveredAt: new Date(),
            readAt: new Date(),
          },
        });

        await tx.conversation.update({
          where: {
            id: conversationId,
          },
          data: {
            status: "OPEN",
            assignedUserId: auth.user.id,
            lastMessagePreview: body,
            lastMessageAt: message.createdAt,
          },
        });

        return message;
      });

      const room = `tenant:${auth.tenant.tenantId}:conversation:${conversationId}`;
      const message = serializeSocketMessage(createdMessage);

      io.to(room).emit("message:new", message);
      safeAck(callback, { ok: true, message });
    });

    function handleTyping(isTyping, { conversationId, channelId } = {}, callback) {
      if (!hasSocketPermission(auth, "conversation.write")) {
        safeAck(callback, { ok: false, error: "Missing permission: conversation.write" });
        return;
      }

      if (!conversationId && !channelId) {
        safeAck(callback, { ok: false, error: "conversationId or channelId is required" });
        return;
      }

      const room = conversationId
        ? `tenant:${auth.tenant.tenantId}:conversation:${conversationId}`
        : `tenant:${auth.tenant.tenantId}:channel:${channelId}`;

      const displayName = auth.user.displayName || auth.user.email;

      socket.to(room).emit("typing:update", {
        userId: auth.user.id,
        displayName,
        ...(conversationId ? { conversationId } : { channelId }),
        isTyping,
      });

      safeAck(callback, { ok: true });
    }

    socket.on("typing:start", (payload, callback) => handleTyping(true, payload, callback));
    socket.on("typing:stop", (payload, callback) => handleTyping(false, payload, callback));

    socket.on("channel:join", async ({ channelId } = {}, callback) => {
      if (!hasSocketPermission(auth, "conversation.read")) {
        safeAck(callback, { ok: false, error: "Missing permission: conversation.read" });
        return;
      }

      if (!channelId || typeof channelId !== "string") {
        safeAck(callback, { ok: false, error: "channelId is required" });
        return;
      }

      const channel = await prisma.channel.findFirst({
        where: {
          id: channelId,
          tenantId: auth.tenant.tenantId,
        },
        select: {
          id: true,
        },
      });

      if (!channel) {
        safeAck(callback, { ok: false, error: "Channel not found" });
        return;
      }

      const room = `tenant:${auth.tenant.tenantId}:channel:${channelId}`;
      socket.join(room);

      safeAck(callback, { ok: true, channelId });
    });

    socket.on("channel:leave", ({ channelId } = {}, callback) => {
      if (!channelId || typeof channelId !== "string") {
        safeAck(callback, { ok: false, error: "channelId is required" });
        return;
      }

      const room = `tenant:${auth.tenant.tenantId}:channel:${channelId}`;
      socket.leave(room);
      safeAck(callback, { ok: true, channelId });
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
