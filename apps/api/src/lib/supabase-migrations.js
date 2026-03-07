import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

const MIGRATIONS_TABLE = "_supabase_migrations";

export function isSqlMigrationFile(filename) {
  return /^\d+.*\.sql$/i.test(filename);
}

export function sortMigrationFiles(files) {
  return [...files].sort((a, b) => a.localeCompare(b));
}

export async function readMigrationFiles(migrationsDir) {
  const entries = await readdir(migrationsDir, { withFileTypes: true });
  const files = sortMigrationFiles(entries.filter((entry) => entry.isFile()).map((entry) => entry.name))
    .filter((filename) => isSqlMigrationFile(filename));

  return Promise.all(
    files.map(async (filename) => {
      const filePath = path.join(migrationsDir, filename);
      const sql = await readFile(filePath, "utf8");
      return {
        filename,
        filePath,
        sql,
      };
    }),
  );
}

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.${MIGRATIONS_TABLE} (
      id BIGSERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function getAppliedMigrations(client) {
  const result = await client.query(
    `SELECT filename, applied_at FROM public.${MIGRATIONS_TABLE} ORDER BY filename ASC`,
  );
  return result.rows;
}

export async function migrateSupabase({
  connectionString,
  migrationsDir,
  mode = "apply",
  logger = console,
  clientFactory,
}) {
  if (!connectionString) {
    throw new Error("SUPABASE_DB_URL is required to run Supabase SQL migrations");
  }

  const migrations = await readMigrationFiles(migrationsDir);
  const client = clientFactory ? clientFactory(connectionString) : new Client({ connectionString });

  await client.connect();
  try {
    await ensureMigrationsTable(client);
    const appliedRows = await getAppliedMigrations(client);
    const appliedSet = new Set(appliedRows.map((row) => row.filename));
    const pending = migrations.filter((migration) => !appliedSet.has(migration.filename));

    if (mode === "status") {
      return {
        applied: appliedRows,
        pending: pending.map((migration) => migration.filename),
      };
    }

    for (const migration of pending) {
      logger.info(`Applying Supabase migration: ${migration.filename}`);
      await client.query("BEGIN");
      try {
        await client.query(migration.sql);
        await client.query(
          `INSERT INTO public.${MIGRATIONS_TABLE} (filename) VALUES ($1)`,
          [migration.filename],
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    return {
      appliedCount: pending.length,
      applied: pending.map((migration) => migration.filename),
    };
  } finally {
    await client.end();
  }
}
