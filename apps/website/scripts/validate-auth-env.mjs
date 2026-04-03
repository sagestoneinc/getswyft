import dns from "node:dns/promises";

const nodeEnv = process.env.NODE_ENV || "development";
const shouldFailBuild = nodeEnv === "production" || process.env.CI === "true";
const authProvider = (process.env.VITE_AUTH_PROVIDER || "supabase").trim().toLowerCase();

function formatIssue(issue) {
  return `[auth-env] ${issue}`;
}

function reportIssues(issues) {
  if (issues.length === 0) {
    return;
  }

  const output = issues.map(formatIssue).join("\n");

  if (shouldFailBuild) {
    console.error(output);
    process.exit(1);
  }

  console.warn(output);
}

async function validateSupabaseConfig() {
  const issues = [];
  const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl) {
    issues.push("VITE_SUPABASE_URL is required when VITE_AUTH_PROVIDER=supabase.");
    return issues;
  }

  if (!supabaseAnonKey) {
    issues.push("VITE_SUPABASE_ANON_KEY is required when VITE_AUTH_PROVIDER=supabase.");
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(supabaseUrl);
  } catch (_error) {
    issues.push(`VITE_SUPABASE_URL must be a valid absolute URL. Received "${supabaseUrl}".`);
    return issues;
  }

  if (parsedUrl.protocol !== "https:") {
    issues.push(`VITE_SUPABASE_URL must use https. Received "${supabaseUrl}".`);
  }

  try {
    await dns.lookup(parsedUrl.hostname);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "DNS lookup failed";
    issues.push(
      `VITE_SUPABASE_URL hostname "${parsedUrl.hostname}" did not resolve during build (${reason}).`,
    );
  }

  return issues;
}

async function main() {
  if (authProvider !== "supabase") {
    return;
  }

  const issues = await validateSupabaseConfig();
  reportIssues(issues);
}

await main();
