import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrateSupabase } from "../src/lib/supabase-migrations.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const migrationsDir = path.join(projectRoot, "supabase", "migrations");

const args = new Set(process.argv.slice(2));
const mode = args.has("--status") ? "status" : "apply";

const connectionString = process.env.SUPABASE_DB_URL;

try {
  const result = await migrateSupabase({
    connectionString,
    migrationsDir,
    mode,
    logger: console,
  });

  if (mode === "status") {
    console.log("Supabase migration status:");
    console.log(`  Applied: ${result.applied.length}`);
    console.log(`  Pending: ${result.pending.length}`);
    if (result.pending.length) {
      for (const migration of result.pending) {
        console.log(`    - ${migration}`);
      }
    }
  } else {
    console.log(`Supabase migrations applied: ${result.appliedCount}`);
    if (result.applied.length) {
      for (const migration of result.applied) {
        console.log(`  - ${migration}`);
      }
    }
  }
} catch (error) {
  console.error("Supabase migration command failed.");
  console.error(error);
  process.exit(1);
}
