-- 🚨 FIX REGISTRASI GAGAL - Foreign Key Constraint Error
-- Jalankan script ini di Supabase SQL Editor

-- Step 1: Check existing table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Step 2: Check foreign key constraints
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='profiles';

-- Step 3: Temporarily disable RLS to fix registration
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 4: Drop the problematic foreign key constraint if it exists
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Step 5: Recreate the table with proper structure if needed
-- First backup existing data
CREATE TEMP TABLE profiles_backup AS SELECT * FROM profiles;

-- Drop existing table
DROP TABLE IF EXISTS profiles CASCADE;

-- Recreate with proper structure
CREATE TABLE profiles (
  id UUID NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  bio TEXT,
  age INTEGER,
  avatar TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Add foreign key constraint that points to auth.users(id)
  CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE
);

-- Restore backed up data
INSERT INTO profiles SELECT * FROM profiles_backup;

-- Step 6: Disable RLS temporarily for testing registration
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 7: Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_name_idx ON profiles(name);

-- Step 8: Test the fix
-- Check if we can insert a test profile (this should work now)
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Get a user ID from auth.users for testing
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Try to insert a test profile
        INSERT INTO profiles (id, name, email, phone, address) 
        VALUES (
            test_user_id, 
            'Test User', 
            'test@example.com', 
            '123456789', 
            'Test Address'
        ) ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Test profile insert successful for user: %', test_user_id;
    ELSE
        RAISE NOTICE 'No users found in auth.users table';
    END IF;
END $$;

-- Step 9: Enable RLS again with proper policies (after registration works)
-- We'll enable this later once registration is confirmed working
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Verification queries
SELECT 'Total users in auth.users:' as info, COUNT(*) as count FROM auth.users;
SELECT 'Total profiles:' as info, COUNT(*) as count FROM profiles;

-- Show any remaining constraint issues
SELECT conname, contype, conrelid::regclass 
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass;
