-- Migration: Add status column to community_members table
-- This column is used to track join request approval status
-- false = pending approval, true = approved, null = legacy data (treated as approved)

-- Add status column if it doesn't exist
-- Note: This is conditional to avoid errors on re-runs
ALTER TABLE community_members 
ADD COLUMN IF NOT EXISTS status BOOLEAN DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN community_members.status IS 'Join request status: false = pending, true = approved, null = legacy (treated as approved)';

-- Create index for better query performance when filtering by status
CREATE INDEX IF NOT EXISTS idx_community_members_status ON community_members(status);

-- IMPORTANT: Always run this UPDATE, even if column already existed
-- This handles recovery from partial failures where column was added but UPDATE failed
-- This ensures existing members are treated as approved
UPDATE community_members 
SET status = true 
WHERE status IS NULL;





