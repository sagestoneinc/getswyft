import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import crypto from "crypto";

const PORT = Number(process.env.PORT) || 8080;
const CORS_ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const messageHistoryByConversation = new Map();

const app = express();
app.use(
  cors({
    origin: CORS_ORIGINS.length ? CORS_ORIGINS : true,
    credentials: true,
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
    origin: CORS_ORIGINS.length ? CORS_ORIGINS : true,
    credentials: true,
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

  socket.on("conversation:join", ({ conversationId }, callback) => {
    if (!conversationId || typeof conversationId !== "string") {
      safeAck(callback, { ok: false, error: "conversationId is required" });
      return;
    }

    socket.join(conversationId);
    const history = messageHistoryByConversation.get(conversationId) || [];
    safeAck(callback, { ok: true, conversationId, history });
  });

  socket.on("conversation:leave", ({ conversationId }, callback) => {
    if (!conversationId || typeof conversationId !== "string") {
      safeAck(callback, { ok: false, error: "conversationId is required" });
      return;
    }

    socket.leave(conversationId);
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
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
