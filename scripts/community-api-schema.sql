-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create communities table
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_private BOOLEAN DEFAULT FALSE,
  location TEXT,
  category TEXT
);

-- Create community_members table
CREATE TABLE IF NOT EXISTS community_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- Create events table
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

-- Create event_attendees table
CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('going', 'maybe', 'not_going')),
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Create messages table
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

-- Create notifications table
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

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_communities_creator_id ON communities(creator_id);
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

-- Set up Row Level Security (RLS)
-- Users table RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_policy ON users
  FOR SELECT USING (true);  -- Anyone can view user profiles

CREATE POLICY users_insert_policy ON users
  FOR INSERT WITH CHECK (auth.uid() = id);  -- Users can only insert their own profile

CREATE POLICY users_update_policy ON users
  FOR UPDATE USING (auth.uid() = id);  -- Users can only update their own profile

-- Communities table RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY communities_select_public_policy ON communities
  FOR SELECT USING (
    NOT is_private OR  -- Public communities are visible to everyone
    EXISTS (
      SELECT 1 FROM community_members 
      WHERE community_id = id AND user_id = auth.uid()
    )  -- Or user is a member of the private community
  );

CREATE POLICY communities_insert_policy ON communities
  FOR INSERT WITH CHECK (auth.uid() = creator_id);  -- Only authenticated users can create communities

CREATE POLICY communities_update_policy ON communities
  FOR UPDATE USING (
    auth.uid() = creator_id OR  -- Creator can update
    EXISTS (
      SELECT 1 FROM community_members 
      WHERE community_id = id AND user_id = auth.uid() AND role = 'admin'
    )  -- Or user is an admin
  );

CREATE POLICY communities_delete_policy ON communities
  FOR DELETE USING (auth.uid() = creator_id);  -- Only creator can delete community

-- Community members table RLS
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY community_members_select_policy ON community_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM communities 
      WHERE id = community_id AND (
        NOT is_private OR  -- Public community members are visible to everyone
        EXISTS (
          SELECT 1 FROM community_members AS cm
          WHERE cm.community_id = community_id AND cm.user_id = auth.uid()
        )  -- Or user is a member of the private community
      )
    )
  );

CREATE POLICY community_members_insert_policy ON community_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR  -- Users can add themselves (join)
    EXISTS (
      SELECT 1 FROM community_members 
      WHERE community_id = community_id AND user_id = auth.uid() AND role IN ('admin', 'moderator')
    )  -- Or user is an admin/moderator
  );

CREATE POLICY community_members_update_policy ON community_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM community_members 
      WHERE community_id = community_id AND user_id = auth.uid() AND role = 'admin'
    )  -- Only admins can update roles
  );

CREATE POLICY community_members_delete_policy ON community_members
  FOR DELETE USING (
    user_id = auth.uid() OR  -- Users can remove themselves (leave)
    EXISTS (
      SELECT 1 FROM community_members 
      WHERE community_id = community_id AND user_id = auth.uid() AND role IN ('admin', 'moderator')
    )  -- Or user is an admin/moderator
  );

-- Similar RLS policies for other tables...

-- Create or replace function to automatically update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communities_updated_at
BEFORE UPDATE ON communities
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, username)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'username');
  
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
