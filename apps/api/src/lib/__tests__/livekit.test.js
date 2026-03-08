import { describe, expect, it } from "vitest";
import { isLiveKitConfigured, getLiveKitUrl } from "../livekit.js";

describe("livekit helpers", () => {
  it("isLiveKitConfigured returns false when env vars are not set", () => {
    expect(isLiveKitConfigured()).toBe(false);
  });

  it("getLiveKitUrl returns null when not configured", () => {
    expect(getLiveKitUrl()).toBe(null);
  });
});
