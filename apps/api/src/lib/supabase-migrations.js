import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import dns, { setDefaultResultOrder } from "node:dns";
import { isIP } from "node:net";
import { Client } from "pg";

const MIGRATIONS_TABLE = "_supabase_migrations";

// Railway containers can fail on IPv6-only resolution to external DB hosts.
// Prefer IPv4 when both A and AAAA records exist.
try {
  setDefaultResultOrder("ipv4first");
} catch {
  // Ignore on older Node runtimes that do not support this API.
}

function ipv4OnlyLookup(hostname, options, callback) {
  if (typeof options === "function") {
    return dns.lookup(hostname, { family: 4, verbatim: false }, options);
  }

  if (typeof options === "number") {
    return dns.lookup(hostname, { family: 4, verbatim: false }, callback);
  }

  const lookupOptions = options ?? {};
  if (lookupOptions.all) {
    return dns.lookup(
      hostname,
      {
        ...lookupOptions,
        all: true,
        family: 4,
        verbatim: false,
      },
      callback,
    );
  }

  return dns.lookup(
    hostname,
    {
      ...lookupOptions,
      family: 4,
      verbatim: false,
    },
    callback,
  );
}

function parseConnectionHost(connectionString) {
  try {
    const url = new URL(connectionString);
    return {
      host: url.hostname,
      port: url.port ? Number(url.port) : undefined,
    };
  } catch {
    return {
      host: undefined,
      port: undefined,
    };
  }
}

function shouldRetryWithIpv4(error) {
  return Boolean(error) && error.code === "ENETUNREACH";
}

async function resolveIpv4Address(host) {
  if (!host || isIP(host) === 4) {
    return host;
  }

  const addresses = await dns.promises.resolve4(host);
  return addresses[0];
}

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
  const forceIpv4 = process.env.SUPABASE_DB_FORCE_IPV4 !== "false";
  const ipv4OverrideUrl = process.env.SUPABASE_DB_URL_IPV4;
  const baseClientConfig = {
    connectionString,
    ...(forceIpv4 ? { lookup: ipv4OnlyLookup } : {}),
  };
  let client = clientFactory ? clientFactory(connectionString) : new Client(baseClientConfig);

  try {
    await client.connect();
  } catch (error) {
    if (!shouldRetryWithIpv4(error)) {
      throw error;
    }

    const retryConnectionString = ipv4OverrideUrl || connectionString;
    const { host, port } = parseConnectionHost(retryConnectionString);
    const ipv4Address = await resolveIpv4Address(host);

    if (!ipv4Address) {
      throw error;
    }

    logger.warn(
      `Initial Supabase migration DB connect failed with ${error.code}; retrying via IPv4 ${ipv4Address}.`,
    );

    client = new Client({
      connectionString: retryConnectionString,
      host: ipv4Address,
      ...(port ? { port } : {}),
      ...(forceIpv4 ? { lookup: ipv4OnlyLookup } : {}),
    });

    await client.connect();
  }

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
