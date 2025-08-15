-- =====================================================
-- QUERIES UNTUK APLIKASI BLUETRACK
-- File: queries.sql
-- =====================================================

-- =====================================================
-- 1. QUERIES UNTUK FOLLOWERS
-- =====================================================

-- Mendapatkan daftar followers dari user tertentu
-- Parameter: user_id (UUID)
SELECT 
    u.id,
    u.name,
    u.username,
    u.email,
    u.bio,
    u.avatar,
    u.age,
    f.created_at as followed_at
FROM public.users u
INNER JOIN public.follows f ON u.id = f.follower_id
WHERE f.following_id = $1  -- Parameter: user_id
  AND u.is_active = true
ORDER BY f.created_at DESC
LIMIT 50;

-- =====================================================
-- 2. QUERIES UNTUK FOLLOWING
-- =====================================================

-- Mendapatkan daftar following dari user tertentu
-- Parameter: user_id (UUID)
SELECT 
    u.id,
    u.name,
    u.username,
    u.email,
    u.bio,
    u.avatar,
    u.age,
    f.created_at as followed_at
FROM public.users u
INNER JOIN public.follows f ON u.id = f.following_id
WHERE f.follower_id = $1  -- Parameter: user_id
  AND u.is_active = true
ORDER BY f.created_at DESC
LIMIT 50;

-- =====================================================
-- 3. QUERIES UNTUK STATISTICS
-- =====================================================

-- Mendapatkan jumlah followers dan following
-- Parameter: user_id (UUID)
SELECT 
    u.id,
    u.name,
    u.username,
    COALESCE(followers.count, 0) as followers_count,
    COALESCE(following.count, 0) as following_count
FROM public.users u
LEFT JOIN (
    SELECT following_id, COUNT(*) as count
    FROM public.follows f2
    INNER JOIN public.users u2 ON f2.follower_id = u2.id
    WHERE u2.is_active = true
    GROUP BY following_id
) followers ON u.id = followers.following_id
LEFT JOIN (
    SELECT follower_id, COUNT(*) as count
    FROM public.follows f3
    INNER JOIN public.users u3 ON f3.following_id = u3.id
    WHERE u3.is_active = true
    GROUP BY follower_id
) following ON u.id = following.follower_id
WHERE u.id = $1  -- Parameter: user_id
  AND u.is_active = true;

-- =====================================================
-- 4. QUERIES UNTUK CEK RELATIONSHIP
-- =====================================================

-- Cek apakah user A mengikuti user B
-- Parameter: follower_id (UUID), following_id (UUID)
SELECT EXISTS(
    SELECT 1 FROM public.follows f
    INNER JOIN public.users u1 ON f.follower_id = u1.id
    INNER JOIN public.users u2 ON f.following_id = u2.id
    WHERE f.follower_id = $1  -- Parameter: follower_id
      AND f.following_id = $2  -- Parameter: following_id
      AND u1.is_active = true
      AND u2.is_active = true
) as is_following;

-- Cek relationship mutual (saling mengikuti)
-- Parameter: user_a_id (UUID), user_b_id (UUID)
SELECT 
    EXISTS(
        SELECT 1 FROM public.follows 
        WHERE follower_id = $1 AND following_id = $2
    ) as a_follows_b,
    EXISTS(
        SELECT 1 FROM public.follows 
        WHERE follower_id = $2 AND following_id = $1
    ) as b_follows_a,
    (
        EXISTS(SELECT 1 FROM public.follows WHERE follower_id = $1 AND following_id = $2) AND
        EXISTS(SELECT 1 FROM public.follows WHERE follower_id = $2 AND following_id = $1)
    ) as is_mutual;

-- =====================================================
-- 5. QUERIES UNTUK FOLLOW/UNFOLLOW ACTIONS
-- =====================================================

-- Follow user (menggunakan function)
-- Parameter: follower_id (UUID), following_id (UUID)
SELECT public.follow_user($1, $2) as success;

-- Unfollow user (menggunakan function)  
-- Parameter: follower_id (UUID), following_id (UUID)
SELECT public.unfollow_user($1, $2) as success;

-- Manual follow (tanpa function)
-- Parameter: follower_id (UUID), following_id (UUID)
INSERT INTO public.follows (follower_id, following_id)
SELECT $1, $2
WHERE NOT EXISTS (
    SELECT 1 FROM public.follows 
    WHERE follower_id = $1 AND following_id = $2
)
AND EXISTS (SELECT 1 FROM public.users WHERE id = $1 AND is_active = true)
AND EXISTS (SELECT 1 FROM public.users WHERE id = $2 AND is_active = true)
AND $1 != $2;

-- Manual unfollow (tanpa function)
-- Parameter: follower_id (UUID), following_id (UUID)
DELETE FROM public.follows 
WHERE follower_id = $1 AND following_id = $2;

-- =====================================================
-- 6. QUERIES UNTUK DISCOVERY/RECOMMENDATIONS
-- =====================================================

-- Mencari users yang belum di-follow
-- Parameter: current_user_id (UUID), search_term (TEXT), limit (INTEGER)
SELECT 
    u.id,
    u.name,
    u.username,
    u.bio,
    u.avatar,
    stats.followers_count,
    stats.following_count
FROM public.users u
LEFT JOIN public.user_follow_stats stats ON u.id = stats.id
WHERE u.id != $1  -- Parameter: current_user_id
  AND u.is_active = true
  AND NOT EXISTS (
      SELECT 1 FROM public.follows 
      WHERE follower_id = $1 AND following_id = u.id
  )
  AND (
      u.name ILIKE '%' || $2 || '%' OR  -- Parameter: search_term
      u.username ILIKE '%' || $2 || '%' OR
      u.bio ILIKE '%' || $2 || '%'
  )
ORDER BY stats.followers_count DESC NULLS LAST, u.created_at DESC
LIMIT $3;  -- Parameter: limit

-- Rekomendasi users berdasarkan mutual followers
-- Parameter: current_user_id (UUID), limit (INTEGER)
SELECT 
    u.id,
    u.name,
    u.username,
    u.bio,
    u.avatar,
    COUNT(mutual.follower_id) as mutual_followers_count,
    stats.followers_count,
    stats.following_count
FROM public.users u
INNER JOIN public.follows f ON u.id = f.following_id
INNER JOIN public.follows mutual ON f.follower_id = mutual.following_id
LEFT JOIN public.user_follow_stats stats ON u.id = stats.id
WHERE mutual.follower_id = $1  -- Parameter: current_user_id
  AND u.id != $1
  AND u.is_active = true
  AND NOT EXISTS (
      SELECT 1 FROM public.follows 
      WHERE follower_id = $1 AND following_id = u.id
  )
GROUP BY u.id, u.name, u.username, u.bio, u.avatar, stats.followers_count, stats.following_count
HAVING COUNT(mutual.follower_id) > 0
ORDER BY mutual_followers_count DESC, stats.followers_count DESC NULLS LAST
LIMIT $2;  -- Parameter: limit

-- =====================================================
-- 7. QUERIES UNTUK ANALYTICS
-- =====================================================

-- Top users dengan followers terbanyak
-- Parameter: limit (INTEGER)
SELECT 
    u.id,
    u.name,
    u.username,
    u.bio,
    u.avatar,
    u.created_at,
    stats.followers_count,
    stats.following_count
FROM public.users u
INNER JOIN public.user_follow_stats stats ON u.id = stats.id
WHERE u.is_active = true
  AND stats.followers_count > 0
ORDER BY stats.followers_count DESC, u.created_at ASC
LIMIT $1;  -- Parameter: limit

-- Growth followers per hari (7 hari terakhir)
-- Parameter: user_id (UUID)
SELECT 
    DATE(f.created_at) as follow_date,
    COUNT(*) as new_followers
FROM public.follows f
INNER JOIN public.users u ON f.follower_id = u.id
WHERE f.following_id = $1  -- Parameter: user_id
  AND f.created_at >= NOW() - INTERVAL '7 days'
  AND u.is_active = true
GROUP BY DATE(f.created_at)
ORDER BY follow_date DESC;

-- =====================================================
-- 8. QUERIES UNTUK MAINTENANCE
-- =====================================================

-- Cleanup follows dari users yang tidak aktif
DELETE FROM public.follows 
WHERE follower_id IN (SELECT id FROM public.users WHERE is_active = false)
   OR following_id IN (SELECT id FROM public.users WHERE is_active = false);

-- Reindex untuk performa
REINDEX INDEX idx_follows_follower_id;
REINDEX INDEX idx_follows_following_id;
REINDEX INDEX idx_follows_created_at;

-- Update statistics view (jika diperlukan)
REFRESH MATERIALIZED VIEW IF EXISTS public.user_follow_stats_materialized;
