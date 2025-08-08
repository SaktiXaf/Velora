-- SQL untuk membuat tabel profiles dengan kolom lengkap
-- Jika tabel sudah ada, hapus dulu: DROP TABLE IF EXISTS profiles;

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  bio text,
  age integer,
  avatar text,
  phone text,
  address text,
  created_at timestamp with time zone DEFAULT now()
);

-- Buat index untuk pencarian berdasarkan email dan nama
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_name ON profiles(name);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy untuk user hanya bisa melihat dan edit profil sendiri
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
