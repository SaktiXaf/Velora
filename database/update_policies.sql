-- =====================================================
-- UPDATED RLS POLICIES FOR PROFILE UPDATES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Create more permissive policies for development
-- Policy: Allow all reads (for public profiles)
CREATE POLICY "Allow all profile reads" ON public.users
    FOR SELECT USING (true);

-- Policy: Allow all inserts (for registration)
CREATE POLICY "Allow profile creation" ON public.users
    FOR INSERT WITH CHECK (true);

-- Policy: Allow all updates (for development - you can make this more restrictive later)
CREATE POLICY "Allow profile updates" ON public.users
    FOR UPDATE USING (true) WITH CHECK (true);

-- =====================================================
-- ADDITIONAL HELPFUL QUERIES
-- =====================================================

-- Test query to check if a user can update their profile
-- UPDATE public.users 
-- SET bio = 'Updated bio', age = 25, avatar = 'new-avatar-url' 
-- WHERE id = 'ce94b068-e2f1-4072-9c6b-2ce0b763a117';

-- Query to check current user policies
-- SELECT * FROM pg_policies WHERE tablename = 'users';

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Ensure proper permissions are granted
GRANT ALL PRIVILEGES ON public.users TO authenticated;
GRANT ALL PRIVILEGES ON public.users TO anon;
GRANT ALL PRIVILEGES ON public.follows TO authenticated;
GRANT ALL PRIVILEGES ON public.follows TO anon;

-- Grant usage on sequences if any
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
