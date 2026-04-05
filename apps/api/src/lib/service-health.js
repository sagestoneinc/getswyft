import { checkDatabaseHealth } from "./db.js";
import { requestMonitor } from "./request-monitor.js";
import { checkRedisHealth } from "./redis.js";

const HEALTHCHECK_TIMEOUT_MS = 2000;

function withTimeout(promise, name, timeoutMs = HEALTHCHECK_TIMEOUT_MS) {
  let timer = null;

  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`${name} health check timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    }),
  ]).finally(() => {
    if (timer) {
      clearTimeout(timer);
    }
  });
}

async function runDependencyCheck(name, required, check) {
  const startedAt = Date.now();

  try {
    const result = await withTimeout(check(), name);
    return {
      name,
      ...result,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      name,
      ok: false,
      required,
      status: "down",
      details: error instanceof Error ? error.message : `${name} health check failed`,
      latencyMs: Date.now() - startedAt,
    };
  }
}

export async function getReadinessStatus() {
  const monitor = requestMonitor.snapshot();
  const [database, redis] = await Promise.all([
    runDependencyCheck("database", true, checkDatabaseHealth),
    runDependencyCheck("redis", false, checkRedisHealth),
  ]);

  const dependencies = {
    database,
    redis,
  };

  const ready =
    monitor.ready &&
    Object.values(dependencies).every((dependency) => !dependency.required || dependency.ok);

  return {
    ok: ready,
    status: ready ? "ready" : "degraded",
    timestamp: new Date().toISOString(),
    monitor,
    dependencies,
  };
}
