-- Add status and activity tracking columns to communities table
-- This enables better management of inactive/suspended communities

-- Add status column (active, suspended, archived)
ALTER TABLE communities
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived'));

-- Add last activity tracking columns
ALTER TABLE communities
ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_activity_type VARCHAR(20) CHECK (last_activity_type IN ('event', 'announcement', 'post'));

-- Add suspension tracking columns
ALTER TABLE communities
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT DEFAULT 'Auto-suspended due to inactivity (30+ days)';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_communities_status ON communities(status);
CREATE INDEX IF NOT EXISTS idx_communities_last_activity ON communities(last_activity_date);
CREATE INDEX IF NOT EXISTS idx_communities_status_activity ON communities(status, last_activity_date);

-- Update existing communities to have 'active' status if null
UPDATE communities
SET status = 'active'
WHERE status IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN communities.status IS 'Community status: active, suspended, or archived';
COMMENT ON COLUMN communities.last_activity_date IS 'Timestamp of last admin activity (event or announcement)';
COMMENT ON COLUMN communities.last_activity_type IS 'Type of last activity: event, announcement, or post';
COMMENT ON COLUMN communities.suspended_at IS 'Timestamp when community was suspended';
COMMENT ON COLUMN communities.suspension_reason IS 'Reason for suspension';



