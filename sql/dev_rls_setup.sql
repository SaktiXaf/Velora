-- ================================================
-- ALTERNATIVE: SIMPLER RLS SETUP FOR DEVELOPMENT
-- ================================================
-- Use this for easier development, but implement proper RLS for production

-- Drop all existing policies (including any variations)
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users; 
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Allow user registration and profile creation" ON users;
DROP POLICY IF EXISTS "Anyone can read profiles" ON users;
DROP POLICY IF EXISTS "Anyone can create profiles" ON users;
DROP POLICY IF EXISTS "Users can update their own profiles" ON users;
DROP POLICY IF EXISTS "Users can delete their own profiles" ON users;

-- Simple policies for development
CREATE POLICY "dev_read_profiles" ON users
    FOR SELECT USING (true);

CREATE POLICY "dev_create_profiles" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "dev_update_own_profiles" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "dev_delete_own_profiles" ON users
    FOR DELETE USING (auth.uid() = id);

-- For production, you would want more restrictive policies:
/*
-- Production policies (commented out for now)
CREATE POLICY "Authenticated users can read all profiles" ON users
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create own profile" ON users
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
*/

SELECT 'RLS policies updated for easier development' as status;
