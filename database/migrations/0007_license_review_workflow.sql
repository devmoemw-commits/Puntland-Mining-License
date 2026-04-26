DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_enum
		WHERE enumlabel = 'REVIEW'
		AND enumtypid = 'license_status'::regtype
	) THEN
		ALTER TYPE "license_status" ADD VALUE 'REVIEW' BEFORE 'APPROVED';
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM pg_enum
		WHERE enumlabel = 'REVOKED'
		AND enumtypid = 'license_status'::regtype
	) THEN
		ALTER TYPE "license_status" RENAME VALUE 'REVOKED' TO 'REJECTED';
	END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "licenses" ADD COLUMN IF NOT EXISTS "review_comment" text;
