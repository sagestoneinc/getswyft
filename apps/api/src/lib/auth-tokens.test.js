import { beforeEach, describe, expect, it } from "vitest";
import { env } from "../config/env.js";
import { normalizeIssuer, resolveAuthConfig } from "./auth-tokens.js";

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

describe("resolveAuthConfig", () => {
  const originalEnv = {
    AUTH_PROVIDER: env.AUTH_PROVIDER,
    AUTH_ISSUER_URL: env.AUTH_ISSUER_URL,
    AUTH_JWKS_URI: env.AUTH_JWKS_URI,
    AUTH_AUDIENCE: env.AUTH_AUDIENCE,
    SUPABASE_URL: env.SUPABASE_URL,
  };

  beforeEach(() => {
    Object.assign(env, originalEnv);
  });

  it("derives supabase issuer and JWKS when only SUPABASE_URL is configured", () => {
    Object.assign(env, {
      AUTH_PROVIDER: "supabase",
      AUTH_ISSUER_URL: undefined,
      AUTH_JWKS_URI: undefined,
      AUTH_AUDIENCE: undefined,
      SUPABASE_URL: "https://example.supabase.co/",
    });

    expect(resolveAuthConfig()).toEqual({
      issuer: "https://example.supabase.co/auth/v1",
      jwksUrl: "https://example.supabase.co/auth/v1/.well-known/jwks.json",
      audience: undefined,
    });
  });

  it("prefers explicit issuer and jwks overrides", () => {
    Object.assign(env, {
      AUTH_PROVIDER: "supabase",
      AUTH_ISSUER_URL: "https://auth.example.com/custom/",
      AUTH_JWKS_URI: "https://auth.example.com/custom/jwks.json",
      AUTH_AUDIENCE: undefined,
      SUPABASE_URL: "https://example.supabase.co",
    });

    expect(resolveAuthConfig()).toEqual({
      issuer: "https://auth.example.com/custom",
      jwksUrl: "https://auth.example.com/custom/jwks.json",
      audience: undefined,
    });
  });
});
