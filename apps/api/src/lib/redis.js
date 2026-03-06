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
