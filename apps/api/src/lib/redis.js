import Redis from "ioredis";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

let client;

export function getRedisClient() {
  if (!env.REDIS_URL) {
    return null;
  }

  if (!client) {
    client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    client.on("error", (error) => {
      logger.warn("redis_error", { error: error.message });
    });
  }

  return client;
}

export async function checkRedisHealth() {
  if (!env.REDIS_URL) {
    return {
      ok: true,
      required: false,
      status: "disabled",
      details: "REDIS_URL is not configured",
    };
  }

  try {
    const redis = getRedisClient();
    const response = await redis.ping();

    return {
      ok: response === "PONG",
      required: false,
      status: response === "PONG" ? "up" : "degraded",
      details: response === "PONG" ? undefined : `Unexpected Redis ping response: ${response}`,
    };
  } catch (error) {
    return {
      ok: false,
      required: false,
      status: "down",
      details: error instanceof Error ? error.message : "Redis health check failed",
    };
  }
}
