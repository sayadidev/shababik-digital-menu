-- Currency Management: TRY (Turkish Lira) support + active_currency setting

-- Add price_try to item_variants (optional — admin may leave blank)
ALTER TABLE item_variants ADD COLUMN IF NOT EXISTS price_try NUMERIC;

-- Add total_try to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_try NUMERIC NOT NULL DEFAULT 0;

-- Add active_currency to site_settings (defaults to TRY)
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS active_currency TEXT NOT NULL DEFAULT 'TRY';

-- Relax the price_usd and price_syp constraints on item_variants to allow NULL
-- (Previously they were NOT NULL with CHECK >= 0. Now they are optional.)
ALTER TABLE item_variants ALTER COLUMN price_usd DROP NOT NULL;
ALTER TABLE item_variants ALTER COLUMN price_syp DROP NOT NULL;
