-- Phase 8: GIS coordinates on licenses (nullable, additive).
ALTER TABLE "licenses" ADD COLUMN IF NOT EXISTS "latitude" numeric(10, 6);
--> statement-breakpoint
ALTER TABLE "licenses" ADD COLUMN IF NOT EXISTS "longitude" numeric(10, 6);
