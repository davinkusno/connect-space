-- Update RLS policy for community_members UPDATE to remove role='admin' requirement
-- This allows any authenticated user to update community_members records
-- (Security is still maintained through application logic and RPC functions)

-- Drop existing update policy
DROP POLICY IF EXISTS community_members_update_policy ON community_members;

-- Create new update policy without role='admin' requirement
-- Allow update if user is authenticated and the record exists
CREATE POLICY community_members_update_policy ON community_members
  FOR UPDATE USING (
    auth.uid() IS NOT NULL  -- User must be authenticated
  );

-- Note: This makes the policy more permissive
-- Application-level checks (like in API routes) should still verify admin permissions
-- RPC functions with SECURITY DEFINER will still work as before

