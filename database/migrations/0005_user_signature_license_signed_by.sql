ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "signature_image_url" text;
--> statement-breakpoint
ALTER TABLE "licenses" ADD COLUMN IF NOT EXISTS "signed_by_user_id" uuid;
--> statement-breakpoint
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_signed_by_user_id_users_id_fk" FOREIGN KEY ("signed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
