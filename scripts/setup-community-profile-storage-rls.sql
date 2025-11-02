-- Setup RLS for community-profile storage bucket

-- 1. Enable RLS on the bucket (if not already enabled)
-- Note: This is done through Supabase Dashboard -> Storage -> community-profile -> Settings

-- 2. Create policies for community-profile bucket

-- Policy: Allow authenticated users to upload (INSERT)
CREATE POLICY "Authenticated users can upload community profile images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'community-profile'
);

-- Policy: Allow public read access (SELECT)
CREATE POLICY "Public can view community profile images"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'community-profile'
);

-- Policy: Allow users to update their own uploads
CREATE POLICY "Users can update their own community profile images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'community-profile' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow users to delete their own uploads
CREATE POLICY "Users can delete their own community profile images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'community-profile' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%community profile%';

