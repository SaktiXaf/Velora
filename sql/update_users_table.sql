-- SQL script to update users table with new fields
-- Run this in Supabase SQL Editor

-- Add address column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add age column if it doesn't exist (might already exist)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS age INTEGER;

-- Update existing records to have default values if needed
UPDATE users 
SET address = '' 
WHERE address IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_full_name ON users(full_name);
CREATE INDEX IF NOT EXISTS idx_users_age ON users(age);
