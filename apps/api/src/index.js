import http from "http";
import { Server } from "socket.io";
import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { logger } from "./lib/logger.js";
import { getPrismaClient } from "./lib/db.js";
import { getRedisClient } from "./lib/redis.js";
import { registerPresenceSocket } from "./modules/presence/presence.socket.js";

const app = createApp();
const server = http.createServer(app);
let shuttingDown = false;

const io = new Server(server, {
  cors: {
    origin: env.CORS_ORIGINS.length ? env.CORS_ORIGINS : true,
    credentials: true,
  },
  pingInterval: 25000,
  pingTimeout: 20000,
});

app.set("io", io);
registerPresenceSocket(io);

server.listen(env.PORT, "0.0.0.0", () => {
  logger.info("api_server_started", {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    authProvider: env.AUTH_PROVIDER,
    storageProvider: env.STORAGE_PROVIDER,
  });
});

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  logger.info("shutdown_requested", { signal });

  server.close(async () => {
    try {
      await getPrismaClient().$disconnect();
      const redis = getRedisClient();
      if (redis) {
        await redis.quit();
      }
    } catch (error) {
      logger.warn("shutdown_cleanup_error", { error: error.message });
    } finally {
      process.exit(0);
    }
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (error) => {
  logger.error("unhandled_rejection", {
    error: error instanceof Error ? error.message : String(error),
  });
  shutdown("unhandledRejection");
});
process.on("uncaughtException", (error) => {
  logger.error("uncaught_exception", {
    error: error instanceof Error ? error.message : String(error),
  });
  shutdown("uncaughtException");
});
