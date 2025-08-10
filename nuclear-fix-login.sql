-- 🚨 NUCLEAR OPTION: Disable Email Confirmation Completely
-- Copy paste dan RUN di Supabase SQL Editor untuk FIX FINAL

-- STEP 1: Confirm ALL existing users instantly
UPDATE auth.users 
SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    email_confirm_status = 1,
    confirmed_at = COALESCE(confirmed_at, NOW())
WHERE email_confirmed_at IS NULL OR confirmed_at IS NULL;

-- STEP 2: Specifically fix the problematic user
UPDATE auth.users 
SET 
    email_confirmed_at = NOW(),
    email_confirm_status = 1,
    confirmed_at = NOW(),
    last_sign_in_at = NULL  -- Reset login attempts
WHERE email = 'selginovsakti@gmail.com';

-- STEP 3: Check if Supabase has email confirmation settings
-- This will show current auth settings
SELECT 
    'Current user status:' as info,
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
    COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed_users
FROM auth.users;

-- STEP 4: Show specific user status
SELECT 
    email,
    email_confirmed_at,
    confirmed_at,
    email_confirm_status,
    created_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL AND confirmed_at IS NOT NULL THEN '✅ READY FOR LOGIN'
        ELSE '❌ STILL BLOCKED'
    END as login_status
FROM auth.users 
WHERE email = 'selginovsakti@gmail.com';

-- STEP 5: Create a test user with instant confirmation
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmed_at,
    email_confirm_status,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'test-instant@example.com',
    crypt('test123456', gen_salt('bf')),
    NOW(),
    NOW(),
    1,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    email_confirmed_at = NOW(),
    confirmed_at = NOW(),
    email_confirm_status = 1;

-- STEP 6: Final verification
SELECT 
    'VERIFICATION RESULTS:' as header,
    email,
    CASE 
        WHEN email_confirmed_at IS NOT NULL 
        AND confirmed_at IS NOT NULL 
        AND email_confirm_status = 1 THEN 'LOGIN SHOULD WORK ✅'
        ELSE 'LOGIN STILL BLOCKED ❌'
    END as status
FROM auth.users 
WHERE email IN ('selginovsakti@gmail.com', 'test-instant@example.com')
ORDER BY created_at DESC;
