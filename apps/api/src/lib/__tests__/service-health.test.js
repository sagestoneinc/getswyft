import { beforeEach, describe, expect, it, vi } from "vitest";

const snapshotMock = vi.fn();
const checkDatabaseHealthMock = vi.fn();
const checkRedisHealthMock = vi.fn();

vi.mock("../request-monitor.js", () => ({
  requestMonitor: {
    snapshot: snapshotMock,
  },
}));

vi.mock("../db.js", () => ({
  checkDatabaseHealth: checkDatabaseHealthMock,
}));

vi.mock("../redis.js", () => ({
  checkRedisHealth: checkRedisHealthMock,
}));

const { getReadinessStatus } = await import("../service-health.js");

describe("service health", () => {
  beforeEach(() => {
    snapshotMock.mockReset();
    checkDatabaseHealthMock.mockReset();
    checkRedisHealthMock.mockReset();

    snapshotMock.mockReturnValue({
      ready: true,
      totalRequests: 10,
      serverErrors: 0,
      clientErrors: 0,
      errorRate: 0,
      windowMs: 60_000,
      topFailingEndpoints: [],
      generatedAt: new Date().toISOString(),
    });
    checkDatabaseHealthMock.mockResolvedValue({
      ok: true,
      required: true,
      status: "up",
    });
    checkRedisHealthMock.mockResolvedValue({
      ok: true,
      required: false,
      status: "up",
    });
  });

  it("returns ready when required dependencies and monitor checks pass", async () => {
    const status = await getReadinessStatus();

    expect(status.ok).toBe(true);
    expect(status.status).toBe("ready");
    expect(status.dependencies.database.status).toBe("up");
    expect(status.dependencies.redis.status).toBe("up");
  });

  it("returns degraded when a required dependency fails", async () => {
    checkDatabaseHealthMock.mockResolvedValueOnce({
      ok: false,
      required: true,
      status: "down",
      details: "database unavailable",
    });

    const status = await getReadinessStatus();

    expect(status.ok).toBe(false);
    expect(status.status).toBe("degraded");
    expect(status.dependencies.database.details).toBe("database unavailable");
  });

  it("keeps readiness green when an optional dependency is disabled", async () => {
    checkRedisHealthMock.mockResolvedValueOnce({
      ok: true,
      required: false,
      status: "disabled",
      details: "REDIS_URL is not configured",
    });

    const status = await getReadinessStatus();

    expect(status.ok).toBe(true);
    expect(status.dependencies.redis.status).toBe("disabled");
  });
});
