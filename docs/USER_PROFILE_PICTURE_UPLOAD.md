# 📸 User Profile Picture Upload

Comprehensive documentation for the user profile picture upload feature with real-time updates.

---

## 🎯 Overview

Users can upload, update, and delete their profile pictures. The system uses:

- ✅ **Supabase Storage** for file hosting
- ✅ **Real-time state updates** (no refresh needed!)
- ✅ **Automatic cleanup** of old images
- ✅ **Best practices** from centralized storage config
- ✅ **Production-ready** with proper validation

---

## 🏗️ Architecture

### **Flow Diagram**

```
User clicks camera icon
       ↓
Select image file (max 2MB)
       ↓
Client-side validation (type & size)
       ↓
Upload to /api/user/profile-picture
       ↓
Server validates & authenticates
       ↓
Delete old image (if exists)
       ↓
Upload to Supabase Storage (ConnectSpace/user-profile/)
       ↓
Update auth.users metadata
       ↓
Return public URL
       ↓
Client refreshes session
       ↓
Update local state with cache-busting
       ↓
✨ UI updates in real-time!
```

---

## 📁 File Structure

```
/app/api/user/profile-picture/
  └── route.ts                    # API endpoint (POST, DELETE)

/app/profile/
  └── page.tsx                    # Profile page with upload UI

/config/
  └── storage.ts                  # Storage configuration & helpers

/scripts/
  └── setup-user-profile-storage-rls.sql  # RLS policies (optional)
```

---

## 🔑 Key Features

### **1. Real-Time Update (No Refresh!)**

```typescript
// ✅ After upload, immediately update local state
const {
  data: { session: newSession },
} = await supabase.auth.refreshSession();

if (newSession?.user) {
  const timestamp = Date.now();
  setUser({
    ...newSession.user,
    user_metadata: {
      ...newSession.user.user_metadata,
      avatar_url: `${data.avatar_url}?t=${timestamp}`, // Cache-busting!
    },
  });
}
```

### **2. Automatic Old Image Cleanup**

```typescript
// Upload new image
formData.append("file", file);

// API will delete this before uploading new one
if (user?.user_metadata?.avatar_url) {
  formData.append("oldImageUrl", user.user_metadata.avatar_url);
}
```

### **3. Validation (Client & Server)**

**Client-side:**

- File type: Only images (JPEG, PNG, GIF, WebP)
- File size: Max 2MB

**Server-side:**

- Authentication check
- File type validation (using `isValidImageType`)
- File size validation (using `isValidFileSize`)

### **4. Loading State**

```typescript
const [isUploadingImage, setIsUploadingImage] = useState(false);

// Show spinner on camera button while uploading
{
  isUploadingImage ? (
    <div className="animate-spin..." />
  ) : (
    <Camera className="..." />
  );
}
```

---

## 📝 Configuration

### **Storage Config** (`config/storage.ts`)

```typescript
export const STORAGE_CONFIG = {
  bucket: "ConnectSpace",

  folders: {
    userProfile: "user-profile", // ✅ Added
    // ... other folders
  },

  limits: {
    avatar: 2 * 1024 * 1024, // 2MB
    // ... other limits
  },
};
```

### **Environment Variables** (`.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # ⚠️ Required!
```

⚠️ **Important:** `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS policies, allowing the API to upload files on behalf of users.

---

## 🔌 API Endpoints

### **POST /api/user/profile-picture**

Upload a new profile picture.

**Request:**

```typescript
const formData = new FormData();
formData.append("file", file);
formData.append("oldImageUrl", "https://..."); // Optional

fetch("/api/user/profile-picture", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${session.access_token}`,
  },
  body: formData,
});
```

**Response:**

```json
{
  "success": true,
  "avatar_url": "https://...supabase.../ConnectSpace/user-profile/1234567890-avatar.jpg",
  "message": "Profile picture uploaded successfully"
}
```

**Errors:**

- `401`: No/invalid authentication token
- `400`: No file, invalid type, or too large
- `500`: Upload or metadata update failed

---

### **DELETE /api/user/profile-picture**

Delete user's profile picture.

**Request:**

```typescript
fetch(`/api/user/profile-picture?imageUrl=${encodeURIComponent(imageUrl)}`, {
  method: "DELETE",
  headers: {
    Authorization: `Bearer ${session.access_token}`,
  },
});
```

**Response:**

```json
{
  "success": true,
  "message": "Profile picture deleted successfully"
}
```

---

## 🎨 UI Components

### **Profile Picture Upload Button**

```tsx
<label htmlFor="profile-picture-upload" className="cursor-pointer">
  <AnimatedButton variant="glass" disabled={isUploadingImage}>
    {isUploadingImage ? (
      <div className="animate-spin..." />
    ) : (
      <Camera className="h-4 w-4 text-purple-600" />
    )}
  </AnimatedButton>
  <input
    id="profile-picture-upload"
    type="file"
    accept="image/*"
    onChange={handleProfilePictureUpload}
    disabled={isUploadingImage}
    className="hidden"
  />
</label>
```

### **Avatar Display**

```tsx
<Avatar className="h-28 w-28">
  <AvatarImage
    src={user.user_metadata?.avatar_url || ""}
    alt={getUserDisplayName()}
  />
  <AvatarFallback>{getUserInitials()}</AvatarFallback>
</Avatar>
```

---

## 🚀 Usage

### **1. For Users**

1. Navigate to `/profile`
2. Click the **camera icon** on your avatar
3. Select an image (max 2MB)
4. Wait for upload (see spinner)
5. ✨ Avatar updates automatically!

### **2. For Developers**

**Test Upload:**

```bash
# 1. Ensure storage bucket exists
# Go to Supabase Dashboard → Storage → Create "ConnectSpace" bucket

# 2. Make it public
# Enable "Public bucket" in settings

# 3. Test upload
# Go to http://localhost:3000/profile
# Click camera icon and upload an image
```

**Verify Storage:**

```sql
-- Check uploaded files
SELECT name, created_at, metadata
FROM storage.objects
WHERE bucket_id = 'ConnectSpace'
  AND name LIKE 'user-profile/%'
ORDER BY created_at DESC;
```

**Verify User Metadata:**

```sql
-- Check user avatar URLs
SELECT
  id,
  email,
  raw_user_meta_data->>'avatar_url' as avatar_url
FROM auth.users
WHERE raw_user_meta_data->>'avatar_url' IS NOT NULL;
```

---

## 🐛 Troubleshooting

### **Problem 1: "No authorization token provided"**

**Solution:**
Ensure the Authorization header is set correctly:

```typescript
headers: {
  Authorization: `Bearer ${session.access_token}`,
}
```

---

### **Problem 2: "Bucket not found"**

**Solution:**

1. Go to Supabase Dashboard → Storage
2. Create bucket named `ConnectSpace`
3. Enable "Public bucket" in settings

---

### **Problem 3: "Failed to upload profile picture"**

**Solution:**
Check environment variables:

```bash
# .env.local
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Must be set!
```

Get service role key from:
Supabase Dashboard → Settings → API → `service_role` key

---

### **Problem 4: "Avatar doesn't update after upload"**

**Solution:**
This is now fixed with:

- ✅ Session refresh after upload
- ✅ Cache-busting timestamp
- ✅ Local state update

---

### **Problem 5: "File too large"**

**Solution:**

- Max size is **2MB** for profile pictures
- Compress image before uploading
- Or update limit in `config/storage.ts`:

```typescript
limits: {
  avatar: 5 * 1024 * 1024, // Change to 5MB
}
```

---

## 📊 Performance Considerations

### **Optimization 1: Image Compression**

Consider adding client-side image compression:

```bash
npm install browser-image-compression
```

```typescript
import imageCompression from "browser-image-compression";

const compressedFile = await imageCompression(file, {
  maxSizeMB: 1,
  maxWidthOrHeight: 800,
});
```

### **Optimization 2: Progressive Loading**

Use blur placeholder while loading:

```tsx
<Image src={avatarUrl} placeholder="blur" blurDataURL="data:image/..." />
```

### **Optimization 3: CDN Caching**

Supabase Storage automatically uses CDN. Images are cached for 1 hour (configurable in `storage.ts`).

---

## 🔒 Security

### **1. Authentication Required**

All endpoints check for valid authentication token:

```typescript
const {
  data: { user },
  error,
} = await supabaseAdmin.auth.getUser(token);
if (error || !user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### **2. File Validation**

- Type: Only image MIME types allowed
- Size: Max 2MB enforced
- Extension: Validated on server

### **3. User Isolation**

- Users can only upload/delete their own pictures
- Service role key used for storage operations
- Metadata updates are user-specific

### **4. SQL Injection Protection**

- No raw SQL queries
- All operations use Supabase client
- Parameterized queries throughout

---

## 📈 Future Enhancements

### **Planned Features:**

1. **Image Cropping**

   - Add a crop UI before upload
   - Allow users to adjust aspect ratio

2. **Multiple Avatars**

   - Let users choose from gallery
   - Provide default avatar options

3. **Avatar History**

   - Keep last 3 avatars
   - Allow quick switching

4. **Social Login Sync**
   - Fetch avatar from Google/Facebook
   - Auto-update on login

---

## 📚 Related Documentation

- [Storage Configuration](../config/storage.ts)
- [API Documentation](../API_DOCUMENTATION.md)
- [Badge Upload (similar pattern)](./SETUP_BADGE_STORAGE.md)

---

## ✅ Checklist for New Developers

- [ ] Understand the upload flow diagram
- [ ] Know where `SUPABASE_SERVICE_ROLE_KEY` comes from
- [ ] Understand why we use `refreshSession()`
- [ ] Know how cache-busting works (`?t=timestamp`)
- [ ] Can explain why old images are deleted
- [ ] Understand the difference between client & server validation

---

**Last Updated:** November 2024  
**Version:** 1.0  
**Author:** ConnectSpace Team
