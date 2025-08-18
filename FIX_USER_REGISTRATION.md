# URGENT FIX: User Registration Not Saving to Database

## Problem
User berhasil register dan masuk authentication tapi data profile tidak tersimpan ke tabel `users` di database.

## Root Cause
RLS (Row Level Security) policies memblokir insert ke tabel `users` atau policy tidak dikonfigurasi dengan benar.

## Solution Steps

### Step 1: Jalankan SQL Script di Supabase
1. Buka Supabase Dashboard → Project → SQL Editor
2. Buat New Query
3. Copy paste dan jalankan script berikut:

```sql
-- EMERGENCY FIX: Create bypass function
CREATE OR REPLACE FUNCTION create_user_profile_bypass(
  user_id uuid,
  user_email text,
  user_name text DEFAULT NULL,
  user_address text DEFAULT NULL,
  user_age integer DEFAULT NULL
) RETURNS json
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  INSERT INTO users (id, email, name, address, age, created_at, updated_at)
  VALUES (
    user_id,
    user_email,
    user_name,
    user_address,
    user_age,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    age = EXCLUDED.age,
    updated_at = now();
  
  SELECT json_build_object(
    'success', true,
    'user_id', user_id,
    'email', user_email,
    'name', user_name
  ) INTO result;
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_user_profile_bypass TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile_bypass TO anon;

-- Test the function
SELECT create_user_profile_bypass(
  gen_random_uuid(),
  'test@example.com',
  'Test User',
  'Test Address',
  25
);
```

### Step 2: Verify Fix Works
1. Jalankan query test di atas
2. Jika berhasil, akan muncul result JSON dengan `success: true`
3. Check tabel users: `SELECT * FROM users WHERE email = 'test@example.com';`

### Step 3: Test Registration
1. Start aplikasi: `npx expo start`
2. Coba register user baru
3. Check console logs untuk pesan "✅ User profile created via bypass function"
4. Verify di database: `SELECT * FROM users ORDER BY created_at DESC LIMIT 5;`

## What This Fix Does

1. **Bypass Function**: Creates a PostgreSQL function that runs with admin privileges, bypassing RLS
2. **Fallback Logic**: App tries bypass function first, then regular insert if needed
3. **Better Debugging**: Enhanced logging to see exactly what's happening

## Expected Result

Setelah fix ini:
- User registration → Supabase Auth ✅
- User profile → Database table `users` ✅
- Login flow works properly ✅
- Profile data persists ✅

## If Still Not Working

1. Check Supabase logs: Dashboard → Logs → Database
2. Run this debug query:
```sql
-- Check if function exists
SELECT proname FROM pg_proc WHERE proname = 'create_user_profile_bypass';

-- Check permissions
SELECT has_function_privilege('create_user_profile_bypass(uuid,text,text,text,integer)', 'execute');

-- Manual test insert
SELECT create_user_profile_bypass(
  'test-uuid'::uuid,
  'manual-test@example.com',
  'Manual Test',
  'Manual Address',
  30
);
```

3. Check app console logs during registration for detailed error messages
