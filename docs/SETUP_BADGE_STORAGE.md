# Setup Badge Image Storage

This guide explains how to setup Supabase Storage for badge images.

## Prerequisites

- Supabase project setup
- Super admin access to Supabase dashboard

## Step 1: Create Storage Bucket

1. Go to **Supabase Dashboard** → **Storage**
2. Click "**New bucket**"
3. Fill in the details:

   - **Name**: `ConnectSpace` (exactly as shown, case-sensitive)
   - **Public bucket**: ✅ **YES** (Check this box)
   - **File size limit**: `5MB` (recommended)
   - **Allowed MIME types**: Leave empty (all types allowed) or specify: `image/jpeg,image/png,image/gif,image/webp`

4. Click "**Create bucket**"

## Step 2: Verify Bucket Settings

1. Click on the **ConnectSpace** bucket
2. Go to **Configuration**
3. Ensure:
   - Public: ✅ **Enabled**
   - Allowed MIME types: Images allowed

## Step 3: Create Folder Structure (Optional)

The API will automatically create the `badges/` folder when uploading the first image.

Or you can manually create it:

1. In the **ConnectSpace** bucket
2. Click "**Upload**" → "**Create folder**"
3. Name: `badges`

## Step 4: Test Upload

1. Login as **super_admin**
2. Go to **Superadmin** → **Badge Management**
3. Click "**Create Badge**"
4. Try uploading an image
5. Should work without RLS errors! ✅

## How It Works

### Security Flow:

1. **Client-side** (BadgeImageUpload component):

   - User selects image
   - Gets auth token from session
   - Sends to API with token

2. **Server-side** (API route `/api/badges/upload-image`):

   - Validates super_admin role
   - Validates file (type, size)
   - Uses **service role key** to upload (bypasses RLS)
   - Returns public URL

3. **Storage**:
   - Bucket is **public** for read access
   - Upload is protected by API (super_admin only)

## Troubleshooting

### Error: "Row-level security policy violation"

**Solution**: Make sure the bucket is set to **Public**

### Error: "Bucket not found"

**Solution**: Create bucket with exact name `ConnectSpace` (case-sensitive)

### Error: "File too large"

**Solution**:

- Check file size (must be < 5MB)
- Increase bucket file size limit in Supabase

### Error: "Invalid MIME type"

**Solution**:

- Ensure file is an image (jpg, png, gif, webp)
- Check bucket allowed MIME types

## File Structure

After upload, files are stored as:

```
ConnectSpace/
  └── badges/
      ├── 1234567890-badge-name.png
      ├── 1234567891-another-badge.jpg
      └── ...
```

## Public URL Format

```
https://[project-id].supabase.co/storage/v1/object/public/ConnectSpace/badges/[filename]
```

## Additional Notes

- ✅ Images are publicly readable (for display in app)
- 🔒 Upload is protected (super_admin only via API)
- 🗑️ Delete is handled by API (when badge is deleted)
- 📁 Automatic filename sanitization (special chars removed)
- ⏱️ Timestamp prefix prevents filename collisions

## Related Files

- API Route: `app/api/badges/upload-image/route.ts`
- Upload Function: `lib/supabase.ts` → `uploadBadgeImage()`
- Component: `components/superadmin/badge-image-upload.tsx`
