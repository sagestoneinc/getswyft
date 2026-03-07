import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { config as loadEnv } from "dotenv";
import { migrateSupabase } from "../src/lib/supabase-migrations.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(projectRoot, "..", "..");
const supabaseMigrationsDir = path.join(projectRoot, "supabase", "migrations");

loadEnv({ path: path.join(repoRoot, ".env"), override: false });
loadEnv({ path: path.join(projectRoot, ".env"), override: false });

const args = new Set(process.argv.slice(2).filter((arg) => arg !== "--"));
const mode = args.has("--status") ? "status" : "apply";
const allowMissing = args.has("--allow-missing");
const skipPrisma = args.has("--skip-prisma");
const skipSupabase = args.has("--skip-supabase");

function runCommand(command, commandArgs, { cwd }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd,
      env: process.env,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${commandArgs.join(" ")} failed with exit code ${code}`));
    });
  });
}

function getMissingVariableError(name) {
  return `${name} is required to keep databases in sync.`;
}

async function syncRailwayPrisma() {
  console.log("");
  console.log("==> Railway Postgres (Prisma)");

  if (mode === "status") {
    await runCommand(
      "pnpm",
      ["exec", "prisma", "migrate", "status", "--schema", "prisma/schema.prisma"],
      { cwd: projectRoot },
    );
    return;
  }

  await runCommand(
    "pnpm",
    ["exec", "prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"],
    { cwd: projectRoot },
  );
}

async function syncSupabaseSql() {
  console.log("");
  console.log("==> Supabase Postgres (SQL)");

  const statusBefore = await migrateSupabase({
    connectionString: process.env.SUPABASE_DB_URL,
    migrationsDir: supabaseMigrationsDir,
    mode: "status",
    logger: console,
  });

  if (mode === "status") {
    console.log(`Supabase applied: ${statusBefore.applied.length}`);
    console.log(`Supabase pending: ${statusBefore.pending.length}`);
    if (statusBefore.pending.length) {
      throw new Error(`Supabase has pending migrations: ${statusBefore.pending.join(", ")}`);
    }
    return;
  }

  const applyResult = await migrateSupabase({
    connectionString: process.env.SUPABASE_DB_URL,
    migrationsDir: supabaseMigrationsDir,
    mode: "apply",
    logger: console,
  });

  console.log(`Supabase migrations applied: ${applyResult.appliedCount}`);

  const statusAfter = await migrateSupabase({
    connectionString: process.env.SUPABASE_DB_URL,
    migrationsDir: supabaseMigrationsDir,
    mode: "status",
    logger: console,
  });

  if (statusAfter.pending.length) {
    throw new Error(`Supabase migrations still pending: ${statusAfter.pending.join(", ")}`);
  }
}

async function main() {
  console.log(`Running DB sync in "${mode}" mode.`);

  const blockers = [];

  if (!skipPrisma && !process.env.DATABASE_URL) {
    blockers.push(getMissingVariableError("DATABASE_URL"));
  }

  if (!skipSupabase && !process.env.SUPABASE_DB_URL) {
    blockers.push(getMissingVariableError("SUPABASE_DB_URL"));
  }

  if (blockers.length) {
    const message = blockers.map((entry) => `- ${entry}`).join("\n");
    if (!allowMissing) {
      throw new Error(`Cannot continue:\n${message}`);
    }
    console.warn(`Proceeding with missing configuration due to --allow-missing:\n${message}`);
  }

  if (!skipPrisma && process.env.DATABASE_URL) {
    await syncRailwayPrisma();
  }

  if (!skipSupabase && process.env.SUPABASE_DB_URL) {
    await syncSupabaseSql();
  }

  console.log("");
  console.log("DB sync completed successfully.");
}

main().catch((error) => {
  console.error("");
  console.error("DB sync failed.");
  console.error(error?.message || error);
  process.exit(1);
});
