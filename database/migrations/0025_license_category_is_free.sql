-- Add Free/Paid flag to license categories. Additive; default false = Paid.
ALTER TABLE "license_categories" ADD COLUMN IF NOT EXISTS "is_free" boolean NOT NULL DEFAULT false;
