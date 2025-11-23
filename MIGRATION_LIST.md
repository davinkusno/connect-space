# Community Admin Migration List

## Files to Copy and Adjust

### 1. Edit Community Page
**FROM:** `app/community-admin/edit/page.tsx`  
**TO:** `app/community-admin/[id]/edit/page.tsx`

**Changes needed:**
- Add `params: Promise<{ id: string }>` to component props
- Replace community lookup logic (creator/admin) with direct fetch by `params.id`
- Update all links from `/community-admin/...` to `/community-admin/${communityId}/...`
- Update redirect after save to use `communityId`

---

### 2. Discussions/Announcements Page
**FROM:** `app/community-admin/discussions/page.tsx`  
**TO:** `app/community-admin/[id]/discussions/page.tsx`

**Changes needed:**
- Add `params: Promise<{ id: string }>` to component props
- Replace community lookup logic with direct fetch by `params.id`
- Update all links from `/community-admin/...` to `/community-admin/${communityId}/...`
- Update `loadCommunityAndAnnouncements` to use `params.id`

---

### 3. Events Page
**FROM:** `app/community-admin/events/page.tsx`  
**TO:** `app/community-admin/[id]/events/page.tsx`

**Changes needed:**
- Add `params: Promise<{ id: string }>` to component props
- Replace community lookup logic with direct fetch by `params.id`
- Update all links from `/community-admin/...` to `/community-admin/${communityId}/...`
- Update `loadEvents` to use `params.id`
- Update event detail/edit links to use `communityId`

---

### 4. Requests Page
**FROM:** `app/community-admin/requests/page.tsx`  
**TO:** `app/community-admin/[id]/requests/page.tsx`

**Changes needed:**
- Add `params: Promise<{ id: string }>` to component props
- Replace community lookup logic with direct fetch by `params.id`
- Update all links from `/community-admin/...` to `/community-admin/${communityId}/...`
- Update `loadJoinRequests` to use `params.id`
- Update `handleApprove` and `handleReject` to use `params.id` for community_id

---

### 5. Event Detail Page (Nested Route)
**FROM:** `app/community-admin/events/[id]/page.tsx`  
**TO:** `app/community-admin/[id]/events/[eventId]/page.tsx`

**Changes needed:**
- Change params from `{ id: string }` to `{ id: string, eventId: string }`
- `id` = community ID, `eventId` = event ID
- Update all community links to use `id` (community ID)
- Update event operations to use `eventId`
- Update back links to `/community-admin/${id}/events`

---

### 6. Event Edit Page (Nested Route)
**FROM:** `app/community-admin/events/[id]/edit/page.tsx`  
**TO:** `app/community-admin/[id]/events/[eventId]/edit/page.tsx`

**Changes needed:**
- Change params from `{ id: string }` to `{ id: string, eventId: string }`
- `id` = community ID, `eventId` = event ID
- Update all community links to use `id` (community ID)
- Update event operations to use `eventId`
- Update redirect after save to `/community-admin/${id}/events/${eventId}`

---

## Files That DON'T Need to Move

### Keep as-is:
- `app/community-admin/create/page.tsx` - No community ID needed (creating new)
- `app/community-admin/notifications/page.tsx` - If exists, may need adjustment but not urgent

---

## Summary of Pattern Changes

### Pattern 1: Component Props
**OLD:**
```typescript
export default function PageName() {
```

**NEW:**
```typescript
export default function PageName({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [communityId, setCommunityId] = useState<string | null>(null)
  
  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setCommunityId(resolvedParams.id)
      // Use resolvedParams.id for community operations
    }
    loadParams()
  }, [params])
```

### Pattern 2: Community Lookup
**OLD:**
```typescript
// Try to get community where user is creator
let { data: communityData } = await supabase
  .from("communities")
  .select("*")
  .eq("creator_id", user.id)
  .limit(1)
  .maybeSingle()

// If not found, try admin...
```

**NEW:**
```typescript
// Get community by ID from params
const { data: communityData, error } = await supabase
  .from("communities")
  .select("*")
  .eq("id", communityId) // from params
  .single()

// Verify user is admin or creator
const isCreator = communityData.creator_id === user.id
const { data: membership } = await supabase
  .from("community_members")
  .select("role")
  .eq("community_id", communityId)
  .eq("user_id", user.id)
  .eq("role", "admin")
  .maybeSingle()

if (!isCreator && !membership) {
  // Not authorized
  return
}
```

### Pattern 3: Links
**OLD:**
```typescript
<Link href="/community-admin">Back</Link>
<Link href="/community-admin/members">Members</Link>
```

**NEW:**
```typescript
<Link href={communityId ? `/community-admin/${communityId}` : "/community-admin"}>Back</Link>
<Link href={`/community-admin/${communityId}/members`}>Members</Link>
```

---

## Order of Migration (Recommended)

1. ✅ **Already Done:**
   - `[id]/page.tsx` (dashboard)
   - `[id]/members/page.tsx`

2. **Next Priority:**
   - `[id]/requests/page.tsx` (most used)
   - `[id]/edit/page.tsx` (important)

3. **Then:**
   - `[id]/discussions/page.tsx`
   - `[id]/events/page.tsx`

4. **Finally (Nested Routes):**
   - `[id]/events/[eventId]/page.tsx`
   - `[id]/events/[eventId]/edit/page.tsx`

---

## Notes

- All pages should verify user is admin/creator of the community
- Use `params.id` for community ID (not to be confused with event ID in nested routes)
- Keep backward compatibility where possible during migration
- Test each page after migration




