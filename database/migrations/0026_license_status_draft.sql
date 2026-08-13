-- Add DRAFT to the license_status enum (for saved-but-not-submitted licenses). Additive.
ALTER TYPE "license_status" ADD VALUE IF NOT EXISTS 'DRAFT';
