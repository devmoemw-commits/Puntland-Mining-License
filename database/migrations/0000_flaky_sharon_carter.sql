CREATE TYPE "public"."license_status" AS ENUM('PENDING', 'APPROVED', 'REVOKED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('SUPER_ADMIN', 'MINISTER', 'GENERAL_DIRECTOR', 'DIRECTOR', 'OFFICER');--> statement-breakpoint
CREATE TABLE "districts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"region_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "districts_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "licenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"license_ref_id" varchar(255) NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"business_type" varchar(255) NOT NULL,
	"company_address" text,
	"region" varchar(255),
	"district_id" uuid NOT NULL,
	"country_of_origin" varchar(255),
	"status" "license_status" DEFAULT 'PENDING' NOT NULL,
	"full_name" varchar(255),
	"mobile_number" varchar(255),
	"email_address" text,
	"id_card_number" varchar(255),
	"passport_photos" text,
	"company_profile" text,
	"receipt_of_payment" text,
	"environmental_assessment_plan" text,
	"experience_profile" text,
	"risk_management_plan" text,
	"bank_statement" text,
	"license_type" varchar(255),
	"license_category" varchar(255),
	"calculated_fee" numeric(10, 2),
	"license_area" text[],
	"signature" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"expire_date" timestamp with time zone DEFAULT NOW() + interval '1 year' NOT NULL,
	CONSTRAINT "licenses_id_unique" UNIQUE("id"),
	CONSTRAINT "licenses_license_ref_id_unique" UNIQUE("license_ref_id")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "regions_id_unique" UNIQUE("id"),
	CONSTRAINT "regions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sample_analysis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"license_ref_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"nationality" varchar(255) NOT NULL,
	"passport_no" varchar(255) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"unit" varchar(255) NOT NULL,
	"mineral_type" varchar(255) NOT NULL,
	"signature" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "sample_analysis_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"email_verified" timestamp,
	"image" text,
	"password" text,
	"role" "role" DEFAULT 'OFFICER' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "districts" ADD CONSTRAINT "districts_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE no action ON UPDATE no action;