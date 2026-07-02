-- Fix user_streaks table structure
-- This script safely migrates from 'date' column to 'streak_date'

-- First, check if we need to rename the column
DO $$
BEGIN
    -- If 'date' column exists, rename it to 'streak_date'
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_streaks' AND column_name = 'date'
    ) THEN
        ALTER TABLE user_streaks RENAME COLUMN date TO streak_date;
        RAISE NOTICE 'Renamed column date to streak_date';
    END IF;
    
    -- If neither column exists, add streak_date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_streaks' AND column_name = 'streak_date'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_streaks' AND column_name = 'date'
    ) THEN
        ALTER TABLE user_streaks ADD COLUMN streak_date DATE NOT NULL DEFAULT CURRENT_DATE;
        RAISE NOTICE 'Added streak_date column';
    END IF;
END$$;

-- Ensure the unique constraint exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_streaks_user_id_streak_date_key'
    ) THEN
        -- Drop old constraint if exists with different name
        BEGIN
            ALTER TABLE user_streaks DROP CONSTRAINT IF EXISTS user_streaks_user_id_date_key;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
        
        -- Add new constraint
        ALTER TABLE user_streaks ADD CONSTRAINT user_streaks_user_id_streak_date_key UNIQUE(user_id, streak_date);
    END IF;
END$$;

-- Create index if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_streaks_user_date') THEN
        CREATE INDEX idx_user_streaks_user_date ON user_streaks(user_id, streak_date DESC);
    END IF;
END$$;
