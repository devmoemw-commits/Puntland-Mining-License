-- Phase 5: inspection reports and license renewal history.
-- ADDITIVE ONLY. Idempotent table creation with inline FKs.

CREATE TABLE IF NOT EXISTS "inspection_reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "license_id" uuid NOT NULL REFERENCES "licenses"("id") ON DELETE CASCADE,
  "inspection_date" timestamptz,
  "inspector_name" varchar(255),
  "gps_verified" boolean NOT NULL DEFAULT false,
  "recommendation" varchar(64),
  "notes" text,
  "photos" text,
  "created_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_by_name" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inspection_reports_license_idx" ON "inspection_reports" ("license_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "license_renewals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "license_id" uuid NOT NULL REFERENCES "licenses"("id") ON DELETE CASCADE,
  "previous_expire_date" timestamptz,
  "new_expire_date" timestamptz NOT NULL,
  "fee" numeric(10, 2),
  "receipt_number" varchar(255),
  "notes" text,
  "created_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_by_name" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "license_renewals_license_idx" ON "license_renewals" ("license_id");
