-- User Points/Reputation System
-- Tracks user activity, engagement, and reports for community admins

-- Create user_points table to track all point transactions
CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  point_type TEXT NOT NULL CHECK (point_type IN (
    'post_created',
    'post_liked',
    'event_joined',
    'event_created',
    'community_joined',
    'community_created',
    'daily_active',
    'report_received',
    'report_resolved'
  )),
  related_id UUID, -- ID of related entity (post_id, event_id, community_id, report_id)
  related_type TEXT, -- Type of related entity ('post', 'event', 'community', 'report')
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT valid_related_type CHECK (
    (related_id IS NULL AND related_type IS NULL) OR
    (related_id IS NOT NULL AND related_type IS NOT NULL)
  )
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_created_at ON user_points(created_at);
CREATE INDEX IF NOT EXISTS idx_user_points_type ON user_points(point_type);

-- Create user_reputation view for quick access to reputation summary
CREATE OR REPLACE VIEW user_reputation_summary AS
SELECT 
  user_id,
  SUM(CASE WHEN point_type IN ('post_created', 'post_liked', 'event_joined', 'event_created', 'community_joined', 'community_created', 'daily_active') THEN points ELSE 0 END) as activity_points,
  SUM(CASE WHEN point_type = 'report_received' THEN ABS(points) ELSE 0 END) as report_points,
  COUNT(CASE WHEN point_type = 'report_received' THEN 1 END) as report_count,
  COUNT(CASE WHEN point_type = 'post_created' THEN 1 END) as posts_created,
  COUNT(CASE WHEN point_type = 'event_joined' THEN 1 END) as events_joined,
  COUNT(CASE WHEN point_type = 'community_joined' THEN 1 END) as communities_joined,
  COUNT(CASE WHEN point_type = 'daily_active' THEN 1 END) as active_days,
  MAX(created_at) as last_activity_at
FROM user_points
GROUP BY user_id;

-- Function to get user reputation
CREATE OR REPLACE FUNCTION get_user_reputation(p_user_id UUID)
RETURNS TABLE (
  activity_points BIGINT,
  report_points BIGINT,
  report_count BIGINT,
  posts_created BIGINT,
  events_joined BIGINT,
  communities_joined BIGINT,
  active_days BIGINT,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  reputation_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN up.point_type IN ('post_created', 'post_liked', 'event_joined', 'event_created', 'community_joined', 'community_created', 'daily_active') THEN up.points ELSE 0 END), 0)::BIGINT as activity_points,
    COALESCE(SUM(CASE WHEN up.point_type = 'report_received' THEN ABS(up.points) ELSE 0 END), 0)::BIGINT as report_points,
    COALESCE(COUNT(CASE WHEN up.point_type = 'report_received' THEN 1 END), 0)::BIGINT as report_count,
    COALESCE(COUNT(CASE WHEN up.point_type = 'post_created' THEN 1 END), 0)::BIGINT as posts_created,
    COALESCE(COUNT(CASE WHEN up.point_type = 'event_joined' THEN 1 END), 0)::BIGINT as events_joined,
    COALESCE(COUNT(CASE WHEN up.point_type = 'community_joined' THEN 1 END), 0)::BIGINT as communities_joined,
    COALESCE(COUNT(CASE WHEN up.point_type = 'daily_active' THEN 1 END), 0)::BIGINT as active_days,
    MAX(up.created_at) as last_activity_at,
    -- Reputation score: activity_points - (report_points * 10)
    -- Reports are weighted more heavily as negative
    (COALESCE(SUM(CASE WHEN up.point_type IN ('post_created', 'post_liked', 'event_joined', 'event_created', 'community_joined', 'community_created', 'daily_active') THEN up.points ELSE 0 END), 0) - 
     COALESCE(SUM(CASE WHEN up.point_type = 'report_received' THEN ABS(up.points) * 10 ELSE 0 END), 0))::INTEGER as reputation_score
  FROM user_points up
  WHERE up.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own points
CREATE POLICY user_points_select_own ON user_points
  FOR SELECT USING (user_id = auth.uid());

-- Admins can view all points
CREATE POLICY user_points_select_admin ON user_points
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.user_id = auth.uid() 
      AND cm.role IN ('admin', 'moderator')
    )
  );

-- System can insert points (via service role)
-- This will be handled by API routes with service role

-- Grant permissions
GRANT SELECT ON user_points TO authenticated;
GRANT SELECT ON user_reputation_summary TO authenticated;

