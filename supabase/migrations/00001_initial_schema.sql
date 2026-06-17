-- Shababik Digital Menu — Initial Schema
-- Migration 00001: Create all base tables, indexes, RLS policies

-- 1. Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_order ON categories (order_index);

-- 2. Items
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT NOT NULL DEFAULT '',
  description_ar TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_bestseller BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_items_category ON items (category_id);
CREATE INDEX idx_items_active ON items (is_active) WHERE is_active = true;
CREATE INDEX idx_items_bestseller ON items (is_bestseller) WHERE is_bestseller = true;

-- 3. Item Variants (sizes & prices)
CREATE TABLE IF NOT EXISTS item_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  size_name_en TEXT NOT NULL,
  size_name_ar TEXT NOT NULL,
  price_usd DOUBLE PRECISION NOT NULL CHECK (price_usd >= 0),
  price_syp INTEGER NOT NULL CHECK (price_syp >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_variants_item ON item_variants (item_id);

-- 4. Analytics Events
CREATE TYPE analytics_event_type AS ENUM ('menu_load', 'item_tap');

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type analytics_event_type NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_event_type ON analytics_events (event_type);
CREATE INDEX idx_analytics_timestamp ON analytics_events (timestamp);
CREATE INDEX idx_analytics_item ON analytics_events (item_id) WHERE item_id IS NOT NULL;

-- ============================================================
-- Row-Level Security
-- ============================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Public read access for customer-facing menu
CREATE POLICY "Public read categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Public read items"
  ON items FOR SELECT
  USING (true);

CREATE POLICY "Public read item_variants"
  ON item_variants FOR SELECT
  USING (true);

-- Allow inserting analytics events from public (for item_tap / menu_load tracking)
CREATE POLICY "Public insert analytics_events"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- Admin full access (authenticated users with service role)
-- Note: These rely on the default `authenticated` role in Supabase.
-- In practice, admin writes go through the service_role client (admin.ts),
-- which bypasses RLS entirely. These policies serve as defense-in-depth
-- for any future authenticated-role admin setup.

CREATE POLICY "Admin all categories"
  ON categories FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin all items"
  ON items FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin all item_variants"
  ON item_variants FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin read analytics_events"
  ON analytics_events FOR SELECT
  USING (auth.role() = 'authenticated');
