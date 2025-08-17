-- ================================================
-- BYPASS EMAIL CONFIRMATION - IMMEDIATE FIX
-- ================================================
-- Jalankan script ini di Supabase SQL Editor SEKARANG

-- 1. Disable email confirmation untuk semua user baru
UPDATE auth.config 
SET email_confirm_url = null;

-- 2. Auto-confirm semua user yang belum confirmed
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 3. Set default confirmation untuk user baru
ALTER TABLE auth.users 
ALTER COLUMN email_confirmed_at SET DEFAULT NOW();

-- 4. Verify semua user sudah confirmed
SELECT email, email_confirmed_at, confirmed_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

SELECT 'Email confirmation bypassed - users can now register and login immediately!' as status;
