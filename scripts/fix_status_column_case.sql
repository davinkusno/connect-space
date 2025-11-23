-- Fix status column case sensitivity issue
-- This script ensures the column is lowercase 'status' not 'Status'

-- First, check if column exists with wrong case and rename it
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

-- Update existing members to have status = true (approved) if they are currently members
UPDATE community_members 
SET status = true 
WHERE status IS NULL;





