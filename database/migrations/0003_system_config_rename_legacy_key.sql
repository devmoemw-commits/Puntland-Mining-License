-- Older installs used column "key"; rename to config_key (avoids reserved-word issues).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'system_config' AND column_name = 'key'
  ) THEN
    ALTER TABLE "system_config" RENAME COLUMN "key" TO "config_key";
  END IF;
END $$;
