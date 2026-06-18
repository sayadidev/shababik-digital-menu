-- Shababik Digital Menu — Item Images (Gallery)
-- Migration 00002: Add gallery images table and RLS

CREATE TABLE IF NOT EXISTS item_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_item_images_item ON item_images (item_id, sort_order);

ALTER TABLE item_images ENABLE ROW LEVEL SECURITY;

-- Public read access for customer-facing menu
CREATE POLICY "Public read item_images"
  ON item_images FOR SELECT
  USING (true);

-- Admin full access via service role (RLS bypassed) + defense-in-depth
CREATE POLICY "Admin all item_images"
  ON item_images FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
