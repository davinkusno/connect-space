# User Onboarding Flow Documentation

Complete documentation for the ConnectSpace user onboarding feature.

---

## 📋 Overview

The User Onboarding Flow is a simple 2-step process that helps personalize the user experience by collecting:

1. **User Interests** (minimum 3 required)
2. **User Location** (optional - Provinsi & Kota)

This data is used for:

- Personalized community recommendations
- Better AI suggestions
- Local event and community discovery
- Improved dashboard content

---

## 🎯 Flow Diagram

```
User Signs Up (Role: Member)
         ↓
   Email Verified
         ↓
  Onboarding Page (/onboarding)
         ↓
   Step 1: Select Interests (min 3)
         ↓
   Step 2: Select Location (optional)
         ↓
  Save to Database
         ↓
    Dashboard
```

---

## 📁 File Structure

```
app/
├── onboarding/
│   └── page.tsx                    # Main onboarding UI (2 steps)
├── api/
│   └── user/
│       └── onboarding/
│           └── route.ts            # POST: Save onboarding data
│                                   # GET: Check onboarding status
└── auth/
    └── signup/
        └── page.tsx                # Updated to redirect to /onboarding

components/
└── auth/
    └── onboarding-guard.tsx        # HOC to check onboarding completion

scripts/
└── add-onboarding-fields.sql      # Database migration
```

---

## 🗄️ Database Schema

### Table: `public.users`

**New Fields Added:**

| Column                 | Type      | Default | Description                                                |
| ---------------------- | --------- | ------- | ---------------------------------------------------------- |
| `interests`            | `JSONB`   | `[]`    | Array of user interests (e.g., `["Technology", "Sports"]`) |
| `onboarding_completed` | `BOOLEAN` | `false` | Whether user completed onboarding                          |
| `location`             | `TEXT`    | `NULL`  | User's city/regency (e.g., "Jakarta Selatan")              |

**Indexes:**

- `idx_users_onboarding_completed` - For filtering users by onboarding status
- `idx_users_interests` - GIN index for JSONB interest queries

---

## 🚀 Implementation Details

### 1. Onboarding Page (`/app/onboarding/page.tsx`)

**Features:**

- ✅ 2-step wizard UI with progress indicator
- ✅ Step 1: Interest selection (grid of badges)
  - Minimum 3 interests required
  - Visual feedback for selected items
  - Counter showing selected/minimum
- ✅ Step 2: Location selection
  - Province dropdown (from API Wilayah Indonesia)
  - City dropdown (filtered by province)
  - "Skip" button for optional location
- ✅ Beautiful animations with SmoothReveal
- ✅ Form validation
- ✅ Loading states

**Interest Categories (20 total):**

```typescript
[
  "Technology",
  "Business & Entrepreneurship",
  "Health & Wellness",
  "Education",
  "Arts & Culture",
  "Sports & Fitness",
  "Food & Cooking",
  "Travel & Adventure",
  "Environment & Sustainability",
  "Social Impact",
  "Gaming",
  "Photography",
  "Music",
  "Writing & Literature",
  "Science & Research",
  "Finance & Investment",
  "Design & Creative",
  "Language Learning",
  "Parenting & Family",
  "Professional Development",
];
```

---

### 2. Onboarding API (`/app/api/user/onboarding/route.ts`)

#### **POST** `/api/user/onboarding`

Save user's onboarding data.

**Authentication:** Required (Bearer token)

**Request Body:**

```json
{
  "userId": "user-uuid",
  "interests": ["Technology", "Sports", "Music"],
  "location": "Jakarta Selatan",
  "onboardingCompleted": true
}
```

**Validation:**

- Minimum 3 interests required
- userId must match authenticated user
- Location is optional (can be null)

**Response (Success):**

```json
{
  "success": true,
  "message": "Onboarding completed successfully"
}
```

**Response (Error - Insufficient Interests):**

```json
{
  "error": "At least 3 interests are required"
}
```

---

#### **GET** `/api/user/onboarding`

Check user's onboarding status.

**Authentication:** Required (Bearer token)

**Response:**

```json
{
  "onboardingCompleted": true,
  "interests": ["Technology", "Sports", "Music"],
  "location": "Jakarta Selatan"
}
```

**Use Case:** Check if user needs to complete onboarding before accessing protected routes.

---

### 3. Onboarding Guard (`/components/auth/onboarding-guard.tsx`)

**Purpose:** HOC that wraps the entire app to ensure users complete onboarding before accessing protected routes.

**How it works:**

1. On every route change, checks if route is public
2. If protected route, fetches user's onboarding status from API
3. If not completed, redirects to `/onboarding`
4. Shows loading spinner during check
5. Fails gracefully on errors

**Public Routes (No Onboarding Required):**

```typescript
[
  "/onboarding",
  "/auth/login",
  "/auth/signup",
  "/auth/callback",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/community-admin-registration",
];
```

**Usage:**

```tsx
// app/layout.tsx
<OnboardingGuard>
  <NavbarWrapper />
  <main>{children}</main>
</OnboardingGuard>
```

---

### 4. Signup Flow Update

**Before:**

```typescript
// User signs up → Redirect to /dashboard
router.push("/dashboard");
```

**After:**

```typescript
// User signs up → Redirect to /onboarding
router.push("/onboarding");
```

**Note:** Community admins still redirect to `/community-admin-registration` (their own onboarding).

---

## 📊 User Experience Flow

### First Time User Journey

1. **Sign Up**

   - User creates account
   - Chooses "Member" role
   - Submits registration form

2. **Email Verification** (if required)

   - User verifies email
   - Clicks verification link

3. **Onboarding - Step 1**

   - Welcome message with sparkle icon
   - Grid of 20 interest categories
   - Click to select/deselect (min 3)
   - Purple badges for selected items
   - Counter shows progress

4. **Onboarding - Step 2**

   - Select Province from dropdown
   - Select City/Regency from filtered list
   - Option to "Skip" location
   - Info box explains benefits

5. **Completion**

   - Data saved to database
   - Success toast notification
   - Redirect to Dashboard

6. **Dashboard Access**
   - Personalized experience
   - Community recommendations based on interests
   - Local communities based on location

---

## 🎨 UI/UX Features

### Visual Design

- ✅ Gradient background (purple-blue)
- ✅ Floating elements animation
- ✅ Glass-effect cards
- ✅ Smooth reveal animations
- ✅ Progress indicator with checkmarks
- ✅ Icon-based step headers
- ✅ Hover effects on interest badges

### Interaction Design

- ✅ Clear minimum requirements (3 interests)
- ✅ Visual feedback on selection
- ✅ Disabled states for invalid actions
- ✅ Skip option for optional fields
- ✅ Back navigation between steps
- ✅ Loading states during submission

### Accessibility

- ✅ Keyboard navigation support
- ✅ Clear labels and descriptions
- ✅ Error messages
- ✅ Loading indicators
- ✅ Color contrast compliance

---

## 🔧 Setup Instructions

### 1. Run Database Migration

```sql
-- Run in Supabase SQL Editor
\i scripts/add-onboarding-fields.sql
```

Or manually execute:

```sql
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS interests JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON public.users(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_users_interests ON public.users USING GIN (interests);
```

### 2. Verify API Routes

Ensure these routes are accessible:

- `POST /api/user/onboarding`
- `GET /api/user/onboarding`

### 3. Test Flow

1. Create a new user account (role: Member)
2. Verify redirect to `/onboarding`
3. Complete both steps
4. Verify redirect to `/dashboard`
5. Try accessing dashboard directly → should not redirect back

### 4. Handle Existing Users (Optional)

**Option A:** Force all existing users to complete onboarding

```sql
-- Users will be prompted on next login
UPDATE public.users SET onboarding_completed = false;
```

**Option B:** Mark existing users as completed (skip onboarding)

```sql
-- Existing users skip onboarding
UPDATE public.users SET onboarding_completed = true WHERE created_at < NOW();
```

---

## 🧪 Testing Checklist

### Functional Tests

- [ ] New user signup redirects to onboarding
- [ ] Step 1: Can select/deselect interests
- [ ] Step 1: Cannot proceed with < 3 interests
- [ ] Step 1: Can proceed with ≥ 3 interests
- [ ] Step 2: Province dropdown populates
- [ ] Step 2: City dropdown filters by province
- [ ] Step 2: Can skip location
- [ ] Step 2: Can complete with location
- [ ] Data saves correctly to database
- [ ] Redirect to dashboard after completion
- [ ] Cannot access dashboard without completing onboarding
- [ ] Can access dashboard after completing onboarding

### Edge Cases

- [ ] Back button navigation works
- [ ] API errors show appropriate messages
- [ ] Loading states display correctly
- [ ] Already completed onboarding → no redirect
- [ ] Community admin signup → skip user onboarding
- [ ] Public routes accessible without onboarding

---

## 🔐 Security Considerations

1. **Authentication Required**

   - All onboarding API calls require valid Bearer token
   - User can only update their own data (userId validation)

2. **Data Validation**

   - Minimum 3 interests enforced server-side
   - Interests must be array type
   - Location is optional but validated if provided

3. **Rate Limiting** (TODO)

   - Consider adding rate limits to prevent abuse
   - Recommendation: 5 requests per minute per user

4. **XSS Prevention**
   - All user input sanitized
   - JSONB fields properly escaped

---

## 📈 Future Enhancements

### Phase 2 Features

- [ ] Profile picture upload during onboarding
- [ ] Bio/description field
- [ ] Social media links
- [ ] Notification preferences
- [ ] Privacy settings

### Phase 3 Features

- [ ] Interest recommendations based on popular choices
- [ ] Location autocomplete/geolocation
- [ ] Multi-language support
- [ ] Custom interest categories
- [ ] Onboarding analytics dashboard

### AI Integration

- [ ] AI-suggested interests based on user profile
- [ ] Auto-complete bio using AI
- [ ] Personalized welcome message

---

## 🐛 Troubleshooting

### Issue: Onboarding page shows loading forever

**Solution:**

- Check browser console for API errors
- Verify user is authenticated
- Check `/api/user/onboarding` endpoint is accessible

### Issue: Province/City dropdowns not loading

**Solution:**

- Check API Wilayah Indonesia is accessible: `https://www.emsifa.com/api-wilayah-indonesia/`
- Check browser network tab for CORS errors
- Verify internet connection

### Issue: Can't proceed to dashboard after completing

**Solution:**

- Check database - verify `onboarding_completed = true`
- Clear browser cache and cookies
- Check OnboardingGuard logic in console

### Issue: Existing users stuck in onboarding loop

**Solution:**

```sql
-- Mark specific user as completed
UPDATE public.users
SET onboarding_completed = true
WHERE email = 'user@example.com';
```

---

## 📊 Analytics & Metrics

### Recommended Tracking

**Onboarding Metrics:**

- Completion rate (started vs completed)
- Drop-off rate per step
- Average time to complete
- Most selected interests
- Location distribution
- Skip rate for location step

**User Engagement:**

- Dashboard return rate post-onboarding
- Community join rate
- Event attendance rate
- Correlation: interests → engagement

### Example Query:

```sql
-- Onboarding completion rate
SELECT
  COUNT(*) FILTER (WHERE onboarding_completed = true) * 100.0 / COUNT(*) as completion_rate,
  COUNT(*) FILTER (WHERE onboarding_completed = false) as incomplete_users,
  COUNT(*) FILTER (WHERE onboarding_completed = true) as completed_users
FROM public.users
WHERE role = 'user';
```

---

## 🎓 Best Practices

1. **Keep It Simple**

   - 2 steps is optimal (don't add more without data)
   - Make most fields optional
   - Clear progress indication

2. **Provide Value**

   - Explain why you're collecting data
   - Show immediate benefit (recommendations)
   - Allow skip for optional fields

3. **Minimize Friction**

   - Auto-save progress (TODO)
   - Allow editing after completion
   - Pre-populate when possible

4. **Optimize Performance**

   - Lazy load location data
   - Cache API responses
   - Minimize API calls

5. **Test Thoroughly**
   - Test on mobile devices
   - Test with slow connections
   - Test error scenarios

---

## 📝 Summary

The User Onboarding Flow is a **lightweight, 2-step process** that:

- ✅ Collects minimum required data (interests)
- ✅ Makes location optional
- ✅ Provides beautiful, smooth UX
- ✅ Integrates seamlessly with signup
- ✅ Enables personalized recommendations
- ✅ Protects routes until completion
- ✅ Fails gracefully on errors

**Total Implementation:**

- 3 new files
- 2 updated files
- 1 database migration
- ~500 lines of code

**User Benefit:**
Better personalized experience from day 1! 🎉

---

**Last Updated:** November 2, 2025
