import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const rawEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8080),
  CORS_ORIGINS: z.string().default(""),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  REQUEST_MONITOR_WINDOW_MS: z.coerce.number().int().positive().default(300000),
  REQUEST_MONITOR_ERROR_THRESHOLD: z.coerce.number().int().positive().default(10),
  REQUEST_MONITOR_ERROR_RATE_THRESHOLD: z.coerce.number().positive().default(0.2),

  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),

  AUTH_PROVIDER: z.enum(["auth0", "clerk", "keycloak", "supabase"]).default("keycloak"),
  AUTH_ISSUER_URL: z.string().optional(),
  AUTH_AUDIENCE: z.string().optional(),
  AUTH_JWKS_URI: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  DEV_AUTH_BYPASS: z.string().default("false"),
  DEV_DEFAULT_TENANT_SLUG: z.string().default("default"),

  APP_BASE_URL: z.string().default("http://localhost:5173"),
  EMAIL_PROVIDER: z.enum(["log", "resend"]).default("log"),
  EMAIL_FROM: z.string().default("Getswyft <onboarding@example.com>"),
  EMAIL_REPLY_TO: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),

  STORAGE_PROVIDER: z.enum(["s3", "local"]).default("local"),
  S3_BUCKET_NAME: z.string().optional(),
  S3_REGION: z.string().default("us-east-1"),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),

  LIVEKIT_URL: z.string().optional(),
  LIVEKIT_API_KEY: z.string().optional(),
  LIVEKIT_API_SECRET: z.string().optional(),

  PUSH_PROVIDER: z.enum(["log", "fcm"]).default("log"),
  FCM_PROJECT_ID: z.string().optional(),
  FCM_CLIENT_EMAIL: z.string().optional(),
  FCM_PRIVATE_KEY: z.string().optional(),

  TELEPHONY_PROVIDER: z.enum(["log", "telnyx"]).default("log"),
  TELNYX_API_KEY: z.string().optional(),
  TELNYX_CONNECTION_ID: z.string().optional(),
  TELNYX_MESSAGING_PROFILE_ID: z.string().optional(),
  TELNYX_FROM_NUMBER: z.string().optional(),

  BILLING_PROVIDER: z.enum(["manual", "paddle", "braintree"]).default("manual"),
  PADDLE_API_KEY: z.string().optional(),
  PADDLE_WEBHOOK_SECRET: z.string().optional(),
  PADDLE_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
  PADDLE_PRICE_ID: z.string().optional(),

  BRAINTREE_MERCHANT_ID: z.string().optional(),
  BRAINTREE_PUBLIC_KEY: z.string().optional(),
  BRAINTREE_PRIVATE_KEY: z.string().optional(),
  BRAINTREE_WEBHOOK_SECRET: z.string().optional(),
  BRAINTREE_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
  BRAINTREE_PLAN_ID: z.string().optional(),

  SIP_ENCRYPTION_KEY: z.string().optional(),

  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),
  AI_HTTP_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_WIDGET_MAX: z.coerce.number().int().positive().default(30),
});

const parsed = rawEnvSchema.parse(process.env);

if (parsed.NODE_ENV === "production" && !parsed.SIP_ENCRYPTION_KEY) {
  throw new Error(
    "SIP_ENCRYPTION_KEY is required in production. " +
      "SIP trunk password encryption cannot function without this variable."
  );
}

function parseBool(value) {
  return value === "1" || value?.toLowerCase?.() === "true";
}

const corsOrigins = parsed.CORS_ORIGINS.split(",")
  .map((entry) => entry.trim())
  .filter(Boolean);

export const env = {
  ...parsed,
  DEV_AUTH_BYPASS: parseBool(parsed.DEV_AUTH_BYPASS),
  CORS_ORIGINS: corsOrigins,
};

export function assertRequiredEnv(keys) {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
