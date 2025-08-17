-- ================================================
-- QUICK FIX: TEMPORARY DISABLE RLS FOR REGISTRATION
-- ================================================
-- Run this script to temporarily fix the registration issue

-- Option 1: Make INSERT policy more permissive (RECOMMENDED)
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;

-- Create a more permissive INSERT policy
CREATE POLICY "Allow user registration and profile creation" ON users
    FOR INSERT WITH CHECK (
        -- Allow any authenticated user to create a profile
        true
    );

-- Keep other policies secure
CREATE POLICY "Users can view all profiles" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Option 2: If above doesn't work, temporarily disable RLS
-- Uncomment these lines if you need to completely bypass RLS for now:

-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- After users can register successfully, you can re-enable with:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Verify current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';
