-- =====================================================
-- SUPABASE STORAGE SETUP FOR AVATARS
-- =====================================================

-- 1. Create avatars bucket (run this in Supabase SQL Editor)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up RLS policies for avatars bucket
-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
    OR bucket_id = 'avatars'  -- Allow all uploads for now (development)
);

-- Allow anyone to view avatars (they are public)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
    OR bucket_id = 'avatars'  -- Allow all updates for now (development)
) WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
    OR bucket_id = 'avatars'  -- Allow all updates for now (development)
);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
    OR bucket_id = 'avatars'  -- Allow all deletes for now (development)
);

-- =====================================================
-- ALTERNATIVE: More permissive policies for development
-- =====================================================

-- If the above policies don't work, try these more permissive ones:

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- Create permissive policies for development
CREATE POLICY "Allow all avatar operations" ON storage.objects
    FOR ALL USING (bucket_id = 'avatars')
    WITH CHECK (bucket_id = 'avatars');

-- =====================================================
-- VERIFY STORAGE SETUP
-- =====================================================

-- Check if avatars bucket exists
SELECT * FROM storage.buckets WHERE id = 'avatars';

-- Check storage policies
SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';

-- =====================================================
-- TEST QUERIES
-- =====================================================

-- After running the above, you can test with these queries:

-- List all files in avatars bucket
-- SELECT * FROM storage.objects WHERE bucket_id = 'avatars';

-- Get public URL for a file (example)
-- SELECT storage.get_public_url('avatars', 'filename.jpg');

-- =====================================================
-- MANUAL BUCKET CREATION (Alternative method)
-- =====================================================

-- If INSERT INTO storage.buckets doesn't work, 
-- you can create the bucket manually:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New bucket"
-- 3. Name: "avatars"  
-- 4. Check "Public bucket" 
-- 5. Click "Create bucket"
