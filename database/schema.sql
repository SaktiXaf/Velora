
-- =====================================================
-- 1. TABEL USERS - Menyimpan data pengguna
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE,
    bio TEXT,
    avatar TEXT,
    age INTEGER CHECK (age > 0 AND age <= 120),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Index untuk performa query yang lebih baik
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- =====================================================
-- 2. TABEL FOLLOWS - Menyimpan relasi follower/following
-- =====================================================
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint untuk mencegah duplicate follows dan self-follow
    UNIQUE(follower_id, following_id),
    CHECK(follower_id != following_id)
);

-- Index untuk performa query followers/following
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON public.follows(created_at);

-- =====================================================
-- 3. VIEW UNTUK STATISTICS - Hitung followers/following
-- =====================================================
CREATE OR REPLACE VIEW public.user_follow_stats AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.username,
    COALESCE(followers.count, 0) as followers_count,
    COALESCE(following.count, 0) as following_count
FROM public.users u
LEFT JOIN (
    SELECT following_id, COUNT(*) as count
    FROM public.follows
    GROUP BY following_id
) followers ON u.id = followers.following_id
LEFT JOIN (
    SELECT follower_id, COUNT(*) as count
    FROM public.follows
    GROUP BY follower_id
) following ON u.id = following.follower_id;

-- =====================================================
-- 4. FUNCTIONS UNTUK FOLLOW/UNFOLLOW
-- =====================================================

-- Function untuk follow user
CREATE OR REPLACE FUNCTION public.follow_user(
    p_follower_id UUID,
    p_following_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    -- Cek apakah user yang akan di-follow ada
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_following_id AND is_active = true) THEN
        RAISE EXCEPTION 'User to follow does not exist or is inactive';
    END IF;
    
    -- Cek apakah follower ada
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_follower_id AND is_active = true) THEN
        RAISE EXCEPTION 'Follower user does not exist or is inactive';
    END IF;
    
    -- Cek apakah sudah follow
    IF EXISTS (SELECT 1 FROM public.follows WHERE follower_id = p_follower_id AND following_id = p_following_id) THEN
        RETURN FALSE; -- Sudah follow
    END IF;
    
    -- Insert follow record
    INSERT INTO public.follows (follower_id, following_id)
    VALUES (p_follower_id, p_following_id);
    
    RETURN TRUE; -- Berhasil follow
END;
$$ LANGUAGE plpgsql;

-- Function untuk unfollow user
CREATE OR REPLACE FUNCTION public.unfollow_user(
    p_follower_id UUID,
    p_following_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    -- Delete follow record
    DELETE FROM public.follows 
    WHERE follower_id = p_follower_id AND following_id = p_following_id;
    
    -- Return true jika ada record yang dihapus
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. TRIGGERS UNTUK AUTO UPDATE TIMESTAMP
-- =====================================================

-- Function untuk update timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk auto update timestamp di tabel users
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS) - Optional untuk keamanan
-- =====================================================

-- Enable RLS pada tabel users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users dapat melihat semua profile public
CREATE POLICY "Users can view all profiles" ON public.users
    FOR SELECT USING (true);

-- Policy: Users dapat membuat akun baru (untuk registrasi)
-- Izinkan insert jika auth.uid() sama dengan id, ATAU jika belum ada session (untuk registrasi baru)
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

-- Policy: Users hanya dapat update profile sendiri
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Enable RLS pada tabel follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Policy: Semua orang dapat melihat follow relationships
CREATE POLICY "Anyone can view follows" ON public.follows
    FOR SELECT USING (true);

-- Policy: Users hanya dapat follow/unfollow dengan akun sendiri
CREATE POLICY "Users can manage own follows" ON public.follows
    FOR ALL USING (auth.uid() = follower_id);

-- =====================================================
-- 7. SAMPLE DATA UNTUK TESTING
-- =====================================================

-- Insert sample users
INSERT INTO public.users (id, email, name, username, bio, age) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'alex.runner@example.com', 'Alex Runner', 'alex_runner', 'Marathon enthusiast and BlueTrack user', 28),
('550e8400-e29b-41d4-a716-446655440002', 'maria.fitness@example.com', 'Maria Fitness', 'maria_fit', 'Fitness trainer who loves tracking workouts', 32),
('550e8400-e29b-41d4-a716-446655440003', 'john.cyclist@example.com', 'John Cyclist', 'john_bikes', 'Cycling enthusiast and weekend warrior', 25),
('550e8400-e29b-41d4-a716-446655440004', 'sarah.walker@example.com', 'Sarah Walker', 'sarah_walks', 'Daily walker and health advocate', 30),
('550e8400-e29b-41d4-a716-446655440005', 'david.coach@example.com', 'David Coach', 'david_coach', 'Professional fitness coach', 35),
('550e8400-e29b-41d4-a716-446655440006', 'emma.runner@example.com', 'Emma Runner', 'emma_runs', 'Ultra marathon runner', 29)
ON CONFLICT (email) DO NOTHING;

-- Insert sample follows (Alex follows Maria, John, Sarah)
INSERT INTO public.follows (follower_id, following_id) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004'),

-- Maria follows Alex, David, Emma
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005'),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440006'),

-- John follows Alex, Sarah
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004'),

-- Sarah follows Maria, David
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005')
ON CONFLICT (follower_id, following_id) DO NOTHING;

-- =====================================================
-- 8. USEFUL QUERIES UNTUK APLIKASI
-- =====================================================

-- Query untuk mendapatkan followers dari user tertentu
-- SELECT u.id, u.name, u.username, u.bio, u.avatar 
-- FROM public.users u
-- JOIN public.follows f ON u.id = f.follower_id
-- WHERE f.following_id = '[USER_ID]'
-- ORDER BY f.created_at DESC;

-- Query untuk mendapatkan following dari user tertentu  
-- SELECT u.id, u.name, u.username, u.bio, u.avatar
-- FROM public.users u  
-- JOIN public.follows f ON u.id = f.following_id
-- WHERE f.follower_id = '[USER_ID]'
-- ORDER BY f.created_at DESC;

-- Query untuk mendapatkan statistics follow
-- SELECT * FROM public.user_follow_stats WHERE id = '[USER_ID]';

-- Query untuk cek apakah user A mengikuti user B
-- SELECT EXISTS(
--     SELECT 1 FROM public.follows 
--     WHERE follower_id = '[USER_A_ID]' AND following_id = '[USER_B_ID]'
-- ) as is_following;
