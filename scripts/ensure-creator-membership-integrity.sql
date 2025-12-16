-- Migration: Ensure Creator Membership Integrity
-- This script ensures that all community creators have proper membership records
-- and adds safeguards to prevent creator role changes/removal

-- ==================== STEP 1: Ensure all creators have membership records ====================
-- Add any missing creator membership records
INSERT INTO community_members (community_id, user_id, role, status, joined_at)
SELECT 
    c.id AS community_id,
    c.creator_id AS user_id,
    'admin' AS role,
    'approved' AS status,
    c.created_at AS joined_at
FROM communities c
WHERE NOT EXISTS (
    SELECT 1 
    FROM community_members cm 
    WHERE cm.community_id = c.id 
    AND cm.user_id = c.creator_id
)
ON CONFLICT (community_id, user_id) DO NOTHING;

-- ==================== STEP 2: Update any existing creator memberships to admin role ====================
-- Ensure creators who are members have admin role
UPDATE community_members cm
SET role = 'admin'
FROM communities c
WHERE cm.community_id = c.id
  AND cm.user_id = c.creator_id
  AND cm.role != 'admin';

-- ==================== STEP 3: Create function to prevent creator role changes ====================
-- This function will be called before UPDATE to prevent changing creator's role
CREATE OR REPLACE FUNCTION prevent_creator_role_change()
RETURNS TRIGGER AS $$
DECLARE
    v_is_creator BOOLEAN;
BEGIN
    -- Check if the member being updated is the creator
    SELECT EXISTS (
        SELECT 1 
        FROM communities c 
        WHERE c.id = NEW.community_id 
        AND c.creator_id = NEW.user_id
    ) INTO v_is_creator;
    
    -- If this is the creator and role is being changed, prevent it
    IF v_is_creator AND OLD.role != NEW.role THEN
        RAISE EXCEPTION 'Cannot change the creator''s role. The creator must always be an admin.';
    END IF;
    
    -- If this is the creator and role is not admin, prevent it
    IF v_is_creator AND NEW.role != 'admin' THEN
        RAISE EXCEPTION 'The creator must always have admin role.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================== STEP 4: Create trigger to enforce creator role protection ====================
DROP TRIGGER IF EXISTS trigger_prevent_creator_role_change ON community_members;
CREATE TRIGGER trigger_prevent_creator_role_change
    BEFORE UPDATE OF role ON community_members
    FOR EACH ROW
    EXECUTE FUNCTION prevent_creator_role_change();

-- ==================== STEP 5: Create function to prevent creator removal ====================
CREATE OR REPLACE FUNCTION prevent_creator_removal()
RETURNS TRIGGER AS $$
DECLARE
    v_is_creator BOOLEAN;
BEGIN
    -- Check if the member being deleted is the creator
    SELECT EXISTS (
        SELECT 1 
        FROM communities c 
        WHERE c.id = OLD.community_id 
        AND c.creator_id = OLD.user_id
    ) INTO v_is_creator;
    
    -- If this is the creator, prevent deletion
    IF v_is_creator THEN
        RAISE EXCEPTION 'Cannot remove the community creator. The creator cannot be removed from their own community.';
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ==================== STEP 6: Create trigger to prevent creator removal ====================
DROP TRIGGER IF EXISTS trigger_prevent_creator_removal ON community_members;
CREATE TRIGGER trigger_prevent_creator_removal
    BEFORE DELETE ON community_members
    FOR EACH ROW
    EXECUTE FUNCTION prevent_creator_removal();

-- ==================== STEP 7: Add comment for documentation ====================
COMMENT ON FUNCTION prevent_creator_role_change() IS 'Prevents changing the role of community creators. Creators must always be admins.';
COMMENT ON FUNCTION prevent_creator_removal() IS 'Prevents removing the community creator from their own community.';

-- ==================== STEP 8: Verify the migration ====================
-- Check for any communities without creator memberships (should be 0)
SELECT 
    COUNT(*) AS communities_without_creator_membership
FROM communities c
WHERE NOT EXISTS (
    SELECT 1 
    FROM community_members cm 
    WHERE cm.community_id = c.id 
    AND cm.user_id = c.creator_id
);

-- Check for any creators without admin role (should be 0)
SELECT 
    COUNT(*) AS creators_without_admin_role
FROM communities c
JOIN community_members cm ON cm.community_id = c.id AND cm.user_id = c.creator_id
WHERE cm.role != 'admin';

