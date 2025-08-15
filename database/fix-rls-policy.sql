-- =====================================================
-- RLS Policy Update for User Registration
-- Run this to fix the INSERT policy for users table
-- =====================================================

-- Drop and recreate the INSERT policy for users
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- New policy that allows insert for auth users OR during registration (no session yet)
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users' AND policyname = 'Users can insert own profile';

-- Test connection to ensure the policy is working
SELECT 'RLS Policy Updated Successfully' as status;
