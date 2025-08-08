-- URGENT FIX: Disable Email Confirmation untuk Login
-- Jalankan di Supabase Dashboard → Authentication → Settings

-- Method 1: Via SQL (mungkin perlu akses admin)
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW() 
-- WHERE email_confirmed_at IS NULL;

-- Method 2: Manual di Dashboard
-- 1. Buka Supabase Dashboard
-- 2. Klik Authentication di sidebar kiri
-- 3. Klik Settings (tab kedua)
-- 4. Scroll ke "Email Confirmation"
-- 5. UNCHECK "Enable email confirmations"
-- 6. Klik Save

-- Method 3: Manually confirm user di Users table
-- 1. Buka Authentication → Users
-- 2. Cari user dengan email: selginovsakti@gmail.com
-- 3. Klik user tersebut
-- 4. Klik "Confirm user" atau edit email_confirmed_at

-- Method 4: Reset password untuk force activation
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'selginovsakti@gmail.com' 
  AND email_confirmed_at IS NULL;
