import { describe, expect, it } from "vitest";
import { RequestMonitor } from "../request-monitor.js";

describe("RequestMonitor", () => {
  it("aggregates failures and marks readiness false past thresholds", () => {
    const monitor = new RequestMonitor({
      windowMs: 60_000,
      errorThreshold: 2,
      errorRateThreshold: 0.3,
      maxEvents: 100,
    });
    const now = Date.now();

    monitor.record({ method: "GET", path: "/v1/feed", statusCode: 200, durationMs: 30, timestamp: now - 2000 });
    monitor.record({ method: "GET", path: "/v1/feed", statusCode: 500, durationMs: 45, timestamp: now - 1800 });
    monitor.record({ method: "GET", path: "/v1/feed", statusCode: 503, durationMs: 40, timestamp: now - 1700 });
    monitor.record({ method: "POST", path: "/v1/moderation", statusCode: 400, durationMs: 12, timestamp: now - 1600 });
    monitor.record({ method: "GET", path: "/v1/channels", statusCode: 200, durationMs: 21, timestamp: now - 1500 });

    const snapshot = monitor.snapshot(now);

    expect(snapshot.totalRequests).toBe(5);
    expect(snapshot.serverErrors).toBe(2);
    expect(snapshot.clientErrors).toBe(1);
    expect(snapshot.errorRate).toBe(0.4);
    expect(snapshot.ready).toBe(false);
    expect(snapshot.topFailingEndpoints[0]).toMatchObject({
      method: "GET",
      path: "/v1/feed",
      count: 2,
    });
  });

  it("prunes stale events outside monitoring window", () => {
    const monitor = new RequestMonitor({
      windowMs: 1_000,
      errorThreshold: 1,
      errorRateThreshold: 0.5,
      maxEvents: 20,
    });
    const now = Date.now();

    monitor.record({ method: "GET", path: "/old", statusCode: 500, durationMs: 5, timestamp: now - 5000 });
    monitor.record({ method: "GET", path: "/fresh", statusCode: 200, durationMs: 5, timestamp: now - 200 });

    const snapshot = monitor.snapshot(now);

    expect(snapshot.totalRequests).toBe(1);
    expect(snapshot.serverErrors).toBe(0);
    expect(snapshot.ready).toBe(true);
  });
});

