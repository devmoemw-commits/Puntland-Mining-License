import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

/** Drizzle CLI config (typed loosely so it stays compatible across drizzle-kit versions). */
export default {
  schema: "./database/schema.ts",
  out: "./database/migrations",
  dialect: "postgresql" as const,
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
};