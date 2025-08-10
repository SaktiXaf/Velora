-- 🚨 FIX LOGIN GAGAL - Email Confirmation Issue
-- Copy paste dan RUN di Supabase SQL Editor

-- STEP 1: Confirm all existing users automatically
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    email_confirm_status = 1 
WHERE email_confirmed_at IS NULL;

-- STEP 2: Check current user status
SELECT 
    email,
    email_confirmed_at,
    created_at,
    CASE 
        WHEN email_confirmed_at IS NULL THEN 'NOT CONFIRMED'
        ELSE 'CONFIRMED'
    END as status
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;

-- STEP 3: Specifically confirm the latest user
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    email_confirm_status = 1
WHERE email = 'selginovsakti@gmail.com';

-- STEP 4: Verify the fix
SELECT 
    'User confirmation status:' as info,
    email,
    email_confirmed_at,
    CASE 
        WHEN email_confirmed_at IS NULL THEN 'FAILED - Still not confirmed'
        ELSE 'SUCCESS - Email confirmed'
    END as result
FROM auth.users 
WHERE email = 'selginovsakti@gmail.com';

-- STEP 5: Also enable the user account if needed
UPDATE auth.users 
SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    email_confirm_status = 1,
    confirmed_at = COALESCE(confirmed_at, NOW())
WHERE email = 'selginovsakti@gmail.com';

-- Final verification
SELECT 'LOGIN SHOULD NOW WORK FOR: ' || email as final_status
FROM auth.users 
WHERE email = 'selginovsakti@gmail.com' 
AND email_confirmed_at IS NOT NULL;
