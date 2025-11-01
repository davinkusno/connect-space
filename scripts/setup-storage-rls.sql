-- Setup RLS Policies for ConnectSpace Storage Bucket
-- Run this in Supabase SQL Editor

-- Drop existing policies first
DROP POLICY IF EXISTS "Allow authenticated users to upload badges" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to badges" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete badges" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon read access to badges" ON storage.objects;
DROP POLICY IF EXISTS "Allow super_admin to upload badges" ON storage.objects;
DROP POLICY IF EXISTS "Allow super_admin to delete badges" ON storage.objects;

-- 1. Allow only super_admin users to upload to badges folder
CREATE POLICY "Allow super_admin to upload badges"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ConnectSpace' 
  AND (storage.foldername(name))[1] = 'badges'
  AND auth.uid() IN (
    SELECT id FROM public.users WHERE user_type = 'super_admin'
  )
);

-- 2. Allow public read access to badges
CREATE POLICY "Allow public read access to badges"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'ConnectSpace'
  AND (storage.foldername(name))[1] = 'badges'
);

-- 3. Allow only super_admin users to delete badges
CREATE POLICY "Allow super_admin to delete badges"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'ConnectSpace'
  AND (storage.foldername(name))[1] = 'badges'
  AND auth.uid() IN (
    SELECT id FROM public.users WHERE user_type = 'super_admin'
  )
);

-- 4. Allow anon (unauthenticated) to read badges (for public access)
CREATE POLICY "Allow anon read access to badges"
ON storage.objects
FOR SELECT
TO anon
USING (
  bucket_id = 'ConnectSpace'
  AND (storage.foldername(name))[1] = 'badges'
);
