import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import crypto from "crypto";

const PORT = Number(process.env.PORT) || 8080;
const SHUTDOWN_TIMEOUT_MS = 10000;
const CORS_ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

class LRUConversationMap extends Map {
  constructor(maxSize = 1000) {
    super();
    this.maxSize = maxSize;
  }

  get(key) {
    if (!super.has(key)) {
      return undefined;
    }
    const value = super.get(key);
    super.delete(key);
    super.set(key, value);
    return value;
  }

  set(key, value) {
    if (super.has(key)) {
      super.delete(key);
    }
    const result = super.set(key, value);
    if (this.maxSize > 0 && this.size >= this.maxSize) {
      const oldestKey = this.keys().next().value;
      if (oldestKey !== undefined) {
        super.delete(oldestKey);
      }
    }
    return result;
  }
}

const messageHistoryByConversation = new LRUConversationMap(1000);

const app = express();
app.use(
  cors({
    origin: CORS_ORIGINS.length ? CORS_ORIGINS : false,
    credentials: CORS_ORIGINS.length > 0,
  })
);
app.use(express.json());

app.get("/", (_, res) => {
  res.json({
    name: "getswyft-api",
    ok: true,
    message: "Socket.IO API is running",
  });
});

app.get("/health", (_, res) => {
  res.json({
    ok: true,
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGINS.length ? CORS_ORIGINS : false,
    credentials: CORS_ORIGINS.length > 0,
  },
  // keep connections alive under Railway edge timeouts
  pingInterval: 25000,
  pingTimeout: 20000,
});

function safeAck(callback, payload) {
  if (typeof callback === "function") {
    callback(payload);
  }
}

function buildMessage({ conversationId, sender, body }) {
  return {
    id: crypto.randomUUID(),
    conversationId,
    sender: sender || "visitor",
    body,
    createdAt: new Date().toISOString(),
  };
}

io.on("connection", (socket) => {
  socket.emit("system:ready", {
    socketId: socket.id,
    connectedAt: new Date().toISOString(),
  });

  socket.on("conversation:join", (payload = {}, callback) => {
    const { conversationId } = payload;
    if (!conversationId || typeof conversationId !== "string") {
      safeAck(callback, { ok: false, error: "conversationId is required" });
      return;
    }

    socket.join(conversationId);
    const history = messageHistoryByConversation.get(conversationId) || [];
    safeAck(callback, { ok: true, conversationId, history });
  });

  socket.on("conversation:leave", (payload = {}, callback) => {
    const { conversationId } = payload;
    if (!conversationId || typeof conversationId !== "string") {
      safeAck(callback, { ok: false, error: "conversationId is required" });
      return;
    }

    socket.leave(conversationId);
    safeAck(callback, { ok: true, conversationId });
  });

  socket.on("conversation:history", (payload = {}, callback) => {
    const { conversationId } = payload;
    if (!conversationId || typeof conversationId !== "string") {
      safeAck(callback, { ok: false, error: "conversationId is required" });
      return;
    }

    safeAck(callback, {
      ok: true,
      conversationId,
      history: messageHistoryByConversation.get(conversationId) || [],
    });
  });

  socket.on("message:send", (payload, callback) => {
    const conversationId = payload?.conversationId;
    const body = payload?.body?.toString()?.trim();
    const sender = payload?.sender;

    if (!conversationId || typeof conversationId !== "string") {
      safeAck(callback, { ok: false, error: "conversationId is required" });
      return;
    }

    if (!body) {
      safeAck(callback, { ok: false, error: "message body is required" });
      return;
    }

    const message = buildMessage({ conversationId, sender, body });
    const history = messageHistoryByConversation.get(conversationId) || [];
    history.push(message);
    messageHistoryByConversation.set(conversationId, history.slice(-100));

    io.to(conversationId).emit("message:new", message);
    safeAck(callback, { ok: true, message });
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`API listening on port ${PORT}`);
});

function shutdown(signal) {
  console.log(`Received ${signal}; shutting down.`);

  const forceExitTimeout = setTimeout(() => {
    console.error("Shutdown taking too long; forcing exit.");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  io.close(() => {
    server.close(() => {
      clearTimeout(forceExitTimeout);
      process.exit(0);
    });
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
