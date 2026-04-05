import { env } from "../config/env.js";

const buckets = new Map();

function now() {
  return Date.now();
}

function getBucket(key, windowMs) {
  const cutoff = now() - windowMs;
  const existing = buckets.get(key) || [];
  const recent = existing.filter((entry) => entry > cutoff);
  buckets.set(key, recent);
  return recent;
}

function recordHit(key, windowMs) {
  const bucket = getBucket(key, windowMs);
  bucket.push(now());
  buckets.set(key, bucket);
  return bucket.length;
}

function keyFromRequest(req, name) {
  const authKey = req.auth?.subject || req.ip || req.socket?.remoteAddress || "anonymous";
  return `${name}:${authKey}`;
}

export function createRateLimitMiddleware({ name, max, windowMs, message }) {
  return function rateLimitMiddleware(req, res, next) {
    const current = recordHit(keyFromRequest(req, name), windowMs);
    if (current <= max) {
      return next();
    }

    res.setHeader("Retry-After", String(Math.ceil(windowMs / 1000)));
    return res.status(429).json({
      ok: false,
      error: message,
    });
  };
}

export const generalRateLimit = createRateLimitMiddleware({
  name: "general",
  max: env.RATE_LIMIT_MAX,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  message: "Too many requests. Please retry shortly.",
});

export const authenticatedRateLimit = createRateLimitMiddleware({
  name: "authenticated",
  max: env.RATE_LIMIT_AUTH_MAX,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  message: "Too many authenticated requests. Please slow down.",
});

export const widgetRateLimit = createRateLimitMiddleware({
  name: "widget",
  max: env.RATE_LIMIT_WIDGET_MAX,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  message: "Too many widget requests. Please retry shortly.",
});
