import { beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "../config/env.js";
import { runAiTask } from "./ai-runtime.js";

describe("ai runtime", () => {
  const originalEnv = {
    OPENAI_API_KEY: env.OPENAI_API_KEY,
    OPENAI_BASE_URL: env.OPENAI_BASE_URL,
    OPENAI_MODEL: env.OPENAI_MODEL,
    AI_HTTP_TIMEOUT_MS: env.AI_HTTP_TIMEOUT_MS,
  };

  beforeEach(() => {
    Object.assign(env, originalEnv, {
      OPENAI_API_KEY: "test-key",
      OPENAI_BASE_URL: "https://api.example.com/v1",
      OPENAI_MODEL: "gpt-test",
      AI_HTTP_TIMEOUT_MS: 5000,
    });
  });

  it("runs chat tasks against an OpenAI-compatible endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          model: "gpt-test",
          usage: { total_tokens: 42 },
          choices: [{ message: { content: "Hello from AI" } }],
        }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await runAiTask({
      provider: "openai",
      config: { model: "gpt-test" },
      task: "chat",
      input: "Say hello",
      metadata: { conversationId: "conv_1" },
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(result.output).toBe("Hello from AI");
    expect(result.tokensUsed).toBe(42);
    expect(result.model).toBe("gpt-test");
  });

  it("parses moderation JSON responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          model: "gpt-test",
          usage: { total_tokens: 17 },
          choices: [
            {
              message: {
                content: JSON.stringify({
                  flagged: true,
                  categories: ["spam", "abuse"],
                  reason: "Aggressive spam content",
                }),
              },
            },
          ],
        }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await runAiTask({
      provider: "openai",
      config: { model: "gpt-test" },
      task: "moderate",
      input: "bad content",
      metadata: {},
    });

    expect(result.flagged).toBe(true);
    expect(result.categories).toEqual(["spam", "abuse"]);
    expect(result.reason).toBe("Aggressive spam content");
  });
});
