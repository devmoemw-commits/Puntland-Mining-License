/**
 * Applies SQL migrations in database/migrations (see meta/_journal.json).
 * Requires DATABASE_URL (e.g. in .env.local).
 *
 * Note: Neon HTTP has no transactions — if a migration fails mid-file, fix DB manually.
 */
import dotenv from "dotenv";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

dotenv.config({ path: ".env.local" });
dotenv.config();

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Add it to .env.local.");
    process.exit(1);
  }
  return url;
}

const migrationsFolder = path.join(process.cwd(), "database", "migrations");

async function main() {
  const databaseUrl = requireDatabaseUrl();
  console.log("Applying migrations from:", migrationsFolder);
  const sql = neon(databaseUrl);
  const db = drizzle({ client: sql });
  await migrate(db, { migrationsFolder });
  console.log("Migrations finished.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
