-- Create tables for the community app

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
≈

-- Communities table
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  logo_url TEXT,
  banner_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_private BOOLEAN DEFAULT FALSE,
  location TEXT,
  category TEXT
);

-- Community members table
CREATE TABLE IF NOT EXISTS community_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'moderator', 'member')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  image_url TEXT,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_online BOOLEAN DEFAULT FALSE,
  max_attendees INTEGER,
  category TEXT
);

-- Event attendees table
CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('going', 'maybe', 'not_going')) DEFAULT 'going',
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  is_edited BOOLEAN DEFAULT FALSE,
  parent_id UUID REFERENCES messages(id) ON DELETE SET NULL
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('event_reminder', 'new_message', 'community_invite', 'community_update')),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reference_id UUID,
  reference_type TEXT CHECK (reference_type IN ('event', 'message', 'community'))
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  theme TEXT NOT NULL CHECK (theme IN ('light', 'dark', 'system')) DEFAULT 'system',
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies

-- Users table policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Communities table policies
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public communities"
  ON communities FOR SELECT
  USING (NOT is_private);

CREATE POLICY "Members can view private communities"
  ON communities FOR SELECT
  USING (
    is_private AND EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = communities.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Creators can update communities"
  ON communities FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "Users can create communities"
  ON communities FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can delete communities"
  ON communities FOR DELETE
  USING (creator_id = auth.uid());

-- Community members table policies
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view community members"
  ON community_members FOR SELECT
  USING (true);

CREATE POLICY "Users can join communities"
  ON community_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave communities"
  ON community_members FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage community members"
  ON community_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = community_members.community_id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- Events table policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view events in public communities"
  ON events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE id = events.community_id AND NOT is_private
    )
  );

CREATE POLICY "Members can view events in private communities"
  ON events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = events.community_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create events"
  ON events FOR INSERT
  WITH CHECK (
    creator_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = events.community_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Creators can update events"
  ON events FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "Creators can delete events"
  ON events FOR DELETE
  USING (creator_id = auth.uid());

-- Event attendees table policies
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event attendees"
  ON event_attendees FOR SELECT
  USING (true);

CREATE POLICY "Users can register for events"
  ON event_attendees FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their attendance"
  ON event_attendees FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can cancel attendance"
  ON event_attendees FOR DELETE
  USING (user_id = auth.uid());

-- Messages table policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community members can view messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = messages.community_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Community members can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = messages.community_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can edit own messages"
  ON messages FOR UPDATE
  USING (sender_id = auth.uid());

CREATE POLICY "Users can delete own messages"
  ON messages FOR DELETE
  USING (sender_id = auth.uid());

-- Notifications table policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can mark notifications as read"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());

-- User preferences table policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (user_id = auth.uid());

-- Create functions and triggers

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile after signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update user profile when auth user is updated
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET
    email = NEW.email,
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update user profile when auth user is updated
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_update();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_events_community_id ON events(community_id);
CREATE INDEX IF NOT EXISTS idx_events_creator_id ON events(creator_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON event_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_community_id ON messages(community_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_reference_id ON notifications(reference_id);
