-- Normalize Arabic-Indic digits (٠-٩) to Western digits (0-9) in Arabic text fields
-- Arabic-Indic: ٠١٢٣٤٥٦٧٨٩ -> Western: 0123456789

CREATE OR REPLACE FUNCTION normalize_arabic_digits(text_content TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT translate(
    text_content,
    '٠١٢٣٤٥٦٧٨٩',
    '0123456789'
  );
$$;

-- Fix existing item descriptions
UPDATE items
SET description_ar = normalize_arabic_digits(description_ar)
WHERE description_ar ~ '[٠١٢٣٤٥٦٧٨٩]';

-- Fix existing item names
UPDATE items
SET name_ar = normalize_arabic_digits(name_ar)
WHERE name_ar ~ '[٠١٢٣٤٥٦٧٨٩]';

-- Fix existing category names
UPDATE categories
SET name_ar = normalize_arabic_digits(name_ar)
WHERE name_ar ~ '[٠١٢٣٤٥٦٧٨٩]';

-- Add offer fields to item_variants

ALTER TABLE item_variants
ADD COLUMN is_offer BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE item_variants
ADD COLUMN price_before_usd DOUBLE PRECISION;

ALTER TABLE item_variants
ADD COLUMN price_before_syp BIGINT;
