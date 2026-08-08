-- Phase 7: Mineral Export Registration module + export.access permission.
-- ADDITIVE ONLY. Idempotent.

CREATE TABLE IF NOT EXISTS "mineral_exports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "ref_id" varchar(255) NOT NULL UNIQUE,
  "company_name" varchar(255) NOT NULL,
  "city_region" varchar(255),
  "company_telephone" varchar(255),
  "mineral_licence_no" varchar(255),
  "rep_full_name" varchar(255),
  "rep_position" varchar(255),
  "rep_telephone" varchar(255),
  "rep_id_type" varchar(64),
  "rep_id_number" varchar(255),
  "mineral_type" varchar(255),
  "mineral_form" varchar(64),
  "quantity" numeric(14, 3),
  "unit" varchar(64),
  "extraction_site" varchar(255),
  "district_region" varchar(255),
  "destination_country" varchar(255),
  "point_of_export_type" varchar(64),
  "point_of_export_name" varchar(255),
  "transport_mode" varchar(64),
  "vessel_or_airline_name" varchar(255),
  "export_date" timestamptz,
  "applicant_name" varchar(255),
  "approver_title" varchar(255),
  "approver_name" varchar(255),
  "status" "license_status" NOT NULL DEFAULT 'PENDING',
  "signature" boolean DEFAULT false,
  "review_comment" text,
  "created_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_by_name" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
INSERT INTO "permissions" ("code", "description")
VALUES ('export.access', 'Access the Mineral Export module')
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "role_permissions" ("role", "permission_id")
SELECT r.code, p.id
FROM (VALUES ('SUPER_ADMIN'),('ADMIN'),('GENERAL_DIRECTOR')) AS r(code)
CROSS JOIN "permissions" p
WHERE p.code = 'export.access'
ON CONFLICT ("role", "permission_id") DO NOTHING;
