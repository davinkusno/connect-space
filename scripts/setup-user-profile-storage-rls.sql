-- =====================================================
-- User Profile Storage RLS Policies
-- =====================================================
-- This script sets up Row Level Security policies for
-- the user-profile folder in the ConnectSpace bucket
-- =====================================================

-- Note: Make sure the ConnectSpace bucket exists first
-- You can create it in Supabase Dashboard -> Storage

-- =====================================================
-- RLS Policies for user-profile folder
-- =====================================================

-- Policy 1: Allow authenticated users to upload their own profile pictures
CREATE POLICY "Users can upload their own profile pictures"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ConnectSpace' 
  AND (storage.foldername(name))[1] = 'user-profile'
  AND auth.uid()::text = (storage.filename(name))
);

-- Policy 2: Allow anyone to view profile pictures (public read)
CREATE POLICY "Anyone can view profile pictures"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'ConnectSpace'
  AND (storage.foldername(name))[1] = 'user-profile'
);

-- Policy 3: Allow authenticated users to update their own profile pictures
CREATE POLICY "Users can update their own profile pictures"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ConnectSpace'
  AND (storage.foldername(name))[1] = 'user-profile'
  AND auth.uid()::text = (storage.filename(name))
);

-- Policy 4: Allow authenticated users to delete their own profile pictures
CREATE POLICY "Users can delete their own profile pictures"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'ConnectSpace'
  AND (storage.foldername(name))[1] = 'user-profile'
  AND auth.uid()::text = (storage.filename(name))
);

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check if policies are created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%profile pictures%';

-- =====================================================
-- Notes
-- =====================================================
-- 1. The policies above use service role bypass in the API
--    So you may not need these exact policies
-- 2. Make sure SUPABASE_SERVICE_ROLE_KEY is set in .env.local
-- 3. The user-profile folder will be created automatically on first upload
-- 4. Images are stored with unique filenames: timestamp-originalname
-- 5. Public URL format: {supabase_url}/storage/v1/object/public/ConnectSpace/user-profile/{filename}

