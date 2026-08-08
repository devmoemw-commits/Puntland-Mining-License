-- Phase 1: add ADMIN role (distinct from SUPER_ADMIN) and grant its default permissions.
-- ADDITIVE ONLY: inserts guarded by ON CONFLICT DO NOTHING. No UPDATE/DELETE of existing rows.

INSERT INTO "roles" ("code", "name", "description", "is_system") VALUES
  ('ADMIN', 'Admin', 'Administrative access (operations, users, settings) — one tier below Super Admin', true)
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
-- Grant ADMIN its default capabilities (all current permissions except approval_workflow.delete).
INSERT INTO "role_permissions" ("role", "permission_id")
SELECT 'ADMIN', p."id" FROM "permissions" p
WHERE p."code" IN (
  'viewer.access',
  'actions.use',
  'users.manage',
  'reports.view',
  'sample_analysis.access',
  'sample.signature',
  'license.register',
  'license.review',
  'license.approve',
  'license.reject',
  'license.moderate',
  'system.settings',
  'approval_workflow.view',
  'approval_workflow.create',
  'approval_workflow.edit'
)
ON CONFLICT ("role", "permission_id") DO NOTHING;
