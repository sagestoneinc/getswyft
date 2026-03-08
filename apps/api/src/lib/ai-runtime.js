import { env } from "../config/env.js";

const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_VERSION = "2023-06-01";

export class AiRuntimeError extends Error {
  constructor(message, { statusCode = 500, publicMessage = message } = {}) {
    super(message);
    this.statusCode = statusCode;
    this.publicMessage = publicMessage;
  }
}

function toObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function trimOutput(value) {
  return String(value || "").trim();
}

function normalizeBaseUrl(value) {
  const candidate = String(value || DEFAULT_OPENAI_BASE_URL).trim();
  return candidate.replace(/\/$/, "");
}

// ---------------------------------------------------------------------------
// OpenAI / OpenAI-compatible provider
// ---------------------------------------------------------------------------

function resolveOpenAIRuntime(config) {
  const settings = toObject(config);

  const apiKey = trimOutput(settings.apiKey || env.OPENAI_API_KEY);
  if (!apiKey) {
    throw new AiRuntimeError("OpenAI API key is missing", {
      statusCode: 400,
      publicMessage: "AI provider credentials are not configured",
    });
  }

  return {
    apiKey,
    baseUrl: normalizeBaseUrl(settings.baseUrl || env.OPENAI_BASE_URL),
    model: trimOutput(settings.model || env.OPENAI_MODEL || "gpt-4o-mini"),
    temperature: toNumber(settings.temperature, 0.2),
    maxTokens: settings.maxTokens ? toNumber(settings.maxTokens, undefined) : undefined,
    systemPrompt: trimOutput(settings.systemPrompt),
  };
}

function buildOpenAIMessages({ task, input, systemPrompt, metadata }) {
  const taskInstructions = {
    chat: "You are SwyftUp's AI receptionist. Be concise, helpful, and action-oriented.",
    assist: "You help agents draft accurate, calm, high-trust replies. Suggest a response that is ready to send.",
    summarize:
      "Summarize the conversation into a concise operational brief with key points, customer intent, open questions, and next steps.",
    moderate:
      "Classify the content for moderation. Return strict JSON with keys flagged (boolean), categories (array of strings), and reason (string).",
    voice_bot:
      "You are a voice routing assistant. Respond briefly with the next best spoken response and handoff guidance when needed.",
  };

  const system = [taskInstructions[task], systemPrompt].filter(Boolean).join("\n\n");
  const userParts = [trimOutput(input)];

  if (metadata && Object.keys(metadata).length) {
    userParts.push(`Context:\n${JSON.stringify(metadata, null, 2)}`);
  }

  return [
    { role: "system", content: system },
    { role: "user", content: userParts.join("\n\n") },
  ];
}

function extractOpenAITextResponse(payload) {
  const choice = payload?.choices?.[0];
  const text = choice?.message?.content;

  if (Array.isArray(text)) {
    return trimOutput(
      text
        .map((part) => (typeof part === "string" ? part : part?.text || ""))
        .join(""),
    );
  }

  return trimOutput(text);
}

async function createOpenAICompletion({ config, task, input, metadata }) {
  const runtime = resolveOpenAIRuntime(config);
  const startedAt = Date.now();

  const response = await fetch(`${runtime.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${runtime.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: runtime.model,
      temperature: runtime.temperature,
      ...(runtime.maxTokens ? { max_tokens: runtime.maxTokens } : {}),
      ...(task === "moderate" ? { response_format: { type: "json_object" } } : {}),
      messages: buildOpenAIMessages({
        task,
        input,
        systemPrompt: runtime.systemPrompt,
        metadata: toObject(metadata),
      }),
    }),
    signal: AbortSignal.timeout(env.AI_HTTP_TIMEOUT_MS),
  });

  const rawBody = await response.text();
  if (!response.ok) {
    throw new AiRuntimeError(`AI request failed with ${response.status}: ${rawBody}`, {
      statusCode: 502,
      publicMessage: "AI provider request failed",
    });
  }

  const payload = safeJsonParse(rawBody);
  if (!payload) {
    throw new AiRuntimeError("AI provider returned invalid JSON", {
      statusCode: 502,
      publicMessage: "AI provider returned an invalid response",
    });
  }

  return {
    payload,
    output: extractOpenAITextResponse(payload),
    durationMs: Date.now() - startedAt,
    tokensUsed: payload?.usage?.total_tokens || null,
    model: payload?.model || runtime.model,
  };
}

// ---------------------------------------------------------------------------
// Anthropic provider
// ---------------------------------------------------------------------------

function resolveAnthropicRuntime(config) {
  const settings = toObject(config);

  const apiKey = trimOutput(settings.apiKey || env.ANTHROPIC_API_KEY);
  if (!apiKey) {
    throw new AiRuntimeError("Anthropic API key is missing", {
      statusCode: 400,
      publicMessage: "AI provider credentials are not configured",
    });
  }

  return {
    apiKey,
    model: trimOutput(settings.model || env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001"),
    maxTokens: settings.maxTokens ? toNumber(settings.maxTokens, 1024) : 1024,
    systemPrompt: trimOutput(settings.systemPrompt),
  };
}

function buildAnthropicSystemPrompt(task, systemPrompt) {
  const taskInstructions = {
    chat: "You are SwyftUp's AI receptionist. Be concise, helpful, and action-oriented.",
    assist: "You help agents draft accurate, calm, high-trust replies. Suggest a response that is ready to send.",
    summarize:
      "Summarize the conversation into a concise operational brief with key points, customer intent, open questions, and next steps.",
    moderate:
      "Classify the content for moderation. Return strict JSON with keys flagged (boolean), categories (array of strings), and reason (string).",
    voice_bot:
      "You are a voice routing assistant. Respond briefly with the next best spoken response and handoff guidance when needed.",
  };

  return [taskInstructions[task], systemPrompt].filter(Boolean).join("\n\n");
}

function buildAnthropicUserContent(input, metadata) {
  const userParts = [trimOutput(input)];

  if (metadata && Object.keys(metadata).length) {
    userParts.push(`Context:\n${JSON.stringify(metadata, null, 2)}`);
  }

  return userParts.join("\n\n");
}

function extractAnthropicTextResponse(payload) {
  const content = payload?.content;
  if (!Array.isArray(content)) {
    return "";
  }

  return trimOutput(
    content
      .filter((block) => block?.type === "text")
      .map((block) => block.text || "")
      .join(""),
  );
}

async function createAnthropicCompletion({ config, task, input, metadata }) {
  const runtime = resolveAnthropicRuntime(config);
  const startedAt = Date.now();

  const systemPrompt = buildAnthropicSystemPrompt(task, runtime.systemPrompt);
  const userContent = buildAnthropicUserContent(input, toObject(metadata));

  const body = {
    model: runtime.model,
    max_tokens: runtime.maxTokens,
    messages: [{ role: "user", content: userContent }],
  };

  if (systemPrompt) {
    body.system = systemPrompt;
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": runtime.apiKey,
      "anthropic-version": ANTHROPIC_API_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(env.AI_HTTP_TIMEOUT_MS),
  });

  const rawBody = await response.text();
  if (!response.ok) {
    throw new AiRuntimeError(`Anthropic request failed with ${response.status}: ${rawBody}`, {
      statusCode: 502,
      publicMessage: "AI provider request failed",
    });
  }

  const payload = safeJsonParse(rawBody);
  if (!payload) {
    throw new AiRuntimeError("Anthropic returned invalid JSON", {
      statusCode: 502,
      publicMessage: "AI provider returned an invalid response",
    });
  }

  const inputTokens = payload?.usage?.input_tokens || 0;
  const outputTokens = payload?.usage?.output_tokens || 0;

  return {
    payload,
    output: extractAnthropicTextResponse(payload),
    durationMs: Date.now() - startedAt,
    tokensUsed: inputTokens + outputTokens || null,
    model: payload?.model || runtime.model,
  };
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    const match = String(value || "").match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function normalizeProvider(provider) {
  return String(provider || "openai").trim().toLowerCase();
}

async function createChatCompletion({ provider, config, task, input, metadata }) {
  const normalized = normalizeProvider(provider);

  if (normalized === "anthropic") {
    return createAnthropicCompletion({ config, task, input, metadata });
  }

  if (["openai", "openai-compatible", "openai_compatible"].includes(normalized)) {
    return createOpenAICompletion({ config, task, input, metadata });
  }

  throw new AiRuntimeError(`Unsupported AI provider: ${provider}`, {
    statusCode: 400,
    publicMessage: `Unsupported AI provider: ${provider}`,
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function runAiTask({ provider, config, task, input, metadata }) {
  const result = await createChatCompletion({
    provider,
    config,
    task,
    input,
    metadata,
  });

  if (task !== "moderate") {
    return {
      output: result.output,
      flagged: false,
      categories: [],
      reason: "",
      tokensUsed: result.tokensUsed,
      durationMs: result.durationMs,
      model: result.model,
    };
  }

  const parsed = safeJsonParse(result.output) || {};
  const categories = Array.isArray(parsed.categories)
    ? parsed.categories.map((entry) => String(entry).trim()).filter(Boolean)
    : [];

  return {
    output: result.output,
    flagged: Boolean(parsed.flagged),
    categories,
    reason: trimOutput(parsed.reason),
    tokensUsed: result.tokensUsed,
    durationMs: result.durationMs,
    model: result.model,
  };
}
