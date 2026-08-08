-- Phase 4: append-only activity log + the activity_log.view permission.
-- ADDITIVE ONLY. Table creation and seeds are idempotent.

CREATE TABLE IF NOT EXISTS "activity_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "actor_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "actor_name" text,
  "actor_role" varchar(64),
  "action" varchar(128) NOT NULL,
  "entity_type" varchar(64) NOT NULL,
  "entity_id" text,
  "entity_label" text,
  "summary" text,
  "metadata" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_logs_entity_idx" ON "activity_logs" ("entity_type","entity_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_logs_created_at_idx" ON "activity_logs" ("created_at");
--> statement-breakpoint
-- Seed the new permission.
INSERT INTO "permissions" ("code", "description")
VALUES ('activity_log.view', 'View the activity log / audit trail')
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
-- Grant activity_log.view to the roles that should see the audit trail.
INSERT INTO "role_permissions" ("role", "permission_id")
SELECT r.code, p.id
FROM (VALUES ('SUPER_ADMIN'),('ADMIN'),('MINISTER'),('GENERAL_DIRECTOR'),('DIRECTOR')) AS r(code)
CROSS JOIN "permissions" p
WHERE p.code = 'activity_log.view'
ON CONFLICT ("role", "permission_id") DO NOTHING;
