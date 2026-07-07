-- ─── Order Audit Trail ────────────────────────────────────────────────────────
-- Migration 00013: Add accepted_by and completed_by columns for staff accountability.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS accepted_by TEXT,
  ADD COLUMN IF NOT EXISTS completed_by TEXT;
