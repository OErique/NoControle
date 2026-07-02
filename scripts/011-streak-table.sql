-- Streak table is now created in 001-create-schema.sql
-- This file adds any missing columns to users table

-- Add streak columns to users if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity_date DATE;

SELECT 'Streak columns added successfully' AS message;
