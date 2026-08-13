-- Per-license Free/Paid flag, chosen when creating a license. Additive; default false = Paid.
ALTER TABLE "licenses" ADD COLUMN IF NOT EXISTS "is_free" boolean NOT NULL DEFAULT false;
