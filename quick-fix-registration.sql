-- 🚨 SOLUSI CEPAT: Fix Registrasi Gagal 
-- Copy paste dan RUN di Supabase SQL Editor

-- 1. Disable RLS temporarily untuk testing
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Drop foreign key constraint yang bermasalah
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 3. Add foreign key constraint yang benar
ALTER TABLE profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Verify table structure
\d profiles;

-- 5. Test connection
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM auth.users;
