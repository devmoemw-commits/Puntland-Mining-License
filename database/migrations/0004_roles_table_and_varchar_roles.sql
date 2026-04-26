-- Dynamic roles table; migrate users.role and role_permissions.role off enum → varchar FK.

CREATE TABLE IF NOT EXISTS "roles" (
  "code" varchar(64) PRIMARY KEY NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" text,
  "is_system" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
INSERT INTO "roles" ("code", "name", "description", "is_system") VALUES
('SUPER_ADMIN', 'Super Admin', 'Full system access', true),
('MINISTER', 'Minister', 'Ministry leadership', true),
('GENERAL_DIRECTOR', 'General Director', 'General directorate', true),
('DIRECTOR', 'Director', 'Directorate', true),
('OFFICER', 'Officer', 'Operations', true)
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" TYPE varchar(64) USING ("role"::text);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'OFFICER';
--> statement-breakpoint
ALTER TABLE "role_permissions" ALTER COLUMN "role" TYPE varchar(64) USING ("role"::text);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_roles_fk"
  FOREIGN KEY ("role") REFERENCES "roles"("code") ON UPDATE CASCADE ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roles_fk"
  FOREIGN KEY ("role") REFERENCES "roles"("code") ON UPDATE CASCADE ON DELETE CASCADE;
--> statement-breakpoint
DROP TYPE IF EXISTS "role";
