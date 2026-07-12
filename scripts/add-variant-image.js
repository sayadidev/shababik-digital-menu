const { createClient } = require('@supabase/supabase-js');
const db = createClient(
  'https://bfkjimqsznebqhtqwafo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJma2ppbXFzem5lYnFodHF3YWZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTcyMjExMCwiZXhwIjoyMDk3Mjk4MTEwfQ.y-b2-eeLbxQ-e01i-2wDbuDy0wCzQX29yv7f6hsxI-8'
);
async function run() {
  const sql = "ALTER TABLE item_variants ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';";
  const { data, error } = await db.rpc('exec_sql', { sql });
  console.log(JSON.stringify({ data, error }, null, 2));
}
run();
