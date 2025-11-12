-- Add category column to events table if it doesn't exist
-- Run this in Supabase SQL Editor if you want to use category for events

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Add comment to the column
COMMENT ON COLUMN events.category IS 'Event category (e.g., Technology, Business, Arts, etc.)';




