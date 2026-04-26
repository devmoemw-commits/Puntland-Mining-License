import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

function requireDatabaseUrl(): string {
  const url =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.NEON_DATABASE_URL;

  if (!url) {
    throw new Error(
      "Missing database connection string. Set DATABASE_URL (or POSTGRES_URL / NEON_DATABASE_URL).",
    );
  }

  return url;
}

const sql = neon(requireDatabaseUrl());

export const db = drizzle({ client: sql, casing: "snake_case" });