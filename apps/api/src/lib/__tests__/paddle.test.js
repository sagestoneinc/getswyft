import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  verifyPaddleWebhookSignature,
  mapPaddleStatus,
  mapPaddleInterval,
} from "../paddle.js";

describe("paddle helpers", () => {
  describe("mapPaddleStatus", () => {
    it("maps known Paddle statuses to billing enum values", () => {
      expect(mapPaddleStatus("active")).toBe("ACTIVE");
      expect(mapPaddleStatus("trialing")).toBe("TRIALING");
      expect(mapPaddleStatus("past_due")).toBe("PAST_DUE");
      expect(mapPaddleStatus("canceled")).toBe("CANCELED");
      expect(mapPaddleStatus("paused")).toBe("CANCELED");
    });

    it("defaults to ACTIVE for unknown statuses", () => {
      expect(mapPaddleStatus("unknown_status")).toBe("ACTIVE");
      expect(mapPaddleStatus(undefined)).toBe("ACTIVE");
    });
  });

  describe("mapPaddleInterval", () => {
    it("maps billing cycle to interval enum", () => {
      expect(mapPaddleInterval({ interval: "year", frequency: 1 })).toBe("YEARLY");
      expect(mapPaddleInterval({ interval: "month", frequency: 1 })).toBe("MONTHLY");
    });

    it("defaults to MONTHLY for missing or invalid input", () => {
      expect(mapPaddleInterval(null)).toBe("MONTHLY");
      expect(mapPaddleInterval(undefined)).toBe("MONTHLY");
      expect(mapPaddleInterval({})).toBe("MONTHLY");
    });
  });

  describe("verifyPaddleWebhookSignature", () => {
    it("returns false when signature header is missing", () => {
      expect(verifyPaddleWebhookSignature("{}", "")).toBe(false);
      expect(verifyPaddleWebhookSignature("{}", null)).toBe(false);
    });

    it("returns false when signature parts are incomplete", () => {
      expect(verifyPaddleWebhookSignature("{}", "ts=123")).toBe(false);
      expect(verifyPaddleWebhookSignature("{}", "h1=abc")).toBe(false);
    });
  });
});
