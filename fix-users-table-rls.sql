-- Check and fix RLS policies for users table
-- Run this in Supabase SQL Editor

-- First, check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';

-- Drop all existing policies for users table (if any conflicts)
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable read access for own user data" ON users;
DROP POLICY IF EXISTS "Enable update access for own user data" ON users;

-- Enable RLS if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies
-- 1. Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = id);

-- 2. Allow users to read their own profile
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT 
    TO authenticated 
    USING (auth.uid() = id);

-- 3. Allow users to update their own profile  
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 4. Allow users to view other users' basic info for social features (optional)
CREATE POLICY "Users can view others basic info" ON users
    FOR SELECT 
    TO authenticated 
    USING (true);

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;

-- Test the policies by checking if they exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Check if user can insert (test query - replace with actual user ID)
-- SELECT auth.uid(); -- This shows current user ID
-- INSERT INTO users (id, email, name) VALUES (auth.uid(), 'test@example.com', 'Test User');
