-- Add offer_position column to items table for hero card ordering
-- 1 = left, 2 = center, 3 = right

ALTER TABLE items ADD COLUMN IF NOT EXISTS offer_position SMALLINT;
CREATE INDEX IF NOT EXISTS idx_items_offer_position ON items (offer_position) WHERE offer_position IS NOT NULL;
