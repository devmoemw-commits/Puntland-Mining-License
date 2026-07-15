CREATE TABLE IF NOT EXISTS "license_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"new_license_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"renewal_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "license_categories_id_unique" UNIQUE("id"),
	CONSTRAINT "license_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
-- Seed the predefined categories currently hardcoded in the license create form (step 4).
INSERT INTO "license_categories" ("name", "new_license_fee", "renewal_fee", "sort_order") VALUES
	('Large Scale Mining', '5000', '2000', 1),
	('Small Scale Mining', '2000', '500', 2),
	('Artisanal Gold Mining', '2500', '1000', 3),
	('Mining Equipment Rental', '1500', '500', 4),
	('Stone Crusher', '700', '400', 5)
ON CONFLICT ("name") DO NOTHING;
