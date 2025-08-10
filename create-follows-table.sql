-- SQL script to create follows table for social features
-- Run this in Supabase SQL Editor

-- Create follows table for user relationships
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure a user can't follow the same person twice
  UNIQUE(follower_id, following_id),
  
  -- Ensure a user can't follow themselves
  CHECK (follower_id != following_id)
);

-- Enable RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view follows" ON follows;
DROP POLICY IF EXISTS "Users can insert follows" ON follows;
DROP POLICY IF EXISTS "Users can delete follows" ON follows;

-- Create RLS policies for follows table
-- Policy for SELECT: Users can view all follow relationships
CREATE POLICY "Users can view follows" ON follows
  FOR SELECT USING (true);

-- Policy for INSERT: Users can only follow others (not themselves)
CREATE POLICY "Users can insert follows" ON follows
  FOR INSERT WITH CHECK (
    auth.uid() = follower_id AND 
    auth.uid() != following_id
  );

-- Policy for DELETE: Users can only unfollow people they are following
CREATE POLICY "Users can delete follows" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS follows_follower_id_idx ON follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON follows(following_id);
CREATE INDEX IF NOT EXISTS follows_created_at_idx ON follows(created_at);

-- Add profiles table public read policy for user search
-- This allows users to search for other users
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Verify the table was created correctly
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'follows'
ORDER BY ordinal_position;

-- Test query to verify everything works
SELECT COUNT(*) as total_follows FROM follows;
