-- Add role_selected field to users table

-- Add role_selected field to track if OAuth users have selected their role
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role_selected BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.users.role_selected IS 'Whether user has selected their role (important for OAuth users who skip signup role selection)';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_role_selected 
ON public.users(role_selected);

-- Update existing users with user_type already set to mark role as selected
UPDATE public.users 
SET role_selected = true 
WHERE user_type IS NOT NULL;

-- Update trigger function to set role_selected based on user_type
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, email, username, full_name, avatar_url,
    interests, onboarding_completed, role_selected, user_type
  )
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    '[]'::jsonb,   -- Empty interests array
    false,         -- Needs to complete onboarding
    false,         -- Needs to select role (OAuth users)
    'user'         -- Default to user role
  )
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

