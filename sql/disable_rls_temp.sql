-- ================================================
-- QUICK FIX: TEMPORARILY DISABLE RLS
-- ================================================
-- This is the simplest solution for development

-- Temporarily disable Row Level Security for users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- Show that RLS is now disabled (should show 'f' for false)
SELECT 'RLS temporarily disabled for users table - registration should work now' as status;

-- NOTE: To re-enable RLS later (for production), run:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
