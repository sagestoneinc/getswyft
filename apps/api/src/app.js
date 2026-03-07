import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { requestContextMiddleware } from "./lib/request-context.js";
import { authenticateRequest } from "./middleware/auth.js";
import { resolveTenant } from "./middleware/tenant.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { tenantRouter } from "./modules/tenants/tenant.routes.js";
import { userRouter } from "./modules/users/user.routes.js";
import { notificationRouter } from "./modules/notifications/notification.routes.js";
import { storageRouter } from "./modules/storage/storage.routes.js";
import { analyticsRouter } from "./modules/analytics/analytics.routes.js";
import { auditRouter } from "./modules/audit/audit.routes.js";
import { messagingRouter } from "./modules/messaging/messaging.routes.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGINS.length ? env.CORS_ORIGINS : true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(requestContextMiddleware);

  app.use((req, res, next) => {
    res.setHeader("x-request-id", req.context.requestId);
    next();
  });

  app.use(authenticateRequest);
  app.use(resolveTenant);

  app.get("/", (_req, res) => {
    res.json({
      ok: true,
      name: "getswyft-api",
      message: "Foundation API is running",
      version: "v1",
    });
  });

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/v1/auth", authRouter);
  app.use("/v1/tenants", tenantRouter);
  app.use("/v1/users", userRouter);
  app.use("/v1/notifications", notificationRouter);
  app.use("/v1/storage", storageRouter);
  app.use("/v1/analytics", analyticsRouter);
  app.use("/v1/audit-logs", auditRouter);
  app.use("/v1", messagingRouter);

  app.use((error, req, res, _next) => {
    const statusCode = error.statusCode || 500;
    logger.error("request_failed", {
      requestId: req.context?.requestId,
      path: req.path,
      method: req.method,
      statusCode,
      error: error.message,
    });

    res.status(statusCode).json({
      ok: false,
      error: error.publicMessage || "Internal server error",
      requestId: req.context?.requestId,
    });
  });

  return app;
}
