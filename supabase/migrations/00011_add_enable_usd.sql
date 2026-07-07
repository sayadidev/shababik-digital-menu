ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS enable_usd boolean NOT NULL DEFAULT true;
