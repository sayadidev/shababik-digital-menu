-- ─── Variant Image URL ───────────────────────────────────────────────────────
-- Migration 00010: Add optional image_url column to item_variants.

ALTER TABLE item_variants
  ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';
