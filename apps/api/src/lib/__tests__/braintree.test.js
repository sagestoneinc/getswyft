import { describe, expect, it } from "vitest";
import {
  verifyBraintreeWebhookSignature,
  mapBraintreeStatus,
  parseBraintreeAmount,
} from "../braintree.js";

describe("braintree helpers", () => {
  describe("mapBraintreeStatus", () => {
    it("maps known Braintree statuses to billing enum values", () => {
      expect(mapBraintreeStatus("Active")).toBe("ACTIVE");
      expect(mapBraintreeStatus("Canceled")).toBe("CANCELED");
      expect(mapBraintreeStatus("Expired")).toBe("CANCELED");
      expect(mapBraintreeStatus("Past Due")).toBe("PAST_DUE");
      expect(mapBraintreeStatus("Pending")).toBe("TRIALING");
    });

    it("defaults to ACTIVE for unknown statuses", () => {
      expect(mapBraintreeStatus("unknown_status")).toBe("ACTIVE");
      expect(mapBraintreeStatus(undefined)).toBe("ACTIVE");
    });
  });

  describe("parseBraintreeAmount", () => {
    it("converts dollar amounts to cents", () => {
      expect(parseBraintreeAmount("49.00")).toBe(4900);
      expect(parseBraintreeAmount("99.99")).toBe(9999);
      expect(parseBraintreeAmount("0.50")).toBe(50);
    });

    it("handles integer amounts", () => {
      expect(parseBraintreeAmount("100")).toBe(10000);
      expect(parseBraintreeAmount(49)).toBe(4900);
    });

    it("returns 0 for missing or invalid input", () => {
      expect(parseBraintreeAmount(null)).toBe(0);
      expect(parseBraintreeAmount(undefined)).toBe(0);
      expect(parseBraintreeAmount("")).toBe(0);
      expect(parseBraintreeAmount("abc")).toBe(0);
    });
  });

  describe("verifyBraintreeWebhookSignature", () => {
    it("returns false when signature is missing", () => {
      expect(verifyBraintreeWebhookSignature("", "payload")).toBe(false);
      expect(verifyBraintreeWebhookSignature(null, "payload")).toBe(false);
    });

    it("returns false when payload is missing", () => {
      expect(verifyBraintreeWebhookSignature("sig", "")).toBe(false);
      expect(verifyBraintreeWebhookSignature("sig", null)).toBe(false);
    });
  });
});
