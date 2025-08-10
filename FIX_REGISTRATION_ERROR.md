# 🚨 SOLUSI: Fix Error Registrasi "Foreign Key Constraint"

## ❌ **Masalah:**
```
RegistrationService: Direct insert failed: insert or update on table "profiles" 
violates foreign key constraint "profiles_id_fkey"
```

## 🎯 **Penyebab:**
- Table `profiles` memiliki foreign key constraint ke `auth.users`
- Constraint tersebut tidak properly configured
- User berhasil dibuat di `auth.users` tapi gagal insert ke `profiles`

## ✅ **SOLUSI CEPAT (Pilih salah satu):**

### **Solusi 1: SQL Quick Fix (DIREKOMENDASIKAN)**

1. **Buka Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Login dan pilih project "my-strava"

2. **Buka SQL Editor:**
   - Klik "SQL Editor" di sidebar
   - Klik "New Query"

3. **Copy paste SQL ini dan RUN:**

```sql
-- Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop problematic foreign key
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Add correct foreign key constraint
ALTER TABLE profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Test the fix
SELECT COUNT(*) as profiles_count FROM profiles;
SELECT COUNT(*) as users_count FROM auth.users;
```

4. **Klik tombol "RUN" ⚡**

### **Solusi 2: Complete Database Reset**

Jika solusi 1 tidak berhasil, gunakan file `fix-registration-error.sql`:

1. Copy semua isi file `fix-registration-error.sql`
2. Paste di Supabase SQL Editor
3. RUN

## 🧪 **Test Registrasi:**

Setelah menjalankan SQL fix:

1. **Restart app** (Ctrl+C di terminal, lalu `npx expo start` lagi)
2. **Test registrasi** dengan data baru:
   - Email: test@example.com
   - Password: test123456
   - Name: Test User
   - Phone: 123456789
   - Address: Test Address

## 📋 **Troubleshooting Lanjutan:**

### **Jika masih error setelah SQL fix:**

1. **Check table structure:**
```sql
\d profiles;
SELECT * FROM auth.users LIMIT 1;
```

2. **Manual profile insert test:**
```sql
-- Get user ID from auth.users
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 1;

-- Try manual insert (replace with actual user ID)
INSERT INTO profiles (id, name, email, phone, address) 
VALUES ('USER_ID_HERE', 'Test', 'test@example.com', '123', 'Test Address');
```

### **Jika foreign key masih bermasalah:**

```sql
-- Remove ALL foreign key constraints
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Make id just a regular UUID column (not foreign key)
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
```

## 🔧 **Kode yang Sudah Diperbaiki:**

File `registrationService.ts` sudah diupdate dengan:
- ✅ Retry mechanism (3 attempts)
- ✅ Wait time setelah user creation
- ✅ Better error handling
- ✅ Progressive delays between retries

## ✅ **Hasil yang Diharapkan:**

Setelah fix, di log akan muncul:
```
RegistrationService: User created: [USER_ID]
RegistrationService: Waiting for auth record to be committed...
RegistrationService: Insert attempt 1/3
RegistrationService: Direct insert successful on attempt 1
RegistrationService: Auto-login successful
```

## 📞 **Jika Masih Bermasalah:**

1. Screenshoot error message lengkap
2. Jalankan query ini di SQL Editor:
```sql
SELECT * FROM information_schema.table_constraints 
WHERE table_name = 'profiles';
```
3. Share hasil query dan error message

---

**🎯 Target:** Registrasi berhasil dan user bisa langsung login!
