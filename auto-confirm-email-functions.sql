-- 🚀 AUTO EMAIL CONFIRMATION FUNCTION
-- Tambahan untuk fix login credentials

-- Function untuk auto-confirm email user
CREATE OR REPLACE FUNCTION confirm_user_email(user_email TEXT)
RETURNS JSON AS $$
DECLARE
  result_count INTEGER;
BEGIN
  -- Update user email confirmation
  UPDATE auth.users 
  SET 
    email_confirmed_at = NOW(),
    email_confirm_status = 1,
    confirmed_at = COALESCE(confirmed_at, NOW())
  WHERE email = user_email;
  
  GET DIAGNOSTICS result_count = ROW_COUNT;
  
  IF result_count > 0 THEN
    RETURN json_build_object(
      'success', TRUE,
      'message', 'Email confirmed successfully',
      'email', user_email
    );
  ELSE
    RETURN json_build_object(
      'success', FALSE,
      'message', 'User not found',
      'email', user_email
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', SQLERRM,
      'email', user_email
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function untuk bulk confirm semua user yang belum confirmed
CREATE OR REPLACE FUNCTION confirm_all_pending_users()
RETURNS JSON AS $$
DECLARE
  result_count INTEGER;
BEGIN
  -- Update all unconfirmed users
  UPDATE auth.users 
  SET 
    email_confirmed_at = NOW(),
    email_confirm_status = 1,
    confirmed_at = COALESCE(confirmed_at, NOW())
  WHERE email_confirmed_at IS NULL;
  
  GET DIAGNOSTICS result_count = ROW_COUNT;
  
  RETURN json_build_object(
    'success', TRUE,
    'message', 'Bulk email confirmation completed',
    'users_confirmed', result_count
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION confirm_user_email TO anon, authenticated;
GRANT EXECUTE ON FUNCTION confirm_all_pending_users TO anon, authenticated;

-- Test the functions
SELECT confirm_user_email('selginovsakti@gmail.com');
SELECT confirm_all_pending_users();
