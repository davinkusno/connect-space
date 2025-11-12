# 🎖️ Badges API Documentation

## Base URL
```
http://localhost:3000/api
```

---

## 📋 Endpoints

### 1. **Get All Badges**
```http
GET /badges
```

**Query Parameters:**
- `isActive` (optional): `true` | `false` - Filter by active status

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Star Badge",
    "description": "Awarded for achievements",
    "icon": "Star",
    "category": "achievement",
    "price": 100,
    "image_url": "https://...",
    "is_active": true,
    "purchase_count": 42,
    "created_at": "2025-10-27T19:00:00Z",
    "updated_at": "2025-10-27T19:00:00Z"
  }
]
```

**Example:**
```bash
curl http://localhost:3000/api/badges?isActive=true
```

---

### 2. **Create Badge** (Admin)
```http
POST /badges
```

**Request Body:**
```json
{
  "name": "Star Badge",
  "description": "Awarded for achievements",
  "icon": "Star",
  "category": "achievement",
  "price": 100,
  "image_url": "https://...",
  "is_active": true
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "Star Badge",
  "description": "Awarded for achievements",
  "icon": "Star",
  "category": "achievement",
  "price": 100,
  "image_url": "https://...",
  "is_active": true,
  "purchase_count": 0,
  "created_at": "2025-10-27T19:00:00Z",
  "updated_at": "2025-10-27T19:00:00Z"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/badges \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Star Badge",
    "description": "Awarded for achievements",
    "icon": "Star",
    "category": "achievement",
    "price": 100
  }'
```

---

### 3. **Get Single Badge**
```http
GET /badges/[id]
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Star Badge",
  "description": "Awarded for achievements",
  "icon": "Star",
  "category": "achievement",
  "price": 100,
  "image_url": "https://...",
  "is_active": true,
  "purchase_count": 42,
  "created_at": "2025-10-27T19:00:00Z",
  "updated_at": "2025-10-27T19:00:00Z"
}
```

**Example:**
```bash
curl http://localhost:3000/api/badges/550e8400-e29b-41d4-a716-446655440000
```

---

### 4. **Update Badge** (Admin)
```http
PUT /badges/[id]
```

**Request Body:**
```json
{
  "name": "Updated Badge",
  "description": "Updated description",
  "price": 150,
  "is_active": true
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Updated Badge",
  "description": "Updated description",
  "price": 150,
  "is_active": true,
  "updated_at": "2025-10-27T19:30:00Z"
}
```

**Example:**
```bash
curl -X PUT http://localhost:3000/api/badges/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Badge",
    "price": 150
  }'
```

---

### 5. **Delete Badge** (Admin)
```http
DELETE /badges/[id]
```

**Response:** `200 OK`
```json
{
  "message": "Badge deleted successfully"
}
```

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/badges/550e8400-e29b-41d4-a716-446655440000
```

---

### 6. **Purchase Badge**
```http
POST /badges/[id]/purchase
```

**Request Body:**
```json
{
  "userId": "user-uuid"
}
```

**Response:** `201 Created`
```json
{
  "message": "Badge purchased successfully",
  "data": {
    "id": "uuid",
    "user_id": "user-uuid",
    "badge_id": "badge-uuid",
    "purchased_at": "2025-10-27T19:00:00Z",
    "purchase_price": 100
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/badges/550e8400-e29b-41d4-a716-446655440000/purchase \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-550e8400-e29b-41d4-a716-446655440000"
  }'
```

---

### 7. **Get User Badges**
```http
GET /user-badges?userId=[userId]
```

**Query Parameters:**
- `userId` (required): User UUID

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "user-uuid",
    "badge_id": "badge-uuid",
    "purchased_at": "2025-10-27T19:00:00Z",
    "purchase_price": 100,
    "badge": {
      "id": "badge-uuid",
      "name": "Star Badge",
      "description": "Awarded for achievements",
      "icon": "Star",
      "category": "achievement",
      "price": 100,
      "image_url": "https://...",
      "is_active": true,
      "purchase_count": 42,
      "created_at": "2025-10-27T19:00:00Z",
      "updated_at": "2025-10-27T19:00:00Z"
    }
  }
]
```

**Example:**
```bash
curl http://localhost:3000/api/user-badges?userId=user-550e8400-e29b-41d4-a716-446655440000
```

---

### 8. **Check Badge Ownership**
```http
POST /user-badges/check
```

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
    "user_id": "user-uuid",
    "badge_id": "badge-uuid",
    "purchased_at": "2025-10-27T19:00:00Z",
    "purchase_price": 100
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/user-badges/check \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-550e8400-e29b-41d4-a716-446655440000",
    "badgeId": "badge-550e8400-e29b-41d4-a716-446655440000"
  }'
```

---

### 9. **Check Multiple Badge Ownership**
```http
GET /user-badges/check?userId=[userId]&badgeIds=[id1]&badgeIds=[id2]
```

**Query Parameters:**
- `userId` (required): User UUID
- `badgeIds` (required, multiple): Badge UUIDs

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

**Example:**
```bash
curl "http://localhost:3000/api/user-badges/check?userId=user-550e8400-e29b-41d4-a716-446655440000&badgeIds=badge-1&badgeIds=badge-2&badgeIds=badge-3"
```

---

## 🔐 Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 📊 Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields: name, description, price"
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

## 🧪 Testing dengan cURL

### Get all badges
```bash
curl http://localhost:3000/api/badges
```

### Create badge
```bash
curl -X POST http://localhost:3000/api/badges \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Badge",
    "description": "This is a test badge",
    "icon": "Star",
    "category": "achievement",
    "price": 100
  }'
```

### Purchase badge
```bash
curl -X POST http://localhost:3000/api/badges/[badge-id]/purchase \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "[user-id]"
  }'
```

### Get user badges
```bash
curl http://localhost:3000/api/user-badges?userId=[user-id]
```

---

## 📁 File Structure

```
app/api/
├── badges/
│   ├── route.ts                    # GET all, POST create
│   ├── [id]/
│   │   ├── route.ts                # GET one, PUT update, DELETE
│   │   └── purchase/
│   │       └── route.ts            # POST purchase
│   └── upload/
│       └── route.ts                # (Future) POST upload image
└── user-badges/
    ├── route.ts                    # GET user badges, POST add badge
    └── check/
        └── route.ts                # POST/GET check ownership
```

---

## ✅ Status

Semua API endpoints sudah siap digunakan! 🚀
