# 🌱 User Seeding Guide for ConnectSpace

This guide explains how to seed test users into your database for API testing.

## 📋 Prerequisites

Before running the seeder, you need actual user accounts in `auth.users` table (Supabase Auth).

## 🔧 Option 1: Update Existing Users

If you already have users signed up (via Google OAuth or email), use their UUIDs:

### Step 1: Get User IDs from Supabase

1. Go to Supabase Dashboard → Authentication → Users
2. Copy the UUID of users you want to update
3. Or run this query in SQL Editor:

```sql
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 10;
```

### Step 2: Update the Seeder Script

Open `scripts/seed-users.sql` and replace the UUIDs:

```sql
-- Replace this:
'a0000000-0000-0000-0000-000000000001'::uuid

-- With your actual user ID:
'your-actual-uuid-from-auth-users'::uuid
```

### Step 3: Run the Seeder

In Supabase SQL Editor, run:

```bash
\i scripts/seed-users.sql
```

Or copy-paste the entire SQL file into the SQL Editor.

---

## 🔧 Option 2: Sign Up Test Users First

The **recommended approach** for testing:

### Step 1: Sign Up Test Users via App

1. Go to `http://localhost:3000/auth/signup`
2. Sign up with test emails:
   - `john.anderson@example.com`
   - `sarah.chen@example.com`
   - `emma.davis@example.com`
   - etc.

### Step 2: Get Their User IDs

```sql
SELECT id, email, raw_user_meta_data
FROM auth.users
WHERE email IN (
  'john.anderson@example.com',
  'sarah.chen@example.com',
  'emma.davis@example.com'
);
```

### Step 3: Update Seeder with Real IDs

Replace the placeholder UUIDs in `seed-users.sql` with the real ones.

### Step 4: Run the Seeder

Execute the SQL script to update user profiles with test data.

---

## 🔧 Option 3: Manual Quick Seed (Your Current User)

If you just want to test with your own account:

### Get Your User ID

```sql
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
```

### Update Your Profile with Test Data

```sql
UPDATE public.users
SET
  username = 'test_user',
  full_name = 'Test User',
  bio = 'This is a test account',
  location = 'DKI Jakarta, Jakarta Selatan',
  points = 5000,
  interests = '["Technology", "AI", "Startups"]'::jsonb,
  onboarding_completed = true,
  role_selected = true,
  user_type = 'user'
WHERE id = 'your-user-id-here';
```

### Create a Super Admin (for testing badges, etc.)

```sql
UPDATE public.users
SET user_type = 'super_admin'
WHERE email = 'your-email@example.com';
```

---

## 🎯 Quick Test Data Setup

For rapid testing, run this **after** you've signed up 1-2 users:

```sql
-- Get your user ID
SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Update with rich test data
UPDATE public.users
SET
  username = 'techguru_john',
  full_name = 'John Anderson',
  bio = 'Passionate about AI and ML',
  location = 'DKI Jakarta, Jakarta Selatan',
  website = 'https://example.com',
  linkedin = 'https://linkedin.com/in/johnanderson',
  points = 5000,
  interests = '["Technology", "AI", "Startups", "Coding"]'::jsonb,
  onboarding_completed = true,
  role_selected = true
WHERE id = 'your-user-id';

-- Verify
SELECT username, full_name, user_type, points, interests
FROM public.users
WHERE id = 'your-user-id';
```

---

## 📊 Seeded User Profiles

The seeder includes these test users:

| Username          | Full Name          | Role            | Points | Interests            |
| ----------------- | ------------------ | --------------- | ------ | -------------------- |
| `techguru_john`   | John Anderson      | user            | 2500   | Tech, AI, Startups   |
| `sarah_outdoors`  | Sarah Chen         | user            | 1800   | Outdoor, Hiking      |
| `emma_writes`     | Emma Davis         | user            | 3200   | Writing, Poetry      |
| `mike_techleader` | Mike Johnson       | user            | 5000   | Tech, Leadership (Community Creator) |
| `lisa_artlover`   | Lisa Martinez      | user            | 4200   | Arts, Culture (Community Creator) |
| `admin_connect`   | ConnectSpace Admin | super_admin     | 10000  | Platform Mgmt        |
| `newbie_alex`     | Alex Brown         | user            | 0      | Not onboarded        |
| `david_network`   | David Park         | user            | 2800   | Business, Networking |

---

## 🧪 Testing Scenarios

### Test Regular User Flow

Use `john.anderson@example.com` (user role, 2500 points)

### Test Community Creator Flow

Use `mike.johnson@example.com` (user who has created communities)

### Test Super Admin Flow

Use `admin@connectspace.com` (super_admin role)

### Test Onboarding Flow

Use `alex.brown@example.com` (not onboarded yet)

### Test Badges/Store

Use any user with points > 0 to test badge purchases

---

## ⚠️ Important Notes

1. **Auth Users First**: Always create users in `auth.users` first (via signup)
2. **UUID Matching**: Make sure UUIDs in seeder match `auth.users` IDs
3. **Constraints**: Check for unique constraints on `username` and `email`
4. **RLS Policies**: Ensure RLS policies allow the operations
5. **Production**: **NEVER** run seeders on production!

---

## 🔍 Verify Seeding

After running the seeder:

```sql
-- Check all users
SELECT username, full_name, user_type, points, onboarding_completed
FROM public.users
ORDER BY created_at DESC;

-- Check by role
SELECT user_type, COUNT(*) as count
FROM public.users
GROUP BY user_type;

-- Check points distribution
SELECT username, points
FROM public.users
ORDER BY points DESC;
```

---

## 🧹 Clean Up Test Data

To remove seeded test data:

```sql
-- Delete specific test users
DELETE FROM public.users
WHERE username IN (
  'techguru_john',
  'sarah_outdoors',
  'emma_writes',
  'mike_techleader',
  'lisa_artlover',
  'admin_connect',
  'newbie_alex',
  'david_network'
);

-- Or delete all users (careful!)
-- TRUNCATE public.users CASCADE;
```

---

## 🚀 Next Steps

After seeding users, you can:

1. ✅ Test badge purchases (`/store`)
2. ✅ Test community features (`/communities`)
3. ✅ Test dashboard with real data (`/dashboard`)
4. ✅ Test user profiles (`/profile`)
5. ✅ Test superadmin features (`/superadmin`)

---

## 📞 Need Help?

If you encounter issues:

1. Check Supabase logs for errors
2. Verify RLS policies are correct
3. Ensure auth.users records exist
4. Check for constraint violations
5. Review the schema matches the seeder

Happy testing! 🎉
