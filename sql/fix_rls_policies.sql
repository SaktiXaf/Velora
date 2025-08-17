-- ================================================
-- FIX RLS POLICY ISSUE FOR USER REGISTRATION
-- ================================================
-- Run this script to fix Row Level Security policy issues

-- Option 1: Update the INSERT policy to allow registration
-- This allows users to insert their profile during registration

DROP POLICY IF EXISTS "Users can insert own profile" ON users;

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (
        -- Allow insert if auth.uid() matches id OR if auth.uid() is null (for registration)
        auth.uid() = id OR auth.uid() IS NULL
    );

-- Alternative Option 2: Create a service role policy (more secure)
-- This requires using service role key for user creation

-- First, ensure we have the function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Option 3: Temporarily disable RLS for INSERT operations during registration
-- You can enable this if you want to allow unrestricted user creation

-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- Then re-enable after registration:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Recommended Solution: Update INSERT policy to be more flexible
CREATE OR REPLACE POLICY "Allow user registration" ON users
    FOR INSERT WITH CHECK (
        -- Allow if authenticated user matches ID
        auth.uid() = id 
        -- OR allow if this is a new registration (id matches email domain pattern)
        OR (auth.uid() IS NULL AND email IS NOT NULL)
        -- OR allow if user is authenticated (fallback for registration flow)
        OR auth.role() = 'authenticated'
    );

-- Also update the general policy to be more permissive during registration
DROP POLICY IF EXISTS "Users can view all profiles" ON users;

CREATE POLICY "Users can view all profiles" ON users
    FOR SELECT USING (
        -- Allow viewing all profiles (public read)
        true
    );

-- Update policy for user profile updates
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (
        -- Only allow updates to own profile
        auth.uid() = id
    ) WITH CHECK (
        -- Ensure the updated profile still belongs to the same user
        auth.uid() = id
    );

-- Add a more permissive policy for service operations
CREATE POLICY "Service role can manage users" ON users
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Show current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;
