-- Add daily_order_number column to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS daily_order_number INTEGER;

-- Counter table for atomic daily order number assignment
CREATE TABLE IF NOT EXISTS daily_order_counters (
  date DATE PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE daily_order_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin all daily_order_counters" ON daily_order_counters
  FOR ALL USING (auth.role() = 'authenticated');

-- Function to auto-assign sequential daily order numbers (race-condition safe)
CREATE OR REPLACE FUNCTION set_daily_order_number()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql AS $$
DECLARE
  today_date DATE;
  next_num INTEGER;
BEGIN
  IF NEW.created_at IS NULL THEN
    NEW.created_at := now();
  END IF;

  today_date := (NEW.created_at AT TIME ZONE 'Asia/Damascus')::DATE;

  INSERT INTO daily_order_counters (date, last_number)
  VALUES (today_date, 1)
  ON CONFLICT (date) DO UPDATE
  SET last_number = daily_order_counters.last_number + 1
  RETURNING last_number INTO next_num;

  NEW.daily_order_number := next_num;
  RETURN NEW;
END;
$$;

-- Attach the trigger
CREATE TRIGGER trg_set_daily_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_daily_order_number();
