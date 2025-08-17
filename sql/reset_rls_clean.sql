-- ================================================
-- CLEAN SLATE: RESET ALL RLS POLICIES
-- ================================================
-- This script completely resets all policies for users table

-- First, let's see what policies exist
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users';

-- Drop ALL policies for users table (this will not error if policy doesn't exist)
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', policy_record.policyname);
    END LOOP;
END $$;

-- Now create fresh policies for development
CREATE POLICY "dev_read_all" ON users
    FOR SELECT USING (true);

CREATE POLICY "dev_insert_any" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "dev_update_own" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "dev_delete_own" ON users
    FOR DELETE USING (auth.uid()::text = id::text);

-- Verify new policies
SELECT policyname, cmd, permissive FROM pg_policies WHERE tablename = 'users';

SELECT 'All RLS policies reset successfully for development' as status;
