ALTER TABLE "license_workflow_instances"
ADD COLUMN IF NOT EXISTS "definition_snapshot" text;
