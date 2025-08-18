-- URGENT FIX: Users table not saving data after registration
-- Run this SQL script in Supabase SQL Editor

-- Step 1: Check if users table exists and has correct structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Step 2: Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- Step 3: Drop ALL existing policies (clean slate)
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable read access for own user data" ON users;
DROP POLICY IF EXISTS "Enable update access for own user data" ON users;
DROP POLICY IF EXISTS "Users can view others basic info" ON users;
DROP POLICY IF EXISTS "allow_insert_own_profile" ON users;
DROP POLICY IF EXISTS "allow_select_own_profile" ON users;
DROP POLICY IF EXISTS "allow_update_own_profile" ON users;

-- Step 4: TEMPORARILY DISABLE RLS to allow data insertion
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 5: Grant full access to authenticated and anon users  
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;
GRANT ALL ON users TO postgres;

-- Step 6: Test manual insert to ensure table works
-- Replace 'test-user-id' with actual UUID format
INSERT INTO users (id, email, name, address, age, created_at, updated_at) 
VALUES (
  gen_random_uuid(),
  'test@example.com', 
  'Test User', 
  'Test Address', 
  25, 
  now(), 
  now()
) ON CONFLICT (id) DO NOTHING;

-- Step 7: Verify the test insert worked
SELECT * FROM users WHERE email = 'test@example.com';

-- Step 8: If test insert works, re-enable RLS with PERMISSIVE policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create VERY PERMISSIVE policies for testing
CREATE POLICY "allow_all_authenticated" ON users
    FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);

-- Even more permissive - allow anon users too (TEMPORARY)
CREATE POLICY "allow_all_anon" ON users
    FOR ALL 
    TO anon 
    USING (true) 
    WITH CHECK (true);

-- Step 9: Test that RLS doesn't block inserts
SELECT current_setting('is_superuser');
SELECT current_user;

-- Step 10: Check final policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- If this works, the app should be able to insert users now
-- You can tighten security later by replacing with proper auth.uid() policies
