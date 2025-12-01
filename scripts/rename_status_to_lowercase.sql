-- Rename Status column to status (lowercase) for better Supabase client compatibility
-- This script renames the case-sensitive "Status" column to lowercase "status"

-- First, check if "Status" (uppercase) exists and rename it
-- Note: Column creation/renaming is conditional to avoid errors on re-runs
DO $$
BEGIN
  -- Check if 'Status' (uppercase) exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'community_members' 
    AND column_name = 'Status'
  ) THEN
    -- Rename 'Status' to 'status' (lowercase)
    ALTER TABLE community_members RENAME COLUMN "Status" TO status;
    RAISE NOTICE 'Renamed Status column to status (lowercase)';
  END IF;
  
  -- If lowercase 'status' doesn't exist, create it
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'community_members' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE community_members 
    ADD COLUMN status BOOLEAN DEFAULT NULL;
    RAISE NOTICE 'Created status column (lowercase)';
  END IF;
END $$;

-- Add comment to explain the column
COMMENT ON COLUMN community_members.status IS 'Join request status: false = pending, true = approved, null = legacy (treated as approved)';

-- Create index for better query performance when filtering by status
CREATE INDEX IF NOT EXISTS idx_community_members_status ON community_members(status);

-- IMPORTANT: Always run this UPDATE, even if column already existed
-- This handles recovery from partial failures where column was added but UPDATE failed
-- Update existing members to have status = true (approved) if they are currently members
UPDATE community_members 
SET status = true 
WHERE status IS NULL;





