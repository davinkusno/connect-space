-- Add onboarding fields to users table

-- Add interests field (JSONB array)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS interests JSONB DEFAULT '[]'::jsonb;

-- Add onboarding_completed field
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.users.interests IS 'User selected interests as JSON array (e.g. ["Technology", "Sports"])';
COMMENT ON COLUMN public.users.onboarding_completed IS 'Whether user has completed onboarding flow';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed 
ON public.users(onboarding_completed);

-- Create index for interests queries (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS idx_users_interests 
ON public.users USING GIN (interests);

-- Update existing users to mark onboarding as completed (optional - they can redo it)
-- Uncomment if you want existing users to skip onboarding
-- UPDATE public.users SET onboarding_completed = true WHERE created_at < NOW();

-- Note: The 'location' field should already exist from community-admin-registration
-- If not, uncomment below:
-- ALTER TABLE public.users ADD COLUMN IF NOT EXISTS location TEXT;
-- CREATE INDEX IF NOT EXISTS idx_users_location ON public.users(location);

