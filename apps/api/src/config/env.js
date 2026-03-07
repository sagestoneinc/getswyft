import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const rawEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8080),
  CORS_ORIGINS: z.string().default(""),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),

  AUTH_PROVIDER: z.enum(["auth0", "clerk", "keycloak"]).default("keycloak"),
  AUTH_ISSUER_URL: z.string().optional(),
  AUTH_AUDIENCE: z.string().optional(),
  AUTH_JWKS_URI: z.string().optional(),
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
});

const parsed = rawEnvSchema.parse(process.env);

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
