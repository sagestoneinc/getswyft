// apps/api/src/index.js
import express from "express";
import http from "http";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Server } from "socket.io";

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
app.set("trust proxy", 1);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
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

/* ── Routing helpers ─────────────────────────────────────────────────────── */

function isAfterHours(officeHours, timezone) {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const weekdayPart = parts.find((p) => p.type === "weekday");
    const hourPart = parts.find((p) => p.type === "hour");
    const minutePart = parts.find((p) => p.type === "minute");

    const dayKey = weekdayPart?.value?.toLowerCase()?.slice(0, 3);

    const daySchedule = officeHours?.[dayKey];
    if (!daySchedule) return true;

    const currentTime = `${hourPart?.value?.padStart(2, "0")}:${minutePart?.value?.padStart(2, "0")}`;
    return currentTime < daySchedule.start || currentTime >= daySchedule.end;
  } catch {
    return true;
  }
}

async function routeConversation(tenantId) {
  const settings = await prisma.routingSettings.findUnique({ where: { tenantId } });
  if (!settings) {
    const agent = await prisma.agent.findFirst({ where: { tenantId }, select: { id: true } });
    return { agentId: agent?.id || null, afterHours: false };
  }

  const afterHours = isAfterHours(settings.officeHours, settings.timezone);

  if (afterHours) {
    return { agentId: settings.fallbackAgentId || null, afterHours: true };
  }

  if (settings.mode === "manual") {
    return { agentId: null, afterHours: false };
  }

  if (settings.mode === "round_robin") {
    const result = await prisma.$transaction(
      async (tx) => {
        const freshSettings = await tx.routingSettings.findUnique({
          where: { tenantId },
          select: { lastAssignedAgentId: true },
        });

        const agents = await tx.agent.findMany({
          where: { tenantId },
          orderBy: { email: "asc" },
          select: { id: true },
        });

        if (agents.length === 0) {
          return { agentId: null, afterHours: false };
        }

        const lastIdx = agents.findIndex(
          (a) => a.id === freshSettings?.lastAssignedAgentId
        );
        const nextIdx = (lastIdx + 1) % agents.length;
        const nextAgent = agents[nextIdx];

        await tx.routingSettings.update({
          where: { tenantId },
          data: { lastAssignedAgentId: nextAgent.id },
        });

        return { agentId: nextAgent.id, afterHours: false };
      },
      { isolationLevel: "Serializable" }
    );

    return result;
  }

  // first_available (default)
  const agent = await prisma.agent.findFirst({ where: { tenantId }, select: { id: true } });
  return { agentId: agent?.id || null, afterHours: false };
}

/* ── Webhook helpers ─────────────────────────────────────────────────────── */

const MAX_WEBHOOK_RETRY_ATTEMPTS = 8;
const WEBHOOK_TIMEOUT_MS = 10_000;

async function fireWebhooks(tenantId, eventType, payload) {
  try {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: { tenantId, isActive: true },
    });

    const safePayload = JSON.parse(JSON.stringify(payload));

    for (const ep of endpoints) {
      if (!ep.events.includes(eventType)) continue;

      await prisma.webhookDelivery.create({
        data: {
          endpointId: ep.id,
          eventType,
          payload: safePayload,
          status: "pending",
          attemptCount: 0,
          nextRetryAt: new Date(),
        },
      });
    }
  } catch (err) {
    console.error("fireWebhooks error:", err);
  }
}

async function processWebhookDeliveries() {
  try {
    const deliveries = await prisma.webhookDelivery.findMany({
      where: {
        status: "pending",
        nextRetryAt: { lte: new Date() },
      },
      include: { endpoint: true },
      take: 50,
    });

    for (const delivery of deliveries) {
      if (!delivery.endpoint || !delivery.endpoint.isActive) {
        await prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: { status: "skipped" },
        });
        continue;
      }

      const body = JSON.stringify(delivery.payload);
      const headers = { "Content-Type": "application/json" };
      if (delivery.endpoint.secret) {
        const sig = crypto.createHmac("sha256", delivery.endpoint.secret).update(body).digest("hex");
        headers["X-Signature"] = sig;
      }

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

        const resp = await fetch(delivery.endpoint.url, {
          method: "POST",
          headers,
          body,
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (resp.ok) {
          await prisma.webhookDelivery.update({
            where: { id: delivery.id },
            data: {
              status: "delivered",
              attemptCount: delivery.attemptCount + 1,
              lastResponseCode: resp.status,
            },
          });
        } else {
          await handleDeliveryRetry(delivery, resp.status);
        }
      } catch {
        await handleDeliveryRetry(delivery, null);
      }
    }
  } catch (err) {
    console.error("processWebhookDeliveries error:", err);
  }
}

async function handleDeliveryRetry(delivery, responseCode) {
  const newAttempt = delivery.attemptCount + 1;
  if (newAttempt >= MAX_WEBHOOK_RETRY_ATTEMPTS) {
    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "failed",
        attemptCount: newAttempt,
        lastResponseCode: responseCode,
      },
    });
  } else {
    const delayMs = Math.pow(2, newAttempt) * 1000;
    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        attemptCount: newAttempt,
        lastResponseCode: responseCode,
        nextRetryAt: new Date(Date.now() + delayMs),
      },
    });
  }
}

// Process webhook deliveries every 30 seconds (opt-in per instance)
if (process.env.WEBHOOK_DELIVERY_WORKER === "true") {
  setInterval(processWebhookDeliveries, 30_000);
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

app.post("/v1/agent/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "email and password required" });
    }

    const agent = await prisma.agent.findUnique({
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
    });
  } catch (err) {
    console.error("agent/login error:", err);
    return res.status(500).json({ error: "internal error" });
  }
});

/* ── GET /v1/agent/me ────────────────────────────────────────────────────── */

app.get("/v1/agent/me", apiLimiter, authenticateAgent, async (req, res) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: req.user.sub },
      select: { id: true, tenantId: true, name: true, email: true },
    });
    if (!agent) return res.status(404).json({ error: "agent not found" });
    return res.json({ agentId: agent.id, tenantId: agent.tenantId, name: agent.name, email: agent.email });
  } catch (err) {
    console.error("agent/me error:", err);
    return res.status(500).json({ error: "internal error" });
  }
});

/* ── Widget session with routing ─────────────────────────────────────────── */

app.post("/v1/widget/session", apiLimiter, async (req, res) => {
  try {
    const { tenantId, lead, listing, utm } = req.body || {};
    if (!tenantId) return res.status(400).json({ error: "tenantId required" });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, allowedOrigins: true },
    });

    if (!tenant) return res.status(404).json({ error: "tenant not found" });

    const origin = req.headers.origin;
    if (origin && Array.isArray(tenant.allowedOrigins) && tenant.allowedOrigins.length > 0) {
      if (!tenant.allowedOrigins.includes(origin)) {
        return res.status(403).json({ error: "origin not allowed" });
      }
    }

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

    const routing = await routeConversation(tenantId);

    const conversation = await prisma.conversation.create({
      data: {
        tenantId,
        status: "open",
        assignedAgentId: routing.agentId,
        source: "web",
        afterHours: routing.afterHours,
        leadName: lead?.name || null,
        leadEmail: lead?.email || null,
        leadPhone: lead?.phone || null,
        context: {
          listing: listing || {},
          utm: utm || {},
          url: listing?.url || null,
          createdAt: new Date().toISOString(),
        },
      },
      include: {
        assignedAgent: { select: { id: true, name: true, email: true } },
      },
    });

    const visitorJwt = signJwt(
      { sub: visitor.id, tenantId, role: "visitor" },
      "24h"
    );

    // Emit conversation.created to all tenant agents
    const convCreatedEvt = makeEvent("conversation.created", {
      tenantId,
      conversationId: conversation.id,
      payload: conversation,
    });
    io.to(`tenant:${tenantId}:agents`).emit("event", convCreatedEvt);

    // Fire webhook
    fireWebhooks(tenantId, "conversation.created", conversation);

    return res.json({
      visitorJwt,
      conversationId: conversation.id,
      visitorId: visitor.id,
      afterHours: routing.afterHours,
    });
  } catch (err) {
    console.error("widget/session error:", err);
    return res.status(500).json({ error: "internal error" });
  }
});

/* ── Agent conversations ─────────────────────────────────────────────────── */

app.get("/v1/agent/conversations", apiLimiter, authenticateAgent, async (req, res) => {
  try {
    const { status, assigned } = req.query || {};
    const where = { tenantId: req.user.tenantId };

    if (status) where.status = String(status);
    if (assigned === "me") where.assignedAgentId = req.user.sub;
    if (assigned === "unassigned") where.assignedAgentId = null;

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

/* ── Assign / Close / Reopen ─────────────────────────────────────────────── */

app.post(
  "/v1/agent/conversations/:id/assign",
  apiLimiter,
  authenticateAgent,
  async (req, res) => {
    try {
      const conversationId = req.params.id;
      const { agentId } = req.body || {};
      const assignTo = agentId || req.user.sub;

      const convo = await assertConversationTenant(conversationId, req.user.tenantId);
      if (!convo) return res.status(404).json({ error: "conversation not found" });

      const agent = await prisma.agent.findFirst({
        where: { id: assignTo, tenantId: req.user.tenantId },
      });
      if (!agent) return res.status(404).json({ error: "agent not found" });

      const updated = await prisma.conversation.update({
        where: { id: conversationId },
        data: { assignedAgentId: assignTo },
        include: {
          assignedAgent: { select: { id: true, name: true, email: true } },
        },
      });

      const evt = makeEvent("conversation.assigned", {
        tenantId: req.user.tenantId,
        conversationId,
        payload: updated,
      });
      io.to(`tenant:${req.user.tenantId}:agents`).emit("event", evt);
      io.to(conversationId).emit("event", evt);

      fireWebhooks(req.user.tenantId, "conversation.assigned", updated);

      return res.json(updated);
    } catch (err) {
      console.error("agent/conversations/assign error:", err);
      return res.status(500).json({ error: "internal error" });
    }
  }
);

app.post(
  "/v1/agent/conversations/:id/close",
  apiLimiter,
  authenticateAgent,
  async (req, res) => {
    try {
      const conversationId = req.params.id;

      const convo = await assertConversationTenant(conversationId, req.user.tenantId);
      if (!convo) return res.status(404).json({ error: "conversation not found" });

      const updated = await prisma.conversation.update({
        where: { id: conversationId },
        data: { status: "closed" },
      });

      return res.json(updated);
    } catch (err) {
      console.error("agent/conversations/close error:", err);
      return res.status(500).json({ error: "internal error" });
    }
  }
);

app.post(
  "/v1/agent/conversations/:id/reopen",
  apiLimiter,
  authenticateAgent,
  async (req, res) => {
    try {
      const conversationId = req.params.id;

      const convo = await assertConversationTenant(conversationId, req.user.tenantId);
      if (!convo) return res.status(404).json({ error: "conversation not found" });

      const updated = await prisma.conversation.update({
        where: { id: conversationId },
        data: { status: "open" },
      });

      return res.json(updated);
    } catch (err) {
      console.error("agent/conversations/reopen error:", err);
      return res.status(500).json({ error: "internal error" });
    }
  }
);

/* ── Routing settings ────────────────────────────────────────────────────── */

app.get("/v1/settings/routing", apiLimiter, authenticateAgent, async (req, res) => {
  try {
    const settings = await prisma.routingSettings.findUnique({
      where: { tenantId: req.user.tenantId },
    });
    if (!settings) return res.status(404).json({ error: "routing settings not found" });
    return res.json(settings);
  } catch (err) {
    console.error("settings/routing GET error:", err);
    return res.status(500).json({ error: "internal error" });
  }
});

app.put("/v1/settings/routing", apiLimiter, authenticateAgent, async (req, res) => {
  try {
    const { mode, timezone, officeHours, fallbackAgentId } = req.body || {};

    const VALID_MODES = ["manual", "first_available", "round_robin"];
    if (mode !== undefined && !VALID_MODES.includes(mode)) {
      return res.status(400).json({ error: `mode must be one of: ${VALID_MODES.join(", ")}` });
    }

    if (timezone !== undefined) {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: timezone });
      } catch {
        return res.status(400).json({ error: "invalid timezone" });
      }
    }

    if (officeHours !== undefined) {
      if (typeof officeHours !== "object" || officeHours === null || Array.isArray(officeHours)) {
        return res.status(400).json({ error: "officeHours must be an object" });
      }
      const validDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
      for (const [day, schedule] of Object.entries(officeHours)) {
        if (!validDays.includes(day)) {
          return res.status(400).json({ error: `invalid day: ${day}` });
        }
        if (!schedule || typeof schedule.start !== "string" || typeof schedule.end !== "string") {
          return res.status(400).json({ error: `officeHours.${day} must have start and end strings` });
        }
      }
    }

    const data = {};
    if (mode !== undefined) data.mode = mode;
    if (timezone !== undefined) data.timezone = timezone;
    if (officeHours !== undefined) data.officeHours = officeHours;
    if (fallbackAgentId !== undefined) data.fallbackAgentId = fallbackAgentId;

    const settings = await prisma.routingSettings.upsert({
      where: { tenantId: req.user.tenantId },
      update: data,
      create: { tenantId: req.user.tenantId, ...data },
    });

    return res.json(settings);
  } catch (err) {
    console.error("settings/routing PUT error:", err);
    return res.status(500).json({ error: "internal error" });
  }
});

/* ── Webhooks CRUD ───────────────────────────────────────────────────────── */

app.post("/v1/webhooks", apiLimiter, authenticateAgent, async (req, res) => {
  try {
    const { url, events, secret } = req.body || {};
    if (!url || !events || !Array.isArray(events)) {
      return res.status(400).json({ error: "url and events[] required" });
    }

    // Validate URL scheme
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: "invalid url" });
    }
    if (parsedUrl.protocol !== "https:") {
      return res.status(400).json({ error: "webhook url must use https" });
    }

    // Block private/loopback hostnames
    const hostname = parsedUrl.hostname.toLowerCase();
    const blocked =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "0.0.0.0" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal");
    if (blocked) {
      return res.status(400).json({ error: "webhook url must not target private/loopback addresses" });
    }

    // Validate event types
    const VALID_EVENTS = ["conversation.created", "conversation.assigned", "message.created"];
    const invalidEvents = events.filter((e) => !VALID_EVENTS.includes(e));
    if (invalidEvents.length > 0) {
      return res.status(400).json({ error: `invalid events: ${invalidEvents.join(", ")}` });
    }

    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        tenantId: req.user.tenantId,
        url,
        events,
        secret: secret || null,
        isActive: true,
      },
    });

    return res.status(201).json(endpoint);
  } catch (err) {
    console.error("webhooks POST error:", err);
    return res.status(500).json({ error: "internal error" });
  }
});

app.get("/v1/webhooks", apiLimiter, authenticateAgent, async (req, res) => {
  try {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: { tenantId: req.user.tenantId },
    });
    return res.json(endpoints);
  } catch (err) {
    console.error("webhooks GET error:", err);
    return res.status(500).json({ error: "internal error" });
  }
});

app.delete("/v1/webhooks/:id", apiLimiter, authenticateAgent, async (req, res) => {
  try {
    const endpoint = await prisma.webhookEndpoint.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId },
    });
    if (!endpoint) return res.status(404).json({ error: "webhook not found" });

    await prisma.webhookDelivery.deleteMany({ where: { endpointId: endpoint.id } });
    await prisma.webhookEndpoint.delete({ where: { id: endpoint.id } });

    return res.json({ ok: true });
  } catch (err) {
    console.error("webhooks DELETE error:", err);
    return res.status(500).json({ error: "internal error" });
  }
});

/* ── Messages ────────────────────────────────────────────────────────────── */

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
          senderType: req.user.role,
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

      io.to(conversationId).emit("event", evt);
      io.to(`tenant:${msg.tenantId}:agents`).emit("event", evt);

      fireWebhooks(msg.tenantId, "message.created", msg);

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
  const user = socket.data.user;

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
