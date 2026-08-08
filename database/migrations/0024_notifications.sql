-- Phase 9: durable per-user notifications. ADDITIVE ONLY.
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" varchar(64) NOT NULL,
  "title" varchar(255) NOT NULL,
  "body" text,
  "link" text,
  "entity_type" varchar(64),
  "entity_id" text,
  "dedupe_key" varchar(255),
  "read_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_idx" ON "notifications" ("user_id","read_at");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "notifications_user_dedupe_uidx"
  ON "notifications" ("user_id","dedupe_key")
  WHERE "dedupe_key" IS NOT NULL;
