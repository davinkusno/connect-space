# Inactive Communities Auto-Suspension System

## 📋 Overview

Sistem otomatis untuk mengelola komunitas yang tidak aktif. Community akan otomatis di-suspend jika tidak ada aktivitas admin (Event atau Announcement) selama 30 hari. Untuk reactivate, community admin harus membuat request ke super admin.

---

## 🎯 Activity Tracking Logic

### Aktivitas yang Dipantau:
1. **Event Creation** - Admin/Moderator membuat event baru
2. **Announcement Posts** - Admin membuat announcement

### Auto-Suspension Criteria:
- Tidak ada aktivitas (event/announcement) selama **30 hari** → Status: `suspended`
- Community suspended tidak bisa diakses oleh members (read-only atau disabled)

---

## 🗄️ Database Schema

### 1. Communities Table (Update)

```sql
-- Add new columns to communities table
ALTER TABLE communities
ADD COLUMN last_activity_date TIMESTAMP,
ADD COLUMN last_activity_type VARCHAR(20), -- 'event' or 'announcement'
ADD COLUMN status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'archived'
ADD COLUMN suspended_at TIMESTAMP,
ADD COLUMN suspension_reason TEXT DEFAULT 'Auto-suspended due to inactivity (30+ days)';

-- Index for quick status queries
CREATE INDEX idx_communities_status ON communities(status);
CREATE INDEX idx_communities_last_activity ON communities(last_activity_date);
```

### 2. Community Reactivation Requests Table

```sql
CREATE TABLE community_reactivation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES users(id), -- Community admin who requested
  request_message TEXT, -- Optional message from admin
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES users(id), -- Super admin who reviewed
  review_notes TEXT, -- Notes from super admin
  
  UNIQUE(community_id, status) -- Only one pending request per community
);

-- Indexes
CREATE INDEX idx_reactivation_status ON community_reactivation_requests(status);
CREATE INDEX idx_reactivation_community ON community_reactivation_requests(community_id);
CREATE INDEX idx_reactivation_created ON community_reactivation_requests(created_at DESC);
```

### 3. Community Activity Log Table

```sql
CREATE TABLE community_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  activity_type VARCHAR(20) NOT NULL, -- 'event', 'announcement'
  activity_id UUID, -- Reference to event or post id
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_activity_community ON community_activity_log(community_id, created_at DESC);
CREATE INDEX idx_activity_type ON community_activity_log(activity_type);
```

---

## 🔄 Auto-Suspension Workflow

### Daily Cron Job (Run at midnight)

```typescript
// /lib/cron/check-inactive-communities.ts

import { createClient } from '@supabase/supabase-js';

export async function checkAndSuspendInactiveCommunities() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role for admin operations
  );

  // Find communities that should be suspended
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: inactiveCommunities, error } = await supabase
    .from('communities')
    .select('id, name, last_activity_date')
    .eq('status', 'active')
    .lt('last_activity_date', thirtyDaysAgo.toISOString());

  if (error) {
    console.error('Error fetching inactive communities:', error);
    return;
  }

  // Suspend each inactive community
  for (const community of inactiveCommunities) {
    await supabase
      .from('communities')
      .update({
        status: 'suspended',
        suspended_at: new Date().toISOString(),
        suspension_reason: 'Auto-suspended due to inactivity (30+ days)'
      })
      .eq('id', community.id);

    console.log(`Suspended community: ${community.name} (${community.id})`);
  }

  return {
    suspended: inactiveCommunities.length,
    communities: inactiveCommunities.map(c => c.name)
  };
}
```

### Setup Cron Job (Vercel Cron)

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/check-inactive-communities",
      "schedule": "0 0 * * *"
    }
  ]
}
```

```typescript
// /app/api/cron/check-inactive-communities/route.ts

import { NextResponse } from 'next/server';
import { checkAndSuspendInactiveCommunities } from '@/lib/cron/check-inactive-communities';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await checkAndSuspendInactiveCommunities();
    return NextResponse.json({
      success: true,
      message: `Suspended ${result.suspended} inactive communities`,
      data: result
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Failed to check inactive communities' },
      { status: 500 }
    );
  }
}
```

---

## 📡 API Endpoints

### 1. Track Activity (Auto-update last_activity_date)

#### When Event is Created

```typescript
// /app/api/communities/[id]/events/route.ts

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { user } = await getServerSession();
  const { title, description, date, location } = await request.json();
  
  const supabase = createServerClient();

  // Create event
  const { data: event, error: eventError } = await supabase
    .from('community_events')
    .insert({
      community_id: params.id,
      title,
      description,
      event_date: date,
      location,
      created_by: user.id
    })
    .select()
    .single();

  if (eventError) {
    return NextResponse.json({ error: eventError.message }, { status: 400 });
  }

  // Update community last activity
  await supabase
    .from('communities')
    .update({
      last_activity_date: new Date().toISOString(),
      last_activity_type: 'event'
    })
    .eq('id', params.id);

  // Log activity
  await supabase
    .from('community_activity_log')
    .insert({
      community_id: params.id,
      activity_type: 'event',
      activity_id: event.id,
      created_by: user.id
    });

  return NextResponse.json({ event });
}
```

#### When Announcement is Posted

```typescript
// /app/api/communities/[id]/announcements/route.ts

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { user } = await getServerSession();
  const { title, content } = await request.json();
  
  const supabase = createServerClient();

  // Create announcement
  const { data: announcement, error: announcementError } = await supabase
    .from('community_posts')
    .insert({
      community_id: params.id,
      author_id: user.id,
      title,
      content,
      post_type: 'announcement'
    })
    .select()
    .single();

  if (announcementError) {
    return NextResponse.json({ error: announcementError.message }, { status: 400 });
  }

  // Update community last activity
  await supabase
    .from('communities')
    .update({
      last_activity_date: new Date().toISOString(),
      last_activity_type: 'announcement'
    })
    .eq('id', params.id);

  // Log activity
  await supabase
    .from('community_activity_log')
    .insert({
      community_id: params.id,
      activity_type: 'announcement',
      activity_id: announcement.id,
      created_by: user.id
    });

  return NextResponse.json({ announcement });
}
```

### 2. Request Reactivation (Community Admin)

```typescript
// /app/api/communities/[id]/request-reactivation/route.ts

import { NextResponse } from 'next/server';
import { createServerClient, getServerSession } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { user } = await getServerSession();
  const { message } = await request.json();
  
  const supabase = createServerClient();

  // Verify user is community admin
  const { data: community } = await supabase
    .from('communities')
    .select('admin_id, status')
    .eq('id', params.id)
    .single();

  if (!community) {
    return NextResponse.json({ error: 'Community not found' }, { status: 404 });
  }

  if (community.admin_id !== user.id) {
    return NextResponse.json({ error: 'Only community admin can request reactivation' }, { status: 403 });
  }

  if (community.status !== 'suspended') {
    return NextResponse.json({ error: 'Community is not suspended' }, { status: 400 });
  }

  // Check if there's already a pending request
  const { data: existingRequest } = await supabase
    .from('community_reactivation_requests')
    .select('id')
    .eq('community_id', params.id)
    .eq('status', 'pending')
    .single();

  if (existingRequest) {
    return NextResponse.json({ error: 'Reactivation request already pending' }, { status: 400 });
  }

  // Create reactivation request
  const { data: request, error } = await supabase
    .from('community_reactivation_requests')
    .insert({
      community_id: params.id,
      requested_by: user.id,
      request_message: message,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: 'Reactivation request submitted successfully',
    request
  });
}
```

### 3. Get Inactive Communities (Super Admin)

```typescript
// /app/api/superadmin/inactive-communities/route.ts

import { NextResponse } from 'next/server';
import { createServerClient, getServerSession } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { user } = await getServerSession();
  
  // Verify super admin
  if (user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const supabase = createServerClient();

  // Get all suspended communities with reactivation requests
  const { data: communities, error } = await supabase
    .from('communities')
    .select(`
      id,
      name,
      member_count,
      last_activity_date,
      last_activity_type,
      status,
      suspended_at,
      admin:users!communities_admin_id_fkey(name, email),
      reactivation_requests:community_reactivation_requests(
        id,
        request_message,
        status,
        created_at,
        requested_by
      )
    `)
    .eq('status', 'suspended')
    .order('last_activity_date', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Calculate inactive days
  const communitiesWithDays = communities.map(community => {
    const lastActivity = new Date(community.last_activity_date);
    const now = new Date();
    const inactiveDays = Math.floor(
      (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check if has pending request
    const pendingRequest = community.reactivation_requests.find(
      (req: any) => req.status === 'pending'
    );

    return {
      ...community,
      inactiveDays,
      reactivationRequested: !!pendingRequest,
      requestedAt: pendingRequest?.created_at,
      requestMessage: pendingRequest?.request_message
    };
  });

  return NextResponse.json({ communities: communitiesWithDays });
}
```

### 4. Approve Reactivation (Super Admin)

```typescript
// /app/api/superadmin/reactivation-requests/[id]/approve/route.ts

import { NextResponse } from 'next/server';
import { createServerClient, getServerSession } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { user } = await getServerSession();
  const { notes } = await request.json();
  
  // Verify super admin
  if (user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const supabase = createServerClient();

  // Get request details
  const { data: requestData, error: requestError } = await supabase
    .from('community_reactivation_requests')
    .select('community_id, status')
    .eq('id', params.id)
    .single();

  if (requestError || !requestData) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  if (requestData.status !== 'pending') {
    return NextResponse.json({ error: 'Request already processed' }, { status: 400 });
  }

  // Update request status
  await supabase
    .from('community_reactivation_requests')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      review_notes: notes
    })
    .eq('id', params.id);

  // Reactivate community
  await supabase
    .from('communities')
    .update({
      status: 'active',
      suspended_at: null,
      suspension_reason: null,
      last_activity_date: new Date().toISOString() // Reset activity date
    })
    .eq('id', requestData.community_id);

  // Log activity
  await supabase
    .from('community_activity_log')
    .insert({
      community_id: requestData.community_id,
      activity_type: 'reactivation',
      created_by: user.id
    });

  return NextResponse.json({
    message: 'Community reactivated successfully'
  });
}
```

---

## 🎨 Frontend Implementation

### Community Admin View (Request Reactivation)

```typescript
// /app/communities/[id]/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CommunityPage({ params }: { params: { id: string } }) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Assume community data is loaded and community.status === 'suspended'

  const handleRequestReactivation = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/communities/${params.id}/request-reactivation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        throw new Error('Failed to submit request');
      }

      alert('Reactivation request submitted! Super admin will review your request.');
      router.refresh();
    } catch (error) {
      alert('Error submitting request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-orange-900 mb-4">
          ⚠️ Community Suspended
        </h2>
        <p className="text-orange-700 mb-6">
          This community has been automatically suspended due to inactivity for more than 30 days. 
          No events or announcements were created during this period.
        </p>

        <div className="bg-white rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-2">To reactivate your community:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>Submit a reactivation request to super admin</li>
            <li>Explain your plans to revive the community</li>
            <li>Wait for approval from super admin</li>
            <li>Once approved, resume creating events and announcements</li>
          </ol>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message to Super Admin (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-orange-500"
              rows={4}
              placeholder="Explain your plans to revive this community..."
            />
          </div>

          <button
            onClick={handleRequestReactivation}
            disabled={isSubmitting}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Request Reactivation'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Super Admin View (Already Implemented in UI)

The UI has been updated in `/app/superadmin/page.tsx` with:
- ✅ Badge showing pending requests
- ✅ Conditional "Approve" button (only shows if request exists)
- ✅ Display of request message
- ✅ Activity type indicator (Event/Announcement)

---

## 📊 Monitoring & Notifications

### Daily Summary Email to Super Admin

```typescript
// /lib/email/send-inactive-summary.ts

export async function sendInactiveSummaryEmail() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: inactiveCommunities } = await supabase
    .from('communities')
    .select('name, last_activity_date')
    .eq('status', 'suspended');

  const { data: pendingRequests } = await supabase
    .from('community_reactivation_requests')
    .select('*, community:communities(name)')
    .eq('status', 'pending');

  // Send email to super admin
  await sendEmail({
    to: process.env.SUPER_ADMIN_EMAIL!,
    subject: `Daily Report: ${inactiveCommunities.length} Suspended Communities`,
    html: `
      <h2>Suspended Communities: ${inactiveCommunities.length}</h2>
      <h3>Pending Reactivation Requests: ${pendingRequests.length}</h3>
      <ul>
        ${pendingRequests.map(req => `
          <li>
            <strong>${req.community.name}</strong><br/>
            Message: ${req.request_message || 'No message'}
          </li>
        `).join('')}
      </ul>
    `
  });
}
```

---

## ✅ Testing Checklist

### Auto-Suspension
- [ ] Community with no event/announcement for 30+ days gets suspended
- [ ] Suspended community shows correct status in database
- [ ] Members cannot access suspended community
- [ ] Admin receives notification about suspension

### Reactivation Request
- [ ] Community admin can submit reactivation request
- [ ] Request appears in super admin dashboard
- [ ] Cannot submit duplicate requests
- [ ] Non-admin users cannot submit request

### Super Admin Actions
- [ ] Super admin can see all suspended communities
- [ ] Can see which communities have pending requests
- [ ] Can approve reactivation (community becomes active)
- [ ] Activity is logged after reactivation

### Activity Tracking
- [ ] Creating event updates `last_activity_date`
- [ ] Creating announcement updates `last_activity_date`
- [ ] Activity type is correctly stored
- [ ] Activity log is created

---

## 🚀 Deployment Steps

1. **Run Database Migrations**
   ```bash
   # Add new columns and tables
   psql -d your_database -f migrations/add_community_suspension.sql
   ```

2. **Set Environment Variables**
   ```env
   CRON_SECRET=your_random_secret
   SUPER_ADMIN_EMAIL=admin@connectspace.com
   ```

3. **Deploy Cron Job** (Vercel)
   - Ensure `vercel.json` is configured
   - Deploy application
   - Verify cron job in Vercel dashboard

4. **Test Auto-Suspension**
   ```bash
   # Manually trigger cron
   curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://your-domain.com/api/cron/check-inactive-communities
   ```

5. **Monitor Logs**
   - Check Vercel function logs
   - Monitor Supabase logs for errors

---

## 📈 Future Enhancements

1. **Warning System**
   - Send warning email at 20 days of inactivity
   - Give admins 10 days to create activity before auto-suspend

2. **Graduated Suspension**
   - 30 days: Suspend (can request reactivation)
   - 90 days: Archive (harder to reactivate)
   - 180 days: Permanent deletion (with backup)

3. **Analytics Dashboard**
   - Show community health metrics
   - Predict which communities will be suspended soon
   - Track reactivation success rate

4. **Bulk Actions**
   - Approve multiple reactivation requests at once
   - Send reminder emails to multiple admins

---

## 🔗 Related Documentation

- [SUPERADMIN_REPORTS_INTEGRATION.md](./SUPERADMIN_REPORTS_INTEGRATION.md) - Report system
- Supabase Row Level Security policies
- Email notification templates


