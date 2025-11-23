-- Create RPC function to update Status column (case-sensitive)
CREATE OR REPLACE FUNCTION update_community_member_status(
  p_member_id UUID,
  p_status BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  UPDATE community_members
  SET "Status" = p_status
  WHERE id = p_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_community_member_status TO authenticated;





