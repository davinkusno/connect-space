# 🎯 Categories and Interests

## Overview

ConnectSpace uses **6 main categories** for user interests and community classifications. This simplified structure makes it easier for users to find relevant communities and connect with like-minded people.

---

## 📋 The 6 Categories

### 1. 🌱 **Environmental**

Activities and interests related to environment, nature, and sustainability.

**Examples:**

- Gardening & Urban Farming
- Sustainability & Green Living
- Wildlife & Conservation
- Climate Action
- Recycling & Waste Reduction
- Outdoor Activities
- Nature Photography

---

### 2. 🎵 **Music**

All things related to music creation, appreciation, and performance.

**Examples:**

- Music Production
- Live Performances
- Music Theory
- Instrument Learning
- DJing & Mixing
- Music Appreciation
- Band & Orchestra
- Songwriting

---

### 3. ⚽ **Sports**

Physical activities, fitness, and athletic pursuits.

**Examples:**

- Team Sports (Football, Basketball, etc.)
- Individual Sports (Tennis, Swimming, etc.)
- Fitness & Gym
- Yoga & Meditation
- Running & Cycling
- Martial Arts
- Outdoor Adventures
- Extreme Sports

---

### 4. 🎨 **Hobbies**

Creative and leisure activities pursued for enjoyment.

**Examples:**

- Crafts & DIY
- Cooking & Baking
- Gaming (Video & Board Games)
- Photography
- Creative Coding
- Model Building
- Collecting
- Woodworking
- Knitting & Sewing

---

### 5. 📚 **Education**

Learning, teaching, and knowledge-sharing activities.

**Examples:**

- Academic Studies
- Online Courses
- Language Learning
- Professional Development
- Tutoring & Mentoring
- Workshops & Seminars
- Research & Science
- Book Clubs
- Skill Development

---

### 6. 🎭 **Art**

Creative expression through various artistic mediums.

**Examples:**

- Visual Arts (Painting, Drawing)
- Performing Arts (Theater, Dance)
- Film & Video Production
- Writing & Literature
- Design (Graphic, UI/UX, Fashion)
- Sculpture & 3D Art
- Digital Art
- Poetry & Creative Writing
- Street Art

---

## 🔄 Migration from Old Categories

If you have existing data with old categories, here's a recommended mapping:

| Old Category                 | New Category  |
| ---------------------------- | ------------- |
| Technology                   | Hobbies       |
| Business & Entrepreneurship  | Education     |
| Health & Wellness            | Sports        |
| Arts & Culture               | Art           |
| Sports & Fitness             | Sports        |
| Food & Cooking               | Hobbies       |
| Travel & Adventure           | Sports        |
| Environment & Sustainability | Environmental |
| Social Impact                | Education     |
| Gaming                       | Hobbies       |
| Photography                  | Hobbies       |
| Writing & Literature         | Art           |
| Science & Research           | Education     |
| Finance & Investment         | Education     |
| Design & Creative            | Art           |
| Language Learning            | Education     |
| Parenting & Family           | Hobbies       |
| Professional Development     | Education     |

---

## 💾 Database Schema

### Users Table

```sql
ALTER TABLE public.users
ADD COLUMN interests JSONB DEFAULT '[]'::jsonb;

-- Create GIN index for efficient JSONB queries
CREATE INDEX idx_users_interests ON public.users USING GIN (interests);
```

### Communities Table

```sql
ALTER TABLE public.communities
ADD COLUMN category TEXT;

-- Add check constraint for valid categories
ALTER TABLE public.communities
ADD CONSTRAINT communities_category_check
CHECK (category IN ('Environmental', 'Music', 'Sports', 'Hobbies', 'Education', 'Art'));
```

---

## 🎨 UI Implementation

### Interest Selection (Onboarding)

```typescript
const INTEREST_CATEGORIES = [
  "Environmental",
  "Music",
  "Sports",
  "Hobbies",
  "Education",
  "Art",
];
```

Users can select **3 or more** interests during onboarding.

### Community Categories

Communities are classified under **one primary category** but can have multiple tags for specific topics.

**Example:**

```typescript
{
  name: "Urban Gardeners",
  category: "Environmental",  // Primary category
  tags: ["Gardening", "Composting", "Organic"]  // Specific topics
}
```

---

## 🔍 Search & Filtering

### By Interest

Users can filter communities and events based on their selected interests.

### By Category

Browse all communities in a specific category (e.g., show all "Music" communities).

### Smart Recommendations

AI-powered recommendations use interests to suggest:

- Relevant communities
- Upcoming events
- Connection opportunities

---

## 📊 Analytics & Insights

### Popular Categories

Track which categories are most popular:

```sql
SELECT
  category,
  COUNT(*) as community_count
FROM public.communities
GROUP BY category
ORDER BY community_count DESC;
```

### User Interest Distribution

```sql
SELECT
  jsonb_array_elements_text(interests) as interest,
  COUNT(*) as user_count
FROM public.users
GROUP BY interest
ORDER BY user_count DESC;
```

---

## ✅ Best Practices

### For Users

1. **Select honestly**: Choose interests you're genuinely passionate about
2. **Be specific with tags**: Use tags to narrow down within categories
3. **Update regularly**: Your interests may evolve over time

### For Community Admins

1. **Choose the most relevant category**: Pick the primary focus of your community
2. **Use descriptive tags**: Help members find your community
3. **Cross-category appeal**: Use tags to attract users from related interests

### For Developers

1. **Validate categories**: Always validate against the allowed list
2. **Handle legacy data**: Provide migration path for old categories
3. **Consistent naming**: Use exact category names (case-sensitive)

---

## 🚀 Future Enhancements

### Potential Additions

- Sub-categories within main categories
- Interest strength/priority (1-5 scale)
- Interest tags (more granular than categories)
- Trending interests

### AI Integration

- Automatic category suggestion based on description
- Interest discovery recommendations
- Community-interest matching scores

---

## 📝 Examples

### User Profile

```json
{
  "interests": ["Environmental", "Music", "Art"],
  "onboarding_completed": true
}
```

### Community

```json
{
  "name": "Urban Gardeners",
  "category": "Environmental",
  "tags": ["Gardening", "Composting", "Organic", "DIY"],
  "description": "Share tips, celebrate harvests, and grow together..."
}
```

### Event

```json
{
  "title": "Community Garden Workshop",
  "category": "Environmental",
  "tags": ["Hands-on", "Beginner-Friendly"],
  "community_category": "Environmental"
}
```

---

## 🔗 Related Files

- `/app/onboarding/page.tsx` - User interest selection during onboarding
- `/app/community-admin-registration/page.tsx` - Community interest selection during community creation
- `/scripts/seed-users.sql` - Sample user data
- `/app/page.tsx` - Homepage category display
- `/app/communities/page.tsx` - Browse communities by category
- `/app/dashboard/page.tsx` - User recommendations

---

**Last Updated:** November 2024  
**Version:** 1.0
