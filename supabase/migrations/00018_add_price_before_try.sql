-- Add price_before_try to item_variants for TRY sale/discount before-price
ALTER TABLE item_variants ADD COLUMN IF NOT EXISTS price_before_try NUMERIC;
