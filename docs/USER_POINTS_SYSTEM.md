# User Points/Reputation System

## Overview

The User Points/Reputation System tracks user activity and engagement across the platform. This helps community admins make informed decisions when reviewing join requests by seeing:
- **Activity Points**: Positive engagement (posts, events, communities)
- **Report Points**: Negative indicators (reports received)
- **Reputation Score**: Overall score calculated as `activity_points - (report_points * 10)`

## Database Setup

Run the SQL migration script to create the necessary tables:

```bash
# In Supabase SQL Editor or via psql
psql -f scripts/create-user-points-system.sql
```

This creates:
- `user_points` table: Stores all point transactions
- `user_reputation_summary` view: Quick access to reputation data
- `get_user_reputation()` function: Calculates reputation for a user

## Point Values

| Activity | Points | Description |
|----------|--------|-------------|
| Post Created | +10 | User creates a post |
| Post Liked | +2 | User likes a post |
| Event Joined | +15 | User joins an event |
| Event Created | +20 | User creates an event |
| Community Joined | +25 | User joins a community |
| Community Created | +50 | User creates a community |
| Daily Active | +5 | User is active on a day |
| Report Received | -50 | User receives a report (negative) |
| Report Resolved | +10 | Report resolved in user's favor |

## Integration Guide

### 1. Award Points When User Actions Occur

Import the helper functions and call them when actions happen:

```typescript
import { PointsHelper } from "@/lib/points/user-points";

// When user creates a post
await PointsHelper.onPostCreated(userId, postId);

// When user joins an event
await PointsHelper.onEventJoined(userId, eventId);

// When user creates an event
await PointsHelper.onEventCreated(userId, eventId);

// When user joins a community
await PointsHelper.onCommunityJoined(userId, communityId);

// When user creates a community
await PointsHelper.onCommunityCreated(userId, communityId);

// When user receives a report
await PointsHelper.onReportReceived(userId, reportId);
```

### 2. Display Reputation in Admin Views

The reputation component is already integrated into:
- `/app/community-admin/[id]/requests/page.tsx` - Full reputation card
- `/app/community-admin/[id]/page.tsx` - Compact reputation badge

To add it elsewhere:

```tsx
import { UserReputationCard } from "@/components/community/user-reputation-card";

// Full card view
<UserReputationCard userId={userId} />

// Compact badge view
<UserReputationCard userId={userId} compact={true} />
```

### 3. Get User Reputation Programmatically

```typescript
import { getUserReputation } from "@/lib/points/user-points";

const reputation = await getUserReputation(userId);
console.log(reputation.reputation_score);
console.log(reputation.activity_points);
console.log(reputation.report_count);
```

## Reputation Score Calculation

```
Reputation Score = Activity Points - (Report Points × 10)
```

Reports are weighted 10x more heavily than positive activities to ensure they have significant impact.

## Reputation Badges

| Score Range | Badge | Color |
|------------|-------|-------|
| ≥ 500 | Excellent | Green |
| ≥ 200 | Good | Blue |
| ≥ 50 | Fair | Yellow |
| ≥ 0 | New | Gray |
| < 0 | Warning | Red |

## API Endpoints

### POST `/api/user/points`
Award points to a user.

**Request:**
```json
{
  "user_id": "uuid",
  "points": 10,
  "point_type": "post_created",
  "related_id": "post-uuid",
  "related_type": "post",
  "description": "Created a post"
}
```

### GET `/api/user/[userId]/reputation`
Get user reputation summary.

**Response:**
```json
{
  "reputation": {
    "activity_points": 150,
    "report_points": 0,
    "report_count": 0,
    "posts_created": 5,
    "events_joined": 3,
    "communities_joined": 2,
    "active_days": 10,
    "last_activity_at": "2024-01-15T10:30:00Z",
    "reputation_score": 150
  }
}
```

## Automatic Point Tracking

To automatically track points, you can:

1. **Add triggers in database** (recommended for reliability):
   - Create database triggers that automatically award points when rows are inserted into `posts`, `events`, `community_members`, etc.

2. **Add to API routes**:
   - Call `PointsHelper` functions in your API routes after successful operations

3. **Add to client-side actions**:
   - Call `PointsHelper` functions after successful user actions (less reliable, but works)

## Example: Adding Points to Post Creation

In your post creation API route:

```typescript
// app/api/posts/route.ts
import { PointsHelper } from "@/lib/points/user-points";

export async function POST(request: Request) {
  // ... create post logic ...
  
  const newPost = await createPost(...);
  
  // Award points
  await PointsHelper.onPostCreated(userId, newPost.id);
  
  return NextResponse.json({ post: newPost });
}
```

## Security

- Users can only award points to themselves (or admins can award to others)
- Points are tracked server-side via API routes
- RLS policies ensure users can only see their own points (admins can see all)

## Future Enhancements

- Daily active tracking (cron job or scheduled function)
- Point decay over time
- Leaderboards
- Point history timeline
- Custom point values per community

