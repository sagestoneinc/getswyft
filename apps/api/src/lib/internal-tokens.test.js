import { beforeEach, describe, expect, it } from "vitest";
import { env } from "../config/env.js";
import {
  isVisitorClaims,
  signVisitorAccessToken,
  verifyInternalAccessToken,
} from "./internal-tokens.js";

describe("internal widget tokens", () => {
  const originalEnv = {
    JWT_SECRET: env.JWT_SECRET,
    APP_BASE_URL: env.APP_BASE_URL,
  };

  beforeEach(() => {
    Object.assign(env, originalEnv, {
      JWT_SECRET: "super-secret-widget-token-key",
      APP_BASE_URL: "https://www.getswyftup.com",
    });
  });

  it("signs and verifies visitor-scoped tokens", async () => {
    const token = await signVisitorAccessToken({
      tenantId: "tenant_123",
      conversationId: "conv_456",
      leadName: "Alex Morgan",
      leadEmail: "alex@example.com",
    });

    const claims = await verifyInternalAccessToken(token);

    expect(isVisitorClaims(claims)).toBe(true);
    expect(claims.tenant_id).toBe("tenant_123");
    expect(claims.conversation_id).toBe("conv_456");
    expect(claims.lead_name).toBe("Alex Morgan");
    expect(claims.lead_email).toBe("alex@example.com");
  });
});
