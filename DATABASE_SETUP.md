# Database Setup Instructions

## 1. Login ke Supabase Dashboard
- Buka https://supabase.com/dashboard
- Login dengan akun Anda
- Pilih project yang digunakan untuk aplikasi ini

## 2. Setup Database Tables & RLS Policies

Buka **SQL Editor** di dashboard Supabase, lalu jalankan query berikut:

```sql
-- =====================================================
-- UPDATED RLS POLICIES FOR PROFILE UPDATES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Create more permissive policies for development
-- Policy: Allow all reads (for public profiles)
CREATE POLICY "Allow all profile reads" ON public.users
    FOR SELECT USING (true);

-- Policy: Allow all inserts (for registration)
CREATE POLICY "Allow profile creation" ON public.users
    FOR INSERT WITH CHECK (true);

-- Policy: Allow all updates (for development)
CREATE POLICY "Allow profile updates" ON public.users
    FOR UPDATE USING (true) WITH CHECK (true);

-- Grant proper permissions
GRANT ALL PRIVILEGES ON public.users TO authenticated;
GRANT ALL PRIVILEGES ON public.users TO anon;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
```

## 3. Setup Supabase Storage for Avatars

**Option A: Create bucket via SQL (Recommended)**
```sql
-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create permissive policy for development
CREATE POLICY "Allow all avatar operations" ON storage.objects
    FOR ALL USING (bucket_id = 'avatars')
    WITH CHECK (bucket_id = 'avatars');
```

**Option B: Create bucket manually**
1. Go to Supabase Dashboard > **Storage**
2. Click "New bucket"
3. Bucket name: `avatars`
4. Check "Public bucket" ✅
5. Click "Create bucket"

## 4. Test Database Connection
Setelah menjalankan query di atas, coba test manual update:

```sql
-- Test update query (ganti dengan user ID yang sesuai)
UPDATE public.users 
SET 
    bio = 'Updated bio from SQL',
    age = 20,
    avatar = 'test-avatar-url'
WHERE email = 'saktiselginov4@gmail.com';

-- Verify the update worked
SELECT id, email, name, bio, age, avatar, updated_at 
FROM public.users 
WHERE email = 'saktiselginov4@gmail.com';
```

## 4. Alternatif: Disable RLS untuk Development

Jika masih ada masalah, sementara disable RLS:

```sql
-- Disable RLS for development (TIDAK AMAN untuk production!)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Re-enable later when ready for production
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

## 5. Verify Schema
Pastikan tabel users memiliki kolom yang diperlukan:

```sql
-- Check table structure
\d public.users;

-- Or use this query
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

## Expected Output:
Kolom yang harus ada:
- id (UUID)
- email (VARCHAR)
- name (VARCHAR) 
- username (VARCHAR)
- bio (TEXT)
- age (INTEGER)
- avatar (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- is_active (BOOLEAN)
