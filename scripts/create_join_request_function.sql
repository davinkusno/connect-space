-- Create RPC function to insert join request with Status column (case-sensitive)
CREATE OR REPLACE FUNCTION insert_community_member_join_request(
  p_community_id UUID,
  p_user_id UUID,
  p_role TEXT DEFAULT 'member'
)
RETURNS TABLE (
  id UUID,
  community_id UUID,
  user_id UUID,
  role TEXT,
  joined_at TIMESTAMPTZ,
  "Status" BOOLEAN
) AS $$
DECLARE
  v_result RECORD;
BEGIN
  INSERT INTO community_members (community_id, user_id, role, "Status")
  VALUES (p_community_id, p_user_id, p_role, false)
  RETURNING * INTO v_result;
  
  RETURN QUERY SELECT 
    v_result.id,
    v_result.community_id,
    v_result.user_id,
    v_result.role,
    v_result.joined_at,
    v_result."Status";
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION insert_community_member_join_request TO authenticated;

