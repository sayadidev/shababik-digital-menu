-- Add is_offer column to items table for hero featured items

ALTER TABLE items ADD COLUMN IF NOT EXISTS is_offer BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_items_offer ON items (is_offer) WHERE is_offer = true;
