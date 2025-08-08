# Fix untuk Error "Row Level Security Policy" pada Registrasi

## Masalah
Error yang terjadi: `new row violates row-level security policy for table "profiles"`

Ini terjadi karena Supabase Row Level Security (RLS) policy tidak mengizinkan user untuk insert data ke tabel profiles.

## Solusi 1: Fix RLS Policy di Supabase Dashboard (DIREKOMENDASIKAN)

1. **Buka Supabase Dashboard**
   - Kunjungi: https://supabase.com/dashboard
   - Login ke project Anda

2. **Buka SQL Editor**
   - Pilih project Anda
   - Klik "SQL Editor" di sidebar kiri

3. **Jalankan SQL Script berikut:**

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

-- Create proper RLS policies
-- Policy for INSERT: Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy for SELECT: Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy for UPDATE: Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy for DELETE: Allow users to delete their own profile
CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE USING (auth.uid() = id);
```

4. **Klik "Run" untuk menjalankan script**

## Solusi 2: Temporary Fix (Jika masih error)

Jika masih ada masalah, coba disable RLS sementara:

```sql
-- TEMPORARY: Disable RLS (NOT RECOMMENDED for production)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

**PENTING**: Setelah testing selesai, enable kembali RLS dan buat policy yang proper.

## Verifikasi Fix

Setelah menjalankan script SQL:

1. Coba register user baru di aplikasi
2. Check console logs untuk memastikan tidak ada error
3. Verify data tersimpan di Supabase Dashboard > Table Editor > profiles

## Jika Masih Ada Masalah

Cek:
1. User sudah authenticated saat insert profile
2. ID user dari auth.uid() sama dengan ID yang diinsert
3. Tabel profiles ada dan accessible

## File yang sudah dibuat
- `supabase-fix.sql` - Script SQL untuk fix RLS policy
- `lib/supabaseAdmin.ts` - Helper functions untuk profile creation

Setelah fix RLS policy, aplikasi seharusnya bisa register user dengan normal.
