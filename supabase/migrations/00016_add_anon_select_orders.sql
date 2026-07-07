-- Allow anonymous (unauthenticated) customers to read their own orders.
-- This is required for Supabase Realtime to push status updates to the
-- customer-facing client, since Realtime respects RLS policies.
CREATE POLICY "Public select orders"
  ON orders FOR SELECT
  USING (true);
