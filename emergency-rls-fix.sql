-- EMERGENCY FIX: Disable RLS untuk testing sementara
-- Jalankan ini di Supabase SQL Editor untuk fix cepat

-- Disable RLS sementara untuk testing
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Atau jika mau tetap pakai RLS, buat policy yang sangat permissive:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- 
-- DROP POLICY IF EXISTS "Allow all operations" ON profiles;
-- CREATE POLICY "Allow all operations" ON profiles FOR ALL USING (true);

-- Verify table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- Check existing data
SELECT * FROM profiles LIMIT 5;
