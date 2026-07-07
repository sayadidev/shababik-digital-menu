-- ─── Orders & Order Items Tables ─────────────────────────────────────────────
-- Migration 00009: Create orders and order_items tables for kitchen management.

-- 1. Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  total_usd DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (total_usd >= 0),
  total_syp INTEGER NOT NULL DEFAULT 0 CHECK (total_syp >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_created_at ON orders (created_at);

-- 2. Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_order ON order_items (order_id);

-- 3. RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Allow public to insert orders (customer ordering)
CREATE POLICY "Public insert orders"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public insert order_items"
  ON order_items FOR INSERT
  WITH CHECK (true);

-- Admin full access (via service_role client, but RLS as defense-in-depth)
CREATE POLICY "Admin all orders"
  ON orders FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin all order_items"
  ON order_items FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Admin read (allows listing; service_role bypasses RLS anyway)
CREATE POLICY "Admin select orders"
  ON orders FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin select order_items"
  ON order_items FOR SELECT
  USING (auth.role() = 'authenticated');
