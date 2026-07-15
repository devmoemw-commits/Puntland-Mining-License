CREATE TABLE IF NOT EXISTS "business_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_types_id_unique" UNIQUE("id"),
	CONSTRAINT "business_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
-- Seed the predefined business types currently hardcoded in the license create form (step 1).
INSERT INTO "business_types" ("name", "sort_order") VALUES
	('Mining', 1),
	('Construction', 2),
	('Manufacturing', 3),
	('Consulting', 4),
	('Other', 5)
ON CONFLICT ("name") DO NOTHING;
