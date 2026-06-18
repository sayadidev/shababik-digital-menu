-- Shababik Digital Menu — Storage Policies
-- Migration 00003: Allow authenticated users to upload/delete images

-- Allow authenticated users to upload to item-images bucket
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'item-images');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'item-images');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'item-images')
  WITH CHECK (bucket_id = 'item-images');

-- Allow public read of images (already public bucket, but ensure RLS allows it)
CREATE POLICY "Public can read images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'item-images');
