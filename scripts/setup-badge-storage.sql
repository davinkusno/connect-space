-- Setup Storage Bucket and RLS Policies for Badge Images
-- Run this in Supabase SQL Editor

-- 1. Create bucket if not exists (run in Supabase Storage dashboard or use this)
-- Note: You might need to create the bucket manually in Supabase Dashboard > Storage
-- Bucket name: ConnectSpace
-- Public: Yes (for read access)

-- 2. Drop existing policies first (cleanup)
DROP POLICY IF EXISTS "Allow super_admin to upload badges" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to badges" ON storage.objects;
DROP POLICY IF EXISTS "Allow super_admin to delete badges" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon read access to badges" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload badges" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete badges" ON storage.objects;

-- 3. Create policy to allow super_admin to upload badges
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

-- 4. Create policy to allow super_admin to update badges
CREATE POLICY "Allow super_admin to update badges"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ConnectSpace'
  AND (storage.foldername(name))[1] = 'badges'
  AND auth.uid() IN (
    SELECT id FROM public.users WHERE user_type = 'super_admin'
  )
)
WITH CHECK (
  bucket_id = 'ConnectSpace'
  AND (storage.foldername(name))[1] = 'badges'
  AND auth.uid() IN (
    SELECT id FROM public.users WHERE user_type = 'super_admin'
  )
);

-- 5. Create policy to allow public read access to badges
CREATE POLICY "Allow public read access to badges"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'ConnectSpace'
  AND (storage.foldername(name))[1] = 'badges'
);

-- 6. Create policy to allow anonymous read access to badges
CREATE POLICY "Allow anon read access to badges"
ON storage.objects
FOR SELECT
TO anon
USING (
  bucket_id = 'ConnectSpace'
  AND (storage.foldername(name))[1] = 'badges'
);

-- 7. Create policy to allow super_admin to delete badges
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

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%badge%';

