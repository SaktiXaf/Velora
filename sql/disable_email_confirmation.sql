-- ================================================
-- DISABLE EMAIL CONFIRMATION FOR DEVELOPMENT
-- ================================================
-- This script helps disable email confirmation requirement

-- You need to do this in Supabase Dashboard:
-- 1. Go to Authentication > Settings
-- 2. Scroll down to "Email Confirmations" 
-- 3. Turn OFF "Enable email confirmations"
-- 4. Save

-- OR you can configure it to auto-confirm emails for development:
-- In Authentication > URL Configuration, you can set redirect URLs

-- For now, let's also create a function to auto-confirm users (if needed)
CREATE OR REPLACE FUNCTION auto_confirm_user(user_email text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update user to be confirmed
    UPDATE auth.users 
    SET email_confirmed_at = NOW(),
        confirmed_at = NOW()
    WHERE email = user_email
    AND email_confirmed_at IS NULL;
END;
$$;

-- You can run this function for any email that needs to be confirmed:
-- SELECT auto_confirm_user('user@example.com');

SELECT 'Email confirmation helper created' as status;
