-- Run in Supabase SQL Editor after schema.sql.
-- Adds a primary image and detected item label to community needs.

ALTER TABLE public.community_needs
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS detected_item_label TEXT;

-- Public bucket for community-need item photos.
INSERT INTO storage.buckets (id, name, public)
VALUES ('need-images', 'need-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view uploaded need images.
CREATE POLICY "Need images are publicly viewable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'need-images');

-- Allow authenticated users to upload need images.
CREATE POLICY "Authenticated users can upload need images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'need-images'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own uploaded need images.
CREATE POLICY "Authenticated users can update need images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'need-images'
  AND auth.role() = 'authenticated'
);
