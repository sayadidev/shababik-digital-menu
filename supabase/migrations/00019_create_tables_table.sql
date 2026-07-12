-- ── Create tables management ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number TEXT NOT NULL UNIQUE,
  secure_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Add secure_token to orders ────────────────────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS secure_token UUID;

-- ── Make table_number nullable (derived from token) ───────────────────────
ALTER TABLE orders ALTER COLUMN table_number DROP NOT NULL;

-- ── Public read access on tables (customers need to validate tokens) ──────
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can select tables"
  ON tables FOR SELECT
  USING (true);

-- ── Admin policies (authenticated users with service_role bypass) ─────────
CREATE POLICY "Authenticated users can insert tables"
  ON tables FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tables"
  ON tables FOR DELETE
  TO authenticated
  USING (true);
