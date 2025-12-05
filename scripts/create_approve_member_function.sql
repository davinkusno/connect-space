-- Create RPC function to approve member (update status to true)
-- Uses SECURITY DEFINER to bypass RLS policies
CREATE OR REPLACE FUNCTION approve_community_member(
  p_member_id UUID,
  p_community_id UUID,
  p_admin_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_member_record RECORD;
BEGIN
  -- Verify the user is an admin of the community
  SELECT EXISTS (
    SELECT 1 
    FROM community_members 
    WHERE community_id = p_community_id 
    AND user_id = p_admin_user_id 
    AND role = 'admin'
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'User is not an admin of this community';
  END IF;
  
  -- Verify the member exists and belongs to the community
  SELECT * INTO v_member_record
  FROM community_members
  WHERE id = p_member_id
  AND community_id = p_community_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found';
  END IF;
  
  -- Update status to true
  UPDATE community_members
  SET status = true
  WHERE id = p_member_id
  AND community_id = p_community_id;
  
  -- Return the updated record
  SELECT row_to_json(t) INTO v_member_record
  FROM (
    SELECT id, status, role, user_id, community_id, joined_at
    FROM community_members
    WHERE id = p_member_id
  ) t;
  
  RETURN to_jsonb(v_member_record);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION approve_community_member TO authenticated;





