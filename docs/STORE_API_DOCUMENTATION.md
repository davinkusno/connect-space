# Store & Badges API Documentation

Complete API reference for the ConnectSpace Badge Store system.

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Role-Based Access Control

- **Public**: No authentication required
- **User**: Any authenticated user
- **Super Admin**: User with `super_admin` role

---

## 📦 Badges API

### 1. Get All Badges

**GET** `/api/badges`

Get all badges (optionally filter by active status).

**Query Parameters:**

- `isActive` (optional): `"true"` to get only active badges

**Access:** Public

**Response:**

```json
[
  {
    "id": "uuid",
    "name": "Badge Name",
    "description": "Badge description",
    "icon": "Star",
    "category": "achievement",
    "price": 100,
    "image_url": "https://...",
    "is_active": true,
    "purchase_count": 42,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

---

### 2. Get Single Badge

**GET** `/api/badges/[id]`

Get details of a specific badge.

**Access:** Public

**Response:**

```json
{
  "id": "uuid",
  "name": "Badge Name",
  "description": "Badge description",
  "price": 100,
  "image_url": "https://...",
  "is_active": true,
  "purchase_count": 42
}
```

---

### 3. Create Badge

**POST** `/api/badges`

Create a new badge (Super Admin only).

**Access:** Super Admin

**Request Body:**

```json
{
  "name": "Badge Name",
  "description": "Badge description",
  "price": 100,
  "category": "achievement",
  "icon": "Star",
  "image_url": "https://...",
  "is_active": true
}
```

**Response:**

```json
{
  "id": "uuid",
  "name": "Badge Name",
  ...
}
```

---

### 4. Update Badge

**PUT** `/api/badges/[id]`

Update an existing badge (Super Admin only).

**Access:** Super Admin

**Request Body:**

```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "price": 150,
  "is_active": false,
  "image_url": "https://new-image.com"
}
```

**Note:** If `image_url` is changed or cleared, the old image will be automatically deleted from storage.

---

### 5. Delete Badge

**DELETE** `/api/badges/[id]`

Delete a badge (Super Admin only).

**Access:** Super Admin

**Note:** Associated image in storage will be automatically deleted.

**Response:**

```json
{
  "message": "Badge deleted successfully"
}
```

---

### 6. Upload Badge Image

**POST** `/api/badges/upload-image`

Upload a badge image to storage (Super Admin only).

**Access:** Super Admin

**Request:** `multipart/form-data`

- `file`: Image file (max 5MB, types: jpeg, jpg, png, gif, webp)

**Response:**

```json
{
  "url": "https://storage.supabase.co/...",
  "path": "badges/unique-filename.jpg"
}
```

---

## 🛒 Purchase API

### 7. Purchase Badge

**POST** `/api/badges/[id]/purchase`

Purchase a badge with user points.

**Access:** Authenticated User

**Request Body:**

```json
{
  "userId": "user-uuid"
}
```

**Response (Success):**

```json
{
  "message": "Badge purchased successfully",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "badge_id": "uuid",
    "purchased_at": "2024-01-01T00:00:00Z",
    "purchase_price": 100
  },
  "newBalance": 1900
}
```

**Response (Insufficient Points):**

```json
{
  "error": "Insufficient points",
  "currentPoints": 50,
  "requiredPoints": 100
}
```

**Response (Already Owned):**

```json
{
  "error": "User already owns this badge"
}
```

---

## 👤 User Badges API

### 8. Get User's Badges

**GET** `/api/user-badges?userId=[id]`

Get all badges owned by a user.

**Query Parameters:**

- `userId` (required): User ID

**Access:** Public

**Response:**

```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "badge_id": "uuid",
    "purchased_at": "2024-01-01T00:00:00Z",
    "purchase_price": 100,
    "badge": {
      "id": "uuid",
      "name": "Badge Name",
      "description": "...",
      "image_url": "https://...",
      ...
    }
  }
]
```

---

### 9. Award Badge to User

**POST** `/api/user-badges`

Award a badge to a user without charge (Super Admin only - for gifting/awarding).

**Access:** Super Admin

**Request Body:**

```json
{
  "userId": "user-uuid",
  "badgeId": "badge-uuid"
}
```

**Response:**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "badge_id": "uuid",
  "purchased_at": "2024-01-01T00:00:00Z",
  "purchase_price": 0
}
```

---

### 10. Check Badge Ownership

**POST** `/api/user-badges/check`

Check if a user owns a specific badge.

**Access:** Public

**Request Body:**

```json
{
  "userId": "user-uuid",
  "badgeId": "badge-uuid"
}
```

**Response:**

```json
{
  "owned": true,
  "badge": {
    "id": "uuid",
    "user_id": "uuid",
    "badge_id": "uuid",
    ...
  }
}
```

---

### 11. Check Multiple Badges

**GET** `/api/user-badges/check?userId=[id]&badgeIds=[id1]&badgeIds=[id2]`

Check ownership of multiple badges at once.

**Query Parameters:**

- `userId` (required): User ID
- `badgeIds` (required, multiple): Badge IDs to check

**Access:** Public

**Response:**

```json
{
  "ownedBadgeIds": ["badge-uuid-1", "badge-uuid-3"],
  "badgeOwnershipMap": {
    "badge-uuid-1": true,
    "badge-uuid-2": false,
    "badge-uuid-3": true
  }
}
```

---

## 💰 User Points API

### 12. Get User Points

**GET** `/api/user/points`

Get the authenticated user's current points balance.

**Access:** Authenticated User

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "points": 2450,
  "userId": "user-uuid"
}
```

---

### 13. Update User Points

**PUT** `/api/user/[id]/points`

Add, deduct, or set user points (Super Admin only).

**Access:** Super Admin

**Request Body:**

```json
{
  "action": "add",
  "amount": 500,
  "reason": "Weekly bonus"
}
```

**Actions:**

- `"add"`: Add points to current balance
- `"deduct"`: Subtract points from current balance (min: 0)
- `"set"`: Set points to exact amount

**Response:**

```json
{
  "success": true,
  "previousPoints": 1000,
  "newPoints": 1500,
  "action": "add",
  "amount": 500,
  "reason": "Weekly bonus"
}
```

---

## 📊 Transactions API

### 14. Get User Transactions

**GET** `/api/user/[id]/transactions`

Get a user's purchase history.

**Access:** Authenticated User (own transactions) or Super Admin (any user)

**Query Parameters:**

- `limit` (optional, default: 50): Number of transactions per page
- `offset` (optional, default: 0): Pagination offset

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "badgeId": "badge-uuid",
      "purchasedAt": "2024-01-01T00:00:00Z",
      "purchasePrice": 100,
      "badge": {
        "id": "badge-uuid",
        "name": "Badge Name",
        "description": "...",
        "imageUrl": "https://...",
        "category": "achievement"
      }
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request

```json
{
  "error": "Missing required fields: name, description, price"
}
```

### 401 Unauthorized

```json
{
  "error": "No authorization token provided"
}
```

### 403 Forbidden

```json
{
  "error": "Super admin access required"
}
```

### 404 Not Found

```json
{
  "error": "Badge not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

---

## Usage Examples

### Example 1: User Purchasing a Badge

```javascript
// 1. Get user's points
const pointsResponse = await fetch("/api/user/points", {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
const { points } = await pointsResponse.json();

// 2. Check if user can afford badge
if (points >= badgePrice) {
  // 3. Purchase badge
  const purchaseResponse = await fetch(`/api/badges/${badgeId}/purchase`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });

  const result = await purchaseResponse.json();

  if (result.newBalance !== undefined) {
    console.log("Purchase successful! New balance:", result.newBalance);
  }
}
```

### Example 2: Admin Awarding Points

```javascript
// Admin adds 1000 bonus points to a user
const response = await fetch(`/api/user/${userId}/points`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminAccessToken}`,
  },
  body: JSON.stringify({
    action: "add",
    amount: 1000,
    reason: "Community contribution bonus",
  }),
});

const result = await response.json();
console.log(`Points updated: ${result.previousPoints} → ${result.newPoints}`);
```

### Example 3: Checking Badge Ownership

```javascript
// Check if user owns multiple badges
const badgeIds = ["badge-1", "badge-2", "badge-3"];
const params = new URLSearchParams({
  userId: userId,
});
badgeIds.forEach((id) => params.append("badgeIds", id));

const response = await fetch(`/api/user-badges/check?${params}`);
const { badgeOwnershipMap } = await response.json();

console.log(badgeOwnershipMap);
// { "badge-1": true, "badge-2": false, "badge-3": true }
```

---

## Security Notes

1. **Super Admin endpoints** are protected by `requireSuperAdmin()` middleware
2. **User endpoints** validate that users can only access their own data
3. **Points deduction** is atomic and validated server-side
4. **Duplicate purchases** are prevented at the database level
5. **Image uploads** are validated for type and size (max 5MB)
6. **Old images** are automatically deleted when badges are updated/deleted

---

## Rate Limiting

⚠️ **TODO:** Implement rate limiting for:

- Badge purchases (prevent spam)
- Image uploads (prevent abuse)
- Points queries (prevent excessive polling)

Recommended limits:

- Badge purchase: 10 per minute per user
- Image upload: 5 per minute per admin
- Points query: 30 per minute per user

---

## Best Practices

1. **Always check points balance** before showing purchase button
2. **Handle errors gracefully** - show user-friendly messages
3. **Use optimistic UI updates** but revert on error
4. **Cache badge data** to reduce API calls
5. **Paginate transactions** for better performance
6. **Log admin actions** for audit trail

---

## Database Schema

### badges

```sql
- id: uuid (PK)
- name: text
- description: text
- icon: text
- category: text
- price: integer
- image_url: text
- is_active: boolean
- purchase_count: integer
- created_at: timestamp
- updated_at: timestamp
```

### user_badges

```sql
- id: uuid (PK)
- user_id: uuid (FK → users)
- badge_id: uuid (FK → badges)
- purchased_at: timestamp
- purchase_price: integer
```

### users (relevant fields)

```sql
- id: uuid (PK)
- points: integer (default: 0)
- role: text
```

---

**Last Updated:** November 1, 2025
