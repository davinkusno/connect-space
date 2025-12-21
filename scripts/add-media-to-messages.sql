-- Migration: Add media support to messages table
-- Adds fields for image and video attachments to discussion forum threads and replies

-- Step 1: Add media columns to messages table
ALTER TABLE messages 
  ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'video', NULL)),
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS media_size INTEGER, -- Size in bytes
  ADD COLUMN IF NOT EXISTS media_mime_type TEXT; -- e.g., image/jpeg, video/mp4

-- Step 2: Add index for better performance when filtering by media
CREATE INDEX IF NOT EXISTS idx_messages_media_type ON messages(media_type) WHERE media_type IS NOT NULL;

-- Step 3: Add comments for documentation
COMMENT ON COLUMN messages.media_type IS 'Type of media attachment: image, video, or NULL for text-only';
COMMENT ON COLUMN messages.media_url IS 'URL of the uploaded media file in storage';
COMMENT ON COLUMN messages.media_size IS 'Size of the media file in bytes';
COMMENT ON COLUMN messages.media_mime_type IS 'MIME type of the media file (e.g., image/jpeg, video/mp4)';

-- Step 4: Verify the changes
\d messages

-- Expected columns:
-- - id (UUID)
-- - content (TEXT)
-- - sender_id (UUID)
-- - community_id (UUID)
-- - created_at (TIMESTAMP)
-- - updated_at (TIMESTAMP)
-- - is_edited (BOOLEAN)
-- - parent_id (UUID)
-- - media_type (TEXT) ← NEW
-- - media_url (TEXT) ← NEW
-- - media_size (INTEGER) ← NEW
-- - media_mime_type (TEXT) ← NEW

