CREATE TABLE IF NOT EXISTS "system_config" (
	"config_key" varchar(128) PRIMARY KEY NOT NULL,
	"value" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
