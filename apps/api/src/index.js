import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("JWT_SECRET environment variable is required");
  process.exit(1);
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

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
app.post("/v1/agent/login", (req, res) => {
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

app.get("/v1/agent/conversations", authMiddleware, (_req, res) => {
  res.json({ conversations });
});

app.post("/v1/agent/conversations/:conversationId/messages", authMiddleware, (req, res) => {
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
