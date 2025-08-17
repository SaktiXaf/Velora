-- ================================================
-- MIGRATION SCRIPT - UPDATE EXISTING TABLES
-- ================================================
-- Use this if you already have a users table and want to update it

-- Backup existing data first (recommended)
-- CREATE TABLE users_backup AS SELECT * FROM users;

-- Update existing users table structure
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password VARCHAR(255),
ADD COLUMN IF NOT EXISTS name VARCHAR(100),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Rename full_name to name if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'full_name') THEN
        ALTER TABLE users RENAME COLUMN full_name TO name;
    END IF;
END $$;

-- Rename avatar_url to profile_picture if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
        ALTER TABLE users RENAME COLUMN profile_picture TO profile_picture;
    END IF;
END $$;

-- Add constraints
ALTER TABLE users 
ADD CONSTRAINT IF NOT EXISTS check_age CHECK (age > 0 AND age <= 120);

-- Update password field for existing users (temporary default)
UPDATE users 
SET password = '$2a$10$default_hash_change_this' 
WHERE password IS NULL;

-- Make password NOT NULL after setting defaults
ALTER TABLE users 
ALTER COLUMN password SET NOT NULL;

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Add update trigger if not exists
CREATE TRIGGER IF NOT EXISTS update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Show updated table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
