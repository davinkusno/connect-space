-- Migration: Remove status column from event_attendees table
-- Reason: Status is always 'going' since we delete rows when users cancel interest
-- This simplifies the schema and queries

-- Step 1: Verify current data (all should be 'going')
-- Uncomment to check before migration:
-- SELECT status, COUNT(*) FROM event_attendees GROUP BY status;

-- Step 2: Remove the status column
ALTER TABLE event_attendees 
  DROP COLUMN IF EXISTS status;

-- Step 3: Verify the change
-- \d event_attendees

-- Expected result: event_attendees table should now have:
-- - id (UUID, PRIMARY KEY)
-- - event_id (UUID, REFERENCES events)
-- - user_id (UUID, REFERENCES users)
-- - registered_at (TIMESTAMP)
-- - UNIQUE(event_id, user_id)

COMMENT ON TABLE event_attendees IS 'Tracks user interest in events. Presence of row means user is interested/going. Absence means not interested.';

