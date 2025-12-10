-- =====================================================
-- User Seeder for ConnectSpace
-- =====================================================
-- This script seeds the users table with test data
-- Note: Make sure the corresponding auth.users records exist first
-- =====================================================

-- First, let's insert some users into auth.users (if using Supabase local dev)
-- For production, users should sign up normally through the app

-- =====================================================
-- Insert test users into public.users table
-- =====================================================

-- Note: Replace these UUIDs with actual auth.users IDs from your Supabase dashboard
-- or use the UUIDs of users who have already signed up

-- User 1: Regular User (Tech Enthusiast)
INSERT INTO public.users (
  id,
  username,
  full_name,
  email,
  avatar_url,
  bio,
  location,
  website,
  linkedin,
  date_of_birth,
  user_type,
  points,
  interests,
  onboarding_completed,
  role_selected,
  created_at,
  updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid, -- Replace with real auth.users ID
  'techguru_john',
  'John Anderson',
  'john.anderson@example.com',
  'https://i.pravatar.cc/150?img=1',
  'Passionate about AI, ML, and building innovative solutions. Always learning, always coding.',
  'DKI Jakarta, Jakarta Selatan',
  'https://johntechblog.com',
  'https://linkedin.com/in/johnanderson',
  '1995-03-15',
  'user',
  2500,
  '["Education", "Hobbies"]'::jsonb,
  true,
  true,
  NOW() - INTERVAL '60 days',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  points = EXCLUDED.points,
  interests = EXCLUDED.interests,
  updated_at = NOW();

-- User 2: Regular User (Outdoor Adventurer)
INSERT INTO public.users (
  id,
  username,
  full_name,
  email,
  avatar_url,
  bio,
  location,
  website,
  date_of_birth,
  user_type,
  points,
  interests,
  onboarding_completed,
  role_selected,
  created_at,
  updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000002'::uuid,
  'sarah_outdoors',
  'Sarah Chen',
  'sarah.chen@example.com',
  'https://i.pravatar.cc/150?img=5',
  'Nature lover, hiking enthusiast, and adventure seeker. Life is better outdoors!',
  'Jawa Barat, Bandung',
  'https://sarahtrails.com',
  '1992-07-22',
  'user',
  1800,
  '["Environmental", "Sports"]'::jsonb,
  true,
  true,
  NOW() - INTERVAL '45 days',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  points = EXCLUDED.points,
  interests = EXCLUDED.interests,
  updated_at = NOW();

-- User 3: Regular User (Creative Writer)
INSERT INTO public.users (
  id,
  username,
  full_name,
  email,
  avatar_url,
  bio,
  location,
  linkedin,
  date_of_birth,
  user_type,
  points,
  interests,
  onboarding_completed,
  role_selected,
  created_at,
  updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000003'::uuid,
  'emma_writes',
  'Emma Davis',
  'emma.davis@example.com',
  'https://i.pravatar.cc/150?img=9',
  'Writer, poet, and storyteller. Words are my canvas.',
  'Jawa Tengah, Semarang',
  'https://linkedin.com/in/emmadavis',
  '1998-11-08',
  'user',
  3200,
  '["Art", "Music"]'::jsonb,
  true,
  true,
  NOW() - INTERVAL '90 days',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  points = EXCLUDED.points,
  interests = EXCLUDED.interests,
  updated_at = NOW();

-- User 4: Regular User (Tech Community Creator)
-- Note: Community creators are regular users who have created communities
INSERT INTO public.users (
  id,
  username,
  full_name,
  email,
  avatar_url,
  bio,
  location,
  website,
  linkedin,
  date_of_birth,
  user_type,
  points,
  interests,
  onboarding_completed,
  role_selected,
  created_at,
  updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000004'::uuid,
  'mike_techleader',
  'Mike Johnson',
  'mike.johnson@example.com',
  'https://i.pravatar.cc/150?img=12',
  'Tech community builder and startup mentor. Let''s build the future together!',
  'DKI Jakarta, Jakarta Pusat',
  'https://mikejtech.com',
  'https://linkedin.com/in/mikejohnson',
  '1988-05-20',
  'user',
  5000,
  '["Education", "Hobbies"]'::jsonb,
  true,
  true,
  NOW() - INTERVAL '120 days',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  user_type = EXCLUDED.user_type,
  points = EXCLUDED.points,
  interests = EXCLUDED.interests,
  updated_at = NOW();

-- User 5: Regular User (Arts & Culture Community Creator)
INSERT INTO public.users (
  id,
  username,
  full_name,
  email,
  avatar_url,
  bio,
  location,
  website,
  date_of_birth,
  user_type,
  points,
  interests,
  onboarding_completed,
  role_selected,
  created_at,
  updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000005'::uuid,
  'lisa_artlover',
  'Lisa Martinez',
  'lisa.martinez@example.com',
  'https://i.pravatar.cc/150?img=20',
  'Art curator and community organizer. Bringing people together through creativity.',
  'Bali, Denpasar',
  'https://lisamartinezart.com',
  '1990-09-12',
  'user',
  4200,
  '["Art", "Music"]'::jsonb,
  true,
  true,
  NOW() - INTERVAL '100 days',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  user_type = EXCLUDED.user_type,
  points = EXCLUDED.points,
  interests = EXCLUDED.interests,
  updated_at = NOW();

-- User 6: Super Admin
INSERT INTO public.users (
  id,
  username,
  full_name,
  email,
  avatar_url,
  bio,
  location,
  user_type,
  points,
  interests,
  onboarding_completed,
  role_selected,
  created_at,
  updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000099'::uuid,
  'admin_connect',
  'ConnectSpace Admin',
  'admin@connectspace.com',
  'https://i.pravatar.cc/150?img=33',
  'Platform administrator and community guardian.',
  'DKI Jakarta, Jakarta Selatan',
  'super_admin',
  10000,
  '["Education"]'::jsonb,
  true,
  true,
  NOW() - INTERVAL '365 days',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  user_type = EXCLUDED.user_type,
  points = EXCLUDED.points,
  updated_at = NOW();

-- User 7: New User (Just signed up, not onboarded yet)
INSERT INTO public.users (
  id,
  username,
  full_name,
  email,
  avatar_url,
  user_type,
  points,
  interests,
  onboarding_completed,
  role_selected,
  created_at,
  updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000007'::uuid,
  'newbie_alex',
  'Alex Brown',
  'alex.brown@example.com',
  'https://i.pravatar.cc/150?img=15',
  'user',
  0,
  '[]'::jsonb,
  false,
  false,
  NOW() - INTERVAL '1 day',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  updated_at = NOW();

-- User 8: Regular User (Business & Networking)
INSERT INTO public.users (
  id,
  username,
  full_name,
  email,
  avatar_url,
  bio,
  location,
  linkedin,
  date_of_birth,
  user_type,
  points,
  interests,
  onboarding_completed,
  role_selected,
  created_at,
  updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000008'::uuid,
  'david_network',
  'David Park',
  'david.park@example.com',
  'https://i.pravatar.cc/150?img=25',
  'Entrepreneur and startup advisor. Always looking to connect with innovative minds.',
  'DKI Jakarta, Jakarta Barat',
  'https://linkedin.com/in/davidpark',
  '1985-02-28',
  'user',
  2800,
  '["Education", "Hobbies", "Sports"]'::jsonb,
  true,
  true,
  NOW() - INTERVAL '75 days',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  points = EXCLUDED.points,
  interests = EXCLUDED.interests,
  updated_at = NOW();

-- =====================================================
-- Summary Report
-- =====================================================

DO $$
DECLARE
  total_users INTEGER;
  regular_users INTEGER;
  super_admins INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM public.users;
  SELECT COUNT(*) INTO regular_users FROM public.users WHERE user_type = 'user';
  SELECT COUNT(*) INTO super_admins FROM public.users WHERE user_type = 'super_admin';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'User Seeding Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total Users: %', total_users;
  RAISE NOTICE 'Regular Users: %', regular_users;
  RAISE NOTICE 'Super Admins: %', super_admins;
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- View seeded users
-- =====================================================

SELECT 
  username,
  full_name,
  user_type,
  points,
  onboarding_completed,
  location,
  interests
FROM public.users
ORDER BY created_at DESC
LIMIT 20;

