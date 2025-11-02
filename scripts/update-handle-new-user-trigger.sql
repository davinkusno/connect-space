-- Update handle_new_user trigger to include onboarding fields
-- This ensures new OAuth users have the correct default values

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    username, 
    full_name, 
    avatar_url,
    interests,
    onboarding_completed,
    role_selected,
    user_type
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    '[]'::jsonb,  -- Default empty interests array
    false,        -- Onboarding not completed
    false,        -- Role not selected (important for OAuth users)
    'user'        -- Default user type
  );
  
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing OAuth users who don't have role_selected set
-- This fixes users who signed up before we added this field
UPDATE public.users
SET 
  role_selected = COALESCE(role_selected, false),
  onboarding_completed = COALESCE(onboarding_completed, false),
  interests = COALESCE(interests, '[]'::jsonb),
  user_type = COALESCE(user_type, 'user')
WHERE 
  role_selected IS NULL 
  OR onboarding_completed IS NULL 
  OR interests IS NULL 
  OR user_type IS NULL;

-- Verify the changes
SELECT 
  id, 
  email, 
  role_selected, 
  onboarding_completed, 
  user_type,
  interests
FROM public.users
LIMIT 10;

