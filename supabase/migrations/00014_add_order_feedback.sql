-- Add optional post-order feedback columns to orders table
ALTER TABLE orders
ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN feedback_text TEXT;
