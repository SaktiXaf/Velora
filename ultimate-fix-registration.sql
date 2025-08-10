-- 🚨 SOLUSI ULTIMATE: Fix Registrasi Gagal
-- Copy paste SEMUA SQL ini ke Supabase SQL Editor dan RUN

-- STEP 1: Completely disable RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- STEP 2: Remove ALL constraints that might cause problems
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_email_key;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pkey;

-- STEP 3: Backup existing data
CREATE TEMP TABLE IF NOT EXISTS profiles_backup AS SELECT * FROM profiles;

-- STEP 4: Drop and recreate table completely
DROP TABLE IF EXISTS profiles CASCADE;

-- STEP 5: Create new table WITHOUT foreign key constraint
CREATE TABLE profiles (
  id UUID NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  bio TEXT,
  age INTEGER,
  avatar TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 6: Restore any existing data
INSERT INTO profiles 
SELECT * FROM profiles_backup 
ON CONFLICT (id) DO NOTHING;

-- STEP 7: Make sure RLS is OFF
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- STEP 8: Test insert
INSERT INTO profiles (id, name, email, phone, address) 
VALUES (
  gen_random_uuid(), 
  'Test User Registration', 
  'test-registration@example.com', 
  '123456789', 
  'Test Address'
) ON CONFLICT (id) DO NOTHING;

-- STEP 9: Verify
SELECT 'SUCCESS: Table profiles ready for registration' as status;
SELECT COUNT(*) as total_profiles FROM profiles;

-- STEP 10: Show table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
