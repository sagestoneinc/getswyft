import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  isSqlMigrationFile,
  sortMigrationFiles,
  readMigrationFiles,
  migrateSupabase,
} from "../supabase-migrations.js";

function buildFakeClient({ initiallyApplied = [] } = {}) {
  const state = {
    applied: [...initiallyApplied],
    executedSql: [],
    started: false,
    ended: false,
  };

  const client = {
    async connect() {
      state.started = true;
    },
    async end() {
      state.ended = true;
    },
    async query(sql, params = []) {
      state.executedSql.push({ sql, params });
      if (sql.includes("SELECT filename, applied_at")) {
        return {
          rows: state.applied.map((filename) => ({ filename, applied_at: new Date().toISOString() })),
        };
      }
      if (sql.includes("INSERT INTO public._supabase_migrations")) {
        state.applied.push(params[0]);
      }
      return { rows: [] };
    },
  };

  return { client, state };
}

describe("supabase migration helpers", () => {
  it("detects sql migration filenames and sorts them deterministically", () => {
    expect(isSqlMigrationFile("0001_init.sql")).toBe(true);
    expect(isSqlMigrationFile("20260308_profiles.sql")).toBe(true);
    expect(isSqlMigrationFile("README.md")).toBe(false);
    expect(isSqlMigrationFile("draft.sql.bak")).toBe(false);

    expect(sortMigrationFiles(["10_b.sql", "2_a.sql", "001_c.sql"])).toEqual([
      "001_c.sql",
      "10_b.sql",
      "2_a.sql",
    ]);
  });

  it("reads only sql migrations in sorted order", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "getswyft-supabase-migrations-"));
    try {
      await writeFile(path.join(tempDir, "0002_second.sql"), "SELECT 2;");
      await writeFile(path.join(tempDir, "0001_first.sql"), "SELECT 1;");
      await writeFile(path.join(tempDir, "notes.txt"), "ignored");

      const migrations = await readMigrationFiles(tempDir);
      expect(migrations.map((item) => item.filename)).toEqual([
        "0001_first.sql",
        "0002_second.sql",
      ]);
      expect(migrations[0].sql).toContain("SELECT 1");
      expect(migrations[1].sql).toContain("SELECT 2");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("applies only pending migrations and records them", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "getswyft-supabase-migrations-"));
    try {
      await writeFile(path.join(tempDir, "0001_first.sql"), "SELECT 1;");
      await writeFile(path.join(tempDir, "0002_second.sql"), "SELECT 2;");

      const { client, state } = buildFakeClient({ initiallyApplied: ["0001_first.sql"] });
      const result = await migrateSupabase({
        connectionString: "postgres://example",
        migrationsDir: tempDir,
        clientFactory: () => client,
        logger: { info() {} },
      });

      expect(result.applied).toEqual(["0002_second.sql"]);
      expect(result.appliedCount).toBe(1);
      expect(state.started).toBe(true);
      expect(state.ended).toBe(true);
      expect(state.executedSql.some((entry) => entry.sql === "SELECT 2;")).toBe(true);
      expect(state.executedSql.some((entry) => entry.sql.includes("BEGIN"))).toBe(true);
      expect(state.executedSql.some((entry) => entry.sql.includes("COMMIT"))).toBe(true);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("returns status without applying when mode=status", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "getswyft-supabase-migrations-"));
    try {
      await writeFile(path.join(tempDir, "0001_first.sql"), "SELECT 1;");
      await writeFile(path.join(tempDir, "0002_second.sql"), "SELECT 2;");

      const { client, state } = buildFakeClient({ initiallyApplied: ["0001_first.sql"] });
      const result = await migrateSupabase({
        connectionString: "postgres://example",
        migrationsDir: tempDir,
        mode: "status",
        clientFactory: () => client,
      });

      expect(result.applied.map((row) => row.filename)).toEqual(["0001_first.sql"]);
      expect(result.pending).toEqual(["0002_second.sql"]);
      expect(state.executedSql.some((entry) => entry.sql === "SELECT 2;")).toBe(false);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
