import { env } from "../config/env.js";
import { getRequestContext } from "./request-context.js";

const levelWeight = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const minimumWeight = levelWeight[env.LOG_LEVEL] || levelWeight.info;

function shouldLog(level) {
  return levelWeight[level] >= minimumWeight;
}

function write(level, message, metadata) {
  if (!shouldLog(level)) {
    return;
  }

  const context = getRequestContext() || {};
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    requestId: context.requestId,
    tenantId: context.tenantId,
    userId: context.userId,
    apiKeyId: context.apiKeyId,
    ...metadata,
  };

  console.log(JSON.stringify(payload));
}

export const logger = {
  debug: (message, metadata) => write("debug", message, metadata),
  info: (message, metadata) => write("info", message, metadata),
  warn: (message, metadata) => write("warn", message, metadata),
  error: (message, metadata) => write("error", message, metadata),
};
