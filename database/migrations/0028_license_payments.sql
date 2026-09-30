-- Partial payments: record each collection so a licence can be settled in instalments.
-- ADDITIVE ONLY. Existing licences start at amount_paid = 0 (no payment recorded yet).
ALTER TABLE "licenses" ADD COLUMN IF NOT EXISTS "amount_paid" numeric(10, 2) NOT NULL DEFAULT 0;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "license_payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "license_id" uuid NOT NULL REFERENCES "licenses"("id") ON DELETE CASCADE,
  "amount" numeric(10, 2) NOT NULL,
  "paid_at" timestamptz NOT NULL DEFAULT now(),
  "receipt_number" varchar(255),
  "note" text,
  "created_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_by_name" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "license_payments_license_idx" ON "license_payments" ("license_id");
