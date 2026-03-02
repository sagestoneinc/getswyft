// apps/api/src/index.js
import express from "express";
import http from "http";
import cors from "cors";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";

/* ────────────────────────────────────────────────────────────────────────── */
/* Env + bootstrap                                                           */
/* ────────────────────────────────────────────────────────────────────────── */

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("Fatal: JWT_SECRET environment variable is required");
  process.exit(1);
}

const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();
app.set("trust proxy", 1); // important for rate limiting behind Railway proxy

app.use(
  cors({
    origin: (origin, cb) => {
      // allow server-to-server tools (curl/postman) with no Origin
      if (!origin) return cb(null, true);
      // if you didn't set CORS_ORIGINS, allow all (dev convenience)
      if (allowedOrigins.length === 0) return cb(null, true);
      return cb(null, allowedOrigins.includes(origin));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

/* ────────────────────────────────────────────────────────────────────────── */
/* Rate limiters                                                             */
/* ────────────────────────────────────────────────────────────────────────── */

const loginLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

/* ────────────────────────────────────────────────────────────────────────── */
/* HTTP server + Socket.IO                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true,
  },
  // Railway edge keep-alive is ~60s; keep Socket.IO heartbeats tighter.
  pingInterval: 25_000,
  pingTimeout: 20_000,
});

/* ────────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

function signJwt({ sub, tenantId, role }, expiresIn) {
  return jwt.sign({ sub, tenantId, role }, JWT_SECRET, { expiresIn });
}

function makeEvent(type, { tenantId, conversationId, payload }) {
  return {
    id: crypto.randomUUID(),
    type,
    ts: new Date().toISOString(),
    tenantId,
    conversationId,
    payload,
  };
}

async function assertConversationTenant(conversationId, tenantId) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, tenantId: true },
  });
  if (!conversation) return null;
  if (conversation.tenantId !== tenantId) return null;
  return conversation;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Auth middleware                                                           */
/* ────────────────────────────────────────────────────────────────────────── */

function authenticateAny(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "missing token" });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: "invalid token" });
  }
}

function authenticateAgent(req, res, next) {
  authenticateAny(req, res, () => {
    if (req.user?.role !== "agent") {
      return res.status(403).json({ error: "agent token required" });
    }
    return next();
  });
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Routes                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

app.get("/health", (_req, res) => res.json({ ok: true }));

/**
 * POST /v1/agent/login
 * body: { email, password }
 * returns: { agentJwt, agentId, tenantId, name }
 */
app.post("/v1/agent/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "email and password required" });
    }

    const agent = await prisma.agent.findFirst({
      where: { email },
      select: { id: true, tenantId: true, email: true, name: true, passwordHash: true },
    });

    if (!agent) return res.status(401).json({ error: "invalid credentials" });

    const valid = await bcrypt.compare(password, agent.passwordHash);
    if (!valid) return res.status(401).json({ error: "invalid credentials" });

    const agentJwt = signJwt(
      { sub: agent.id, tenantId: agent.tenantId, role: "agent" },
      "8h"
    );

    return res.json({
      agentJwt,
      agentId: agent.id,
      tenantId: agent.tenantId,
      name: agent.name,
      email: agent.email,
    });
  } catch (err) {
    console.error("agent/login error:", err);
    return res.status(500).json({ error: "internal error" });
  }
});

/**
 * POST /v1/widget/session
 * body: { tenantId, lead?, listing?, utm? }
 * Validates Origin against tenant.allowedOrigins (if provided).
 * returns: { visitorJwt, conversationId, visitorId }
 */
app.post("/v1/widget/session", apiLimiter, async (req, res) => {
  try {
    const { tenantId, lead, listing, utm } = req.body || {};
    if (!tenantId) return res.status(400).json({ error: "tenantId required" });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, allowedOrigins: true },
    });

    if (!tenant) return res.status(404).json({ error: "tenant not found" });

    // Origin allowlist (MVP protection)
    const origin = req.headers.origin;
    if (origin && Array.isArray(tenant.allowedOrigins) && tenant.allowedOrigins.length > 0) {
      if (!tenant.allowedOrigins.includes(origin)) {
        return res.status(403).json({ error: "origin not allowed" });
      }
    }

    // Find or create visitor (by email if provided)
    let visitor = null;
    if (lead?.email) {
      visitor = await prisma.visitor.findFirst({
        where: { tenantId, email: lead.email },
      });
    }

    if (!visitor) {
      visitor = await prisma.visitor.create({
        data: {
          tenantId,
          name: lead?.name || null,
          email: lead?.email || null,
          phone: lead?.phone || null,
        },
      });
    }

    // Assign to first agent in tenant (MVP)
    const agent = await prisma.agent.findFirst({
      where: { tenantId },
      select: { id: true },
    });

    // Create conversation (status defaults to "open" if your schema has a default)
    const conversation = await prisma.conversation.create({
      data: {
        tenantId,
        status: "open",
        assignedAgentId: agent?.id || null,
        context: {
          listing: listing || {},
          utm: utm || {},
          url: listing?.url || null,
          createdAt: new Date().toISOString(),
        },
      },
      select: { id: true, tenantId: true, assignedAgentId: true },
    });

    const visitorJwt = signJwt(
      { sub: visitor.id, tenantId, role: "visitor" },
      "24h"
    );

    // Notify assigned agent (if connected) that a new conversation exists
    if (conversation.assignedAgentId) {
      const evt = makeEvent("conversation.created", {
        tenantId,
        conversationId: conversation.id,
        payload: { conversationId: conversation.id },
      });
      io.to(`agent:${conversation.assignedAgentId}`).emit("event", evt);
    }

    return res.json({
      visitorJwt,
      conversationId: conversation.id,
      visitorId: visitor.id,
    });
  } catch (err) {
    console.error("widget/session error:", err);
    return res.status(500).json({ error: "internal error" });
  }
});

/**
 * GET /v1/agent/conversations?status=open|closed&assigned=me|all
 * returns list of conversations with last message preview
 */
app.get("/v1/agent/conversations", apiLimiter, authenticateAgent, async (req, res) => {
  try {
    const { status, assigned } = req.query || {};
    const where = { tenantId: req.user.tenantId };

    if (status) where.status = String(status);
    if (assigned === "me") where.assignedAgentId = req.user.sub;

    const conversations = await prisma.conversation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        assignedAgent: { select: { id: true, name: true, email: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    return res.json(conversations);
  } catch (err) {
    console.error("agent/conversations error:", err);
    return res.status(500).json({ error: "internal error" });
  }
});

/**
 * GET /v1/agent/conversations/:id/messages
 * returns messages ASC
 */
app.get(
  "/v1/agent/conversations/:id/messages",
  apiLimiter,
  authenticateAgent,
  async (req, res) => {
    try {
      const conversationId = req.params.id;

      const convo = await assertConversationTenant(conversationId, req.user.tenantId);
      if (!convo) return res.status(404).json({ error: "conversation not found" });

      const msgs = await prisma.message.findMany({
        where: { tenantId: req.user.tenantId, conversationId },
        orderBy: { createdAt: "asc" },
      });

      return res.json(msgs);
    } catch (err) {
      console.error("agent/conversation/messages error:", err);
      return res.status(500).json({ error: "internal error" });
    }
  }
);

/**
 * POST /v1/conversations/:id/messages
 * Auth: agent or visitor
 * body: { text, clientMsgId }
 * idempotent by (conversationId, clientMsgId)
 */
app.post(
  "/v1/conversations/:id/messages",
  apiLimiter,
  authenticateAny,
  async (req, res) => {
    try {
      const conversationId = req.params.id;
      const { text, clientMsgId } = req.body || {};
      if (!text) return res.status(400).json({ error: "text is required" });

      const convo = await assertConversationTenant(conversationId, req.user.tenantId);
      if (!convo) return res.status(404).json({ error: "conversation not found" });

      if (clientMsgId) {
        const existing = await prisma.message.findFirst({
          where: {
            tenantId: req.user.tenantId,
            conversationId,
            clientMsgId,
          },
        });
        if (existing) return res.json(existing);
      }

      const msg = await prisma.message.create({
        data: {
          tenantId: req.user.tenantId,
          conversationId,
          senderType: req.user.role, // 'agent' | 'visitor'
          senderId: req.user.sub,
          text,
          clientMsgId: clientMsgId || null,
        },
      });

      const evt = makeEvent("message.created", {
        tenantId: msg.tenantId,
        conversationId: msg.conversationId,
        payload: msg,
      });

      // broadcast to participants currently in the conversation room
      io.to(conversationId).emit("event", evt);

      // optional: also notify assigned agent’s personal room (for inbox updates)
      // (safe even if no one is listening)
      io.to(`tenant:${msg.tenantId}:agents`).emit("event", evt);

      return res.status(201).json(msg);
    } catch (err) {
      console.error("conversations/:id/messages error:", err);
      return res.status(500).json({ error: "internal error" });
    }
  }
);

/* ────────────────────────────────────────────────────────────────────────── */
/* Socket.IO auth + rooms                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("authentication required"));
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    socket.data.user = payload;
    return next();
  } catch {
    return next(new Error("invalid token"));
  }
});

io.on("connection", (socket) => {
  const user = socket.data.user; // { sub, tenantId, role }

  // agent personal room + tenant agents room
  if (user.role === "agent") {
    socket.join(`agent:${user.sub}`);
    socket.join(`tenant:${user.tenantId}:agents`);
  }

  socket.on("join", async (conversationId, ack) => {
    try {
      if (!conversationId) throw new Error("conversationId required");

      const convo = await assertConversationTenant(conversationId, user.tenantId);
      if (!convo) throw new Error("conversation not found");

      socket.join(conversationId);

      // send last 50 messages as history
      const history = await prisma.message.findMany({
        where: { tenantId: user.tenantId, conversationId },
        orderBy: { createdAt: "asc" },
        take: 50,
      });

      socket.emit(
        "event",
        makeEvent("conversation.history", {
          tenantId: user.tenantId,
          conversationId,
          payload: { messages: history },
        })
      );

      if (typeof ack === "function") ack({ ok: true });
    } catch (e) {
      if (typeof ack === "function") ack({ ok: false, error: e.message });
    }
  });

  socket.on("leave", (conversationId, ack) => {
    if (conversationId) socket.leave(conversationId);
    if (typeof ack === "function") ack({ ok: true });
  });
});

/* ────────────────────────────────────────────────────────────────────────── */
/* Start                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

const PORT = Number(process.env.PORT || 3000);
server.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
});

/* Graceful shutdown */
process.on("SIGTERM", async () => {
  try {
    await prisma.$disconnect();
  } finally {
    process.exit(0);
  }
});
process.on("SIGINT", async () => {
  try {
    await prisma.$disconnect();
  } finally {
    process.exit(0);
  }
});
