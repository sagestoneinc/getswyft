import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import rateLimit from "express-rate-limit";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("JWT_SECRET environment variable is required");
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("Fatal: JWT_SECRET environment variable is required");
  process.exit(1);
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

/* ---------- rate limiters ---------- */
const loginLimiter = rateLimit({ windowMs: 60_000, max: 10 });
const apiLimiter = rateLimit({ windowMs: 60_000, max: 60 });

app.get("/health", (_, res) => res.json({ ok: true }));

/* ---------- in-memory stores ---------- */
// password hash: scrypt(password, salt) stored as salt:hash
function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
}

const agents = [
  { id: "agent-1", email: "agent@example.com", passwordHash: hashPassword("password"), name: "Demo Agent" },
];

const conversations = [
  { id: "conv-1", title: "Alice – Pricing inquiry", createdAt: new Date().toISOString() },
  { id: "conv-2", title: "Bob – Schedule a viewing", createdAt: new Date().toISOString() },
];

const messages = {
  "conv-1": [
    { id: "msg-1", conversationId: "conv-1", sender: "visitor", body: "Hi, what is the price?", createdAt: new Date().toISOString() },
  ],
  "conv-2": [
    { id: "msg-2", conversationId: "conv-2", sender: "visitor", body: "Can I schedule a viewing?", createdAt: new Date().toISOString() },
  ],
};

/* ---------- auth middleware ---------- */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }
  try {
    req.agent = jwt.verify(header.split(" ")[1], JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* ---------- REST routes ---------- */
app.post("/v1/agent/login", loginLimiter, (req, res) => {
  const { email, password } = req.body;
  const agent = agents.find((a) => a.email === email);
  if (!agent || !verifyPassword(password, agent.passwordHash)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ id: agent.id, email: agent.email, name: agent.name }, JWT_SECRET, {
    expiresIn: "8h",
  });
  res.json({ token, agent: { id: agent.id, email: agent.email, name: agent.name } });
});

app.get("/v1/agent/conversations", apiLimiter, authMiddleware, (_req, res) => {
  res.json({ conversations });
});

app.post("/v1/agent/conversations/:conversationId/messages", apiLimiter, authMiddleware, (req, res) => {
  const { conversationId } = req.params;
  const { body } = req.body;
  if (!body) return res.status(400).json({ error: "body is required" });
  if (!messages[conversationId]) messages[conversationId] = [];
  const msg = {
    id: crypto.randomUUID(),
    conversationId,
    sender: "agent",
    body,
    createdAt: new Date().toISOString(),
  };
  messages[conversationId].push(msg);
  io.to(conversationId).emit("message.created", msg);
  res.status(201).json(msg);
});

/* ---------- HTTP server + Socket.IO ---------- */
// ─── HTTP server + Socket.IO ──────────────────────────────────────────────────
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: true, credentials: true },
  pingInterval: 25000,
  pingTimeout: 20000,
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication required"));
  try {
    socket.agent = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    next(new Error("Invalid token"));
// ─── Health ───────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ ok: true }));
app.post("/health", (_req, res) => res.json({ ok: true }));

// ─── Agent login ──────────────────────────────────────────────────────────────
app.post("/v1/agent/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password required" });
    }

    const agent = await prisma.agent.findFirst({ where: { email } });
    if (!agent) {
      return res.status(401).json({ error: "invalid credentials" });
    }

    const valid = await bcrypt.compare(password, agent.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "invalid credentials" });
    }

    const agentJwt = jwt.sign(
      { sub: agent.id, tenantId: agent.tenantId, role: "agent" },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({ agentJwt, agentId: agent.id, name: agent.name });
  } catch (err) {
    console.error("agent/login error:", err);
    return res.status(500).json({ error: "internal error" });
  }
});

// ─── Auth middleware ──────────────────────────────────────────────────────────
function authenticateAgent(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "missing token" });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    if (payload.role !== "agent") {
      return res.status(403).json({ error: "agent token required" });
    }
    req.agent = payload;
    next();
  } catch {
    return res.status(401).json({ error: "invalid token" });
  }
}

function authenticateAny(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "missing token" });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "invalid token" });
  }
}

// ─── Widget session ───────────────────────────────────────────────────────────
app.post("/v1/widget/session", async (req, res) => {
  try {
    const { tenantId, lead, listing, utm } = req.body;
    if (!tenantId) {
      return res.status(400).json({ error: "tenantId required" });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return res.status(404).json({ error: "tenant not found" });
    }

    // Validate Origin
    const origin = req.headers.origin;
    if (origin && tenant.allowedOrigins.length > 0) {
      if (!tenant.allowedOrigins.includes(origin)) {
        return res.status(403).json({ error: "origin not allowed" });
      }
    }

    // Find or create visitor
    let visitor;
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

    // Assign to first available agent in tenant (MVP)
    const agent = await prisma.agent.findFirst({ where: { tenantId } });

    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        tenantId,
        assignedAgentId: agent?.id || null,
        context: {
          listing: listing || {},
          utm: utm || {},
          url: listing?.url || null,
        },
      },
    });

    const visitorJwt = jwt.sign(
      { sub: visitor.id, tenantId, role: "visitor" },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

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

// ─── Agent conversations ─────────────────────────────────────────────────────
app.get("/v1/agent/conversations", authenticateAgent, async (req, res) => {
  try {
    const { status, assigned } = req.query;
    const where = { tenantId: req.agent.tenantId };

    if (status) where.status = status;
    if (assigned === "me") where.assignedAgentId = req.agent.sub;

    const conversations = await prisma.conversation.findMany({
      where,
      orderBy: { id: "desc" },
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

// ─── Conversation messages ────────────────────────────────────────────────────
app.get(
  "/v1/agent/conversations/:id/messages",
  authenticateAgent,
  async (req, res) => {
    try {
      const messages = await prisma.message.findMany({
        where: {
          conversationId: req.params.id,
          tenantId: req.agent.tenantId,
        },
        orderBy: { createdAt: "asc" },
      });
      return res.json(messages);
    } catch (err) {
      console.error("conversation/messages error:", err);
      return res.status(500).json({ error: "internal error" });
    }
  }
);

// ─── Post message (agent or visitor) ─────────────────────────────────────────
app.post(
  "/v1/conversations/:id/messages",
  authenticateAny,
  async (req, res) => {
    try {
      const { text, clientMsgId } = req.body;
      const conversationId = req.params.id;
      const user = req.user;

      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });
      if (!conversation || conversation.tenantId !== user.tenantId) {
        return res.status(404).json({ error: "conversation not found" });
      }

      // Idempotency: if clientMsgId already exists, return existing message
      if (clientMsgId) {
        const existing = await prisma.message.findFirst({
          where: { conversationId, clientMsgId },
        });
        if (existing) {
          return res.json(existing);
        }
      }

      const message = await prisma.message.create({
        data: {
          tenantId: user.tenantId,
          conversationId,
          senderType: user.role,
          senderId: user.sub,
          text: text || null,
          clientMsgId: clientMsgId || null,
        },
      });

      // Emit via Socket.IO
      io.to(conversationId).emit("message.created", {
        id: message.id,
        type: "message.created",
        ts: message.createdAt.toISOString(),
        tenantId: message.tenantId,
        conversationId: message.conversationId,
        payload: message,
      });

      return res.status(201).json(message);
    } catch (err) {
      console.error("conversations/messages error:", err);
      return res.status(500).json({ error: "internal error" });
    }
  }
);

// ─── Socket.IO auth + rooms ──────────────────────────────────────────────────
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error("authentication required"));
  }
  try {
    socket.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return next(new Error("invalid token"));
  }
});

io.on("connection", (socket) => {
  socket.on("join", (conversationId) => {
    socket.join(conversationId);
    const history = messages[conversationId] || [];
    socket.emit("history", history);
  });

  socket.on("leave", (conversationId) => {
    socket.leave(conversationId);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`API listening on :${PORT}`));
  });
});

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
});
