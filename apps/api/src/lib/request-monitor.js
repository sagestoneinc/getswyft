import { env } from "../config/env.js";

function normalizePath(pathname) {
  return String(pathname || "/")
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, ":id")
    .replace(/\/\d+(?=\/|$)/g, "/:id")
    .replace(/\/[A-Za-z0-9_-]{20,}(?=\/|$)/g, "/:id");
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export class RequestMonitor {
  constructor({
    windowMs = 5 * 60 * 1000,
    errorThreshold = 10,
    errorRateThreshold = 0.2,
    maxEvents = 5000,
  } = {}) {
    this.windowMs = windowMs;
    this.errorThreshold = errorThreshold;
    this.errorRateThreshold = errorRateThreshold;
    this.maxEvents = maxEvents;
    this.events = [];
  }

  record({
    method,
    path,
    statusCode,
    durationMs,
    timestamp = Date.now(),
  }) {
    this.events.push({
      method: String(method || "GET").toUpperCase(),
      path: normalizePath(path),
      statusCode: Number(statusCode) || 0,
      durationMs: Number(durationMs) || 0,
      timestamp,
    });

    if (this.events.length > this.maxEvents) {
      this.events.splice(0, this.events.length - this.maxEvents);
    }
  }

  prune(now = Date.now()) {
    const cutoff = now - this.windowMs;
    let removeCount = 0;

    while (removeCount < this.events.length && this.events[removeCount].timestamp < cutoff) {
      removeCount += 1;
    }

    if (removeCount > 0) {
      this.events.splice(0, removeCount);
    }
  }

  snapshot(now = Date.now()) {
    this.prune(now);

    const totalRequests = this.events.length;
    const serverErrorEvents = this.events.filter((event) => event.statusCode >= 500);
    const clientErrorEvents = this.events.filter((event) => event.statusCode >= 400 && event.statusCode < 500);
    const errorRate = totalRequests > 0 ? serverErrorEvents.length / totalRequests : 0;

    const endpointFailures = new Map();
    for (const event of serverErrorEvents) {
      const key = `${event.method} ${event.path}`;
      const current = endpointFailures.get(key) || {
        method: event.method,
        path: event.path,
        count: 0,
        lastStatusCode: event.statusCode,
        lastSeenAt: event.timestamp,
      };
      current.count += 1;
      current.lastStatusCode = event.statusCode;
      current.lastSeenAt = Math.max(current.lastSeenAt, event.timestamp);
      endpointFailures.set(key, current);
    }

    const topFailingEndpoints = Array.from(endpointFailures.values())
      .sort((left, right) => right.count - left.count || right.lastSeenAt - left.lastSeenAt)
      .slice(0, 8)
      .map((entry) => ({
        ...entry,
        lastSeenAt: new Date(entry.lastSeenAt).toISOString(),
      }));

    const ready =
      serverErrorEvents.length < this.errorThreshold ||
      errorRate < this.errorRateThreshold;

    return {
      ready,
      windowMs: this.windowMs,
      totalRequests,
      serverErrors: serverErrorEvents.length,
      clientErrors: clientErrorEvents.length,
      errorRate: Number(errorRate.toFixed(4)),
      topFailingEndpoints,
      generatedAt: new Date(now).toISOString(),
    };
  }
}

export const requestMonitor = new RequestMonitor({
  windowMs: toNumber(env.REQUEST_MONITOR_WINDOW_MS, 5 * 60 * 1000),
  errorThreshold: toNumber(env.REQUEST_MONITOR_ERROR_THRESHOLD, 10),
  errorRateThreshold: Number(env.REQUEST_MONITOR_ERROR_RATE_THRESHOLD) || 0.2,
});

export function requestMonitorMiddleware(req, res, next) {
  const startedAt = process.hrtime.bigint();
  const originalPath = req.path;
  const originalMethod = req.method;

  res.on("finish", () => {
    if (originalPath.startsWith("/health")) {
      return;
    }

    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    requestMonitor.record({
      method: originalMethod,
      path: originalPath,
      statusCode: res.statusCode,
      durationMs,
    });
  });

  next();
}
