-- ================================================
-- VELORA APP - SUPABASE POSTGRESQL SCHEMA
-- ================================================
-- Run this script in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- USERS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    bio TEXT,
    profile_picture TEXT,
    address TEXT,
    age INTEGER CHECK (age > 0 AND age <= 120),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- ================================================
-- FOLLOWS TABLE (Follower/Following System)
-- ================================================
CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a user cannot follow the same user twice
    CONSTRAINT unique_follow UNIQUE(follower_id, following_id),
    -- Ensure a user cannot follow themselves
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Create indexes for follows table
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at);

-- ================================================
-- ACTIVITIES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('post', 'like', 'update_profile', 'follow', 'comment', 'share')),
    content TEXT,
    metadata JSONB, -- For storing additional activity data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for activities table
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);
CREATE INDEX IF NOT EXISTS idx_activities_user_type ON activities(user_id, type);

-- ================================================
-- FUNCTIONS AND TRIGGERS
-- ================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at for users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- USEFUL VIEWS
-- ================================================

-- View to get user stats (followers, following, activities count)
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id,
    u.email,
    u.name,
    u.created_at,
    COALESCE(follower_count.count, 0) as followers_count,
    COALESCE(following_count.count, 0) as following_count,
    COALESCE(activity_count.count, 0) as activities_count
FROM users u
LEFT JOIN (
    SELECT following_id, COUNT(*) as count 
    FROM follows 
    GROUP BY following_id
) follower_count ON u.id = follower_count.following_id
LEFT JOIN (
    SELECT follower_id, COUNT(*) as count 
    FROM follows 
    GROUP BY follower_id
) following_count ON u.id = following_count.follower_id
LEFT JOIN (
    SELECT user_id, COUNT(*) as count 
    FROM activities 
    GROUP BY user_id
) activity_count ON u.id = activity_count.user_id;

-- ================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view all profiles" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Follows table policies
CREATE POLICY "Users can view all follows" ON follows
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own follows" ON follows
    FOR ALL USING (auth.uid() = follower_id);

-- Activities table policies
CREATE POLICY "Users can view all activities" ON activities
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own activities" ON activities
    FOR ALL USING (auth.uid() = user_id);

-- ================================================
-- SAMPLE DATA (OPTIONAL)
-- ================================================

-- Uncomment below to insert sample data for testing
/*
-- Insert sample users
INSERT INTO users (email, password, name, bio, address, age) VALUES
('john@example.com', '$2a$10$example_hashed_password', 'John Doe', 'Software Developer', '123 Main St', 28),
('jane@example.com', '$2a$10$example_hashed_password', 'Jane Smith', 'Designer', '456 Oak Ave', 25),
('bob@example.com', '$2a$10$example_hashed_password', 'Bob Wilson', 'Photographer', '789 Pine Rd', 32);

-- Insert sample follows (John follows Jane, Jane follows Bob, Bob follows John)
INSERT INTO follows (follower_id, following_id) 
SELECT u1.id, u2.id 
FROM users u1, users u2 
WHERE u1.email = 'john@example.com' AND u2.email = 'jane@example.com'
UNION ALL
SELECT u1.id, u2.id 
FROM users u1, users u2 
WHERE u1.email = 'jane@example.com' AND u2.email = 'bob@example.com'
UNION ALL
SELECT u1.id, u2.id 
FROM users u1, users u2 
WHERE u1.email = 'bob@example.com' AND u2.email = 'john@example.com';

-- Insert sample activities
INSERT INTO activities (user_id, type, content)
SELECT u.id, 'post', 'Hello world! This is my first post.'
FROM users u WHERE u.email = 'john@example.com'
UNION ALL
SELECT u.id, 'update_profile', 'Updated my bio'
FROM users u WHERE u.email = 'jane@example.com';
*/

-- ================================================
-- USEFUL QUERIES FOR DEVELOPMENT
-- ================================================

-- Get all followers of a specific user
-- SELECT u.name, u.email FROM users u 
-- JOIN follows f ON u.id = f.follower_id 
-- WHERE f.following_id = 'USER_ID_HERE';

-- Get all users that a specific user is following
-- SELECT u.name, u.email FROM users u 
-- JOIN follows f ON u.id = f.following_id 
-- WHERE f.follower_id = 'USER_ID_HERE';

-- Get recent activities for a user's timeline (including followed users)
-- SELECT a.*, u.name, u.email FROM activities a
-- JOIN users u ON a.user_id = u.id
-- WHERE a.user_id IN (
--     SELECT following_id FROM follows WHERE follower_id = 'USER_ID_HERE'
--     UNION SELECT 'USER_ID_HERE' -- Include own activities
-- )
-- ORDER BY a.created_at DESC
-- LIMIT 20;

-- ================================================
-- MIGRATION COMPLETED
-- ================================================
COMMENT ON TABLE users IS 'Main users table with profile information';
COMMENT ON TABLE follows IS 'Follower/Following relationships between users';
COMMENT ON TABLE activities IS 'User activities and interactions log';

-- Show table creation summary
SELECT 'Schema created successfully!' as status;
