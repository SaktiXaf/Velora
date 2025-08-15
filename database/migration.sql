-- =====================================================
-- MIGRATION SCRIPT - Setup BlueTrack Database
-- File: migration.sql
-- Jalankan script ini untuk setup database dari awal
-- =====================================================

-- =====================================================
-- 1. CREATE EXTENSIONS (jika diperlukan)
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================  
-- 2. DROP EXISTING OBJECTS (untuk reset database)
-- =====================================================
-- HATI-HATI: Uncomment baris di bawah jika ingin reset database
-- DROP VIEW IF EXISTS public.user_follow_stats CASCADE;
-- DROP TABLE IF EXISTS public.follows CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;
-- DROP FUNCTION IF EXISTS public.follow_user(UUID, UUID) CASCADE;
-- DROP FUNCTION IF EXISTS public.unfollow_user(UUID, UUID) CASCADE;
-- DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- =====================================================
-- 3. CREATE TABLES
-- =====================================================

-- Tabel Users
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

-- Tabel Follows
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(follower_id, following_id),
    CHECK(follower_id != following_id)
);

-- =====================================================
-- 4. CREATE INDEXES
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- Follows indexes  
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON public.follows(created_at);
CREATE INDEX IF NOT EXISTS idx_follows_follower_following ON public.follows(follower_id, following_id);

-- =====================================================
-- 5. CREATE FUNCTIONS
-- =====================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Follow user function
CREATE OR REPLACE FUNCTION public.follow_user(
    p_follower_id UUID,
    p_following_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_following_id AND is_active = true) THEN
        RAISE EXCEPTION 'User to follow does not exist or is inactive';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_follower_id AND is_active = true) THEN
        RAISE EXCEPTION 'Follower user does not exist or is inactive';
    END IF;
    
    IF EXISTS (SELECT 1 FROM public.follows WHERE follower_id = p_follower_id AND following_id = p_following_id) THEN
        RETURN FALSE;
    END IF;
    
    INSERT INTO public.follows (follower_id, following_id)
    VALUES (p_follower_id, p_following_id);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Unfollow user function
CREATE OR REPLACE FUNCTION public.unfollow_user(
    p_follower_id UUID,
    p_following_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM public.follows 
    WHERE follower_id = p_follower_id AND following_id = p_following_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. CREATE TRIGGERS
-- =====================================================

-- Auto update timestamp trigger
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 7. CREATE VIEWS
-- =====================================================

-- User follow statistics view
CREATE OR REPLACE VIEW public.user_follow_stats AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.username,
    u.bio,
    u.avatar,
    u.age,
    u.created_at,
    u.updated_at,
    u.is_active,
    COALESCE(followers.count, 0) as followers_count,
    COALESCE(following.count, 0) as following_count
FROM public.users u
LEFT JOIN (
    SELECT f.following_id, COUNT(*) as count
    FROM public.follows f
    INNER JOIN public.users fu ON f.follower_id = fu.id
    WHERE fu.is_active = true
    GROUP BY f.following_id
) followers ON u.id = followers.following_id
LEFT JOIN (
    SELECT f.follower_id, COUNT(*) as count
    FROM public.follows f
    INNER JOIN public.users fu ON f.following_id = fu.id
    WHERE fu.is_active = true
    GROUP BY f.follower_id
) following ON u.id = following.follower_id;

-- =====================================================
-- 8. SETUP ROW LEVEL SECURITY (Optional)
-- =====================================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Users policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
CREATE POLICY "Users can view all profiles" ON public.users
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

-- Follows policies
DROP POLICY IF EXISTS "Anyone can view follows" ON public.follows;
CREATE POLICY "Anyone can view follows" ON public.follows
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own follows" ON public.follows;
CREATE POLICY "Users can manage own follows" ON public.follows
    FOR ALL USING (auth.uid() = follower_id);

-- =====================================================
-- 9. INSERT SAMPLE DATA
-- =====================================================

-- Insert sample users (akan di-skip jika sudah ada)
INSERT INTO public.users (id, email, name, username, bio, age) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'alex.runner@bluetrackapp.com', 'Alex Runner', 'alex_runner', 'Marathon enthusiast and BlueTrack power user 🏃‍♂️', 28),
('550e8400-e29b-41d4-a716-446655440002', 'maria.fitness@bluetrackapp.com', 'Maria Fitness', 'maria_fit', 'Certified fitness trainer who loves tracking workouts 💪', 32),
('550e8400-e29b-41d4-a716-446655440003', 'john.cyclist@bluetrackapp.com', 'John Cyclist', 'john_bikes', 'Cycling enthusiast and weekend warrior 🚴‍♂️', 25),
('550e8400-e29b-41d4-a716-446655440004', 'sarah.walker@bluetrackapp.com', 'Sarah Walker', 'sarah_walks', 'Daily walker and health advocate 🚶‍♀️', 30),
('550e8400-e29b-41d4-a716-446655440005', 'david.coach@bluetrackapp.com', 'David Coach', 'david_coach', 'Professional fitness coach and motivator 🎯', 35),
('550e8400-e29b-41d4-a716-446655440006', 'emma.runner@bluetrackapp.com', 'Emma Runner', 'emma_runs', 'Ultra marathon runner and outdoor enthusiast 🌟', 29),
('550e8400-e29b-41d4-a716-446655440007', 'mike.trainer@bluetrackapp.com', 'Mike Trainer', 'mike_train', 'Personal trainer specializing in strength training 🏋️‍♂️', 33),
('550e8400-e29b-41d4-a716-446655440008', 'lisa.yoga@bluetrackapp.com', 'Lisa Zen', 'lisa_yoga', 'Yoga instructor and mindfulness coach 🧘‍♀️', 27)
ON CONFLICT (email) DO NOTHING;

-- Insert sample follows untuk membuat network yang realistis
INSERT INTO public.follows (follower_id, following_id) VALUES
-- Alex mengikuti hampir semua orang (active user)
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440006'),

-- Maria sebagai trainer, banyak yang mengikuti
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002'),

-- John cyclist network
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004'),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440006'),

-- Sarah walker connections
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005'),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440008'),

-- David coach followers
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440005'),
('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440005'),
('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440005'),

-- Emma runner connections
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440007'),

-- Mike trainer network
('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440006'),
('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440008'),

-- Lisa yoga followers
('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440006'),
('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440007')
ON CONFLICT (follower_id, following_id) DO NOTHING;

-- =====================================================
-- 10. VERIFICATION QUERIES
-- =====================================================

-- Cek jumlah users
SELECT 'Users created:' as status, COUNT(*) as count FROM public.users;

-- Cek jumlah follows
SELECT 'Follows created:' as status, COUNT(*) as count FROM public.follows;

-- Cek statistics
SELECT 'Top users by followers:' as status;
SELECT name, username, followers_count, following_count 
FROM public.user_follow_stats 
WHERE followers_count > 0 
ORDER BY followers_count DESC 
LIMIT 5;

-- Setup completed message
SELECT '✅ Database setup completed successfully!' as message;
