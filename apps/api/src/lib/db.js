import { PrismaClient } from "@prisma/client";

let prisma;

export function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["warn", "error"],
    });
  }

  return prisma;
}

export async function checkDatabaseHealth() {
  if (!process.env.DATABASE_URL) {
    return {
      ok: false,
      required: true,
      status: "missing_configuration",
      details: "DATABASE_URL is not configured",
    };
  }

  try {
    await getPrismaClient().$queryRawUnsafe("SELECT 1");
    return {
      ok: true,
      required: true,
      status: "up",
    };
  } catch (error) {
    return {
      ok: false,
      required: true,
      status: "down",
      details: error instanceof Error ? error.message : "Database health check failed",
    };
  }
}
