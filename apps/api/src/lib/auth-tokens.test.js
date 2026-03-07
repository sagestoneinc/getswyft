import { describe, expect, it } from "vitest";
import { normalizeIssuer } from "./auth-tokens.js";

describe("normalizeIssuer", () => {
  it("preserves issuers that already match OIDC discovery values", () => {
    expect(normalizeIssuer("https://auth.getswyftup.com/realms/getswyft")).toBe(
      "https://auth.getswyftup.com/realms/getswyft",
    );
  });

  it("removes a trailing slash when present", () => {
    expect(normalizeIssuer("https://auth.getswyftup.com/realms/getswyft/")).toBe(
      "https://auth.getswyftup.com/realms/getswyft",
    );
  });
});
