-- Phase 2: add SUSPENDED and CANCELLED to the license_status enum.
-- ADDITIVE ONLY (enum values are never removed). EXPIRED stays derived from expire_date.
-- Neon HTTP runs statements individually (no transaction), so ADD VALUE is safe here.
ALTER TYPE "license_status" ADD VALUE IF NOT EXISTS 'SUSPENDED';
--> statement-breakpoint
ALTER TYPE "license_status" ADD VALUE IF NOT EXISTS 'CANCELLED';
