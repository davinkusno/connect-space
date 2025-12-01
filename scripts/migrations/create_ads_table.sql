-- Create ads table for community advertisements
CREATE TABLE IF NOT EXISTS ads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  placement TEXT NOT NULL CHECK (placement IN ('sidebar', 'banner', 'inline')),
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  click_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for active ads queries
CREATE INDEX IF NOT EXISTS idx_ads_active ON ads(community_id, is_active, placement) WHERE is_active = TRUE;

-- Create index for date range queries
CREATE INDEX IF NOT EXISTS idx_ads_dates ON ads(start_date, end_date) WHERE is_active = TRUE;

-- Enable RLS
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active ads
CREATE POLICY "Anyone can view active ads"
  ON ads FOR SELECT
  USING (is_active = TRUE AND (
    start_date IS NULL OR start_date <= NOW()
  ) AND (
    end_date IS NULL OR end_date >= NOW()
  ));

-- Policy: Super admins can manage all ads
CREATE POLICY "Super admins can manage ads"
  ON ads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'super_admin'
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_ads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ads_updated_at
  BEFORE UPDATE ON ads
  FOR EACH ROW
  EXECUTE FUNCTION update_ads_updated_at();


