ALTER TABLE "license_workflow_transitions"
ADD COLUMN IF NOT EXISTS "acted_by_signature_url" text;
