ALTER TABLE "approval_workflows"
ADD COLUMN IF NOT EXISTS "module" varchar(64) NOT NULL DEFAULT 'LICENSE';
