# 🔍 Profile Picture Upload - Setup Verification Guide

This guide helps you diagnose and fix profile picture upload issues.

---

## 🚨 Common Issues & Solutions

### **Issue 1: Image not uploading / No storage file**

#### **Symptoms:**

- Upload button shows spinner then nothing happens
- No error message shown
- Image doesn't appear in Supabase Storage
- Console shows errors

#### **Check 1: Environment Variable**

**Problem:** `SUPABASE_SERVICE_ROLE_KEY` is missing

**Solution:**

1. Open `.env.local`
2. Add this line:

```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**How to get Service Role Key:**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Settings** (gear icon) → **API**
4. Find **"service_role" secret** (NOT the anon key!)
5. Click **"Reveal"** button
6. Copy the key
7. Paste into `.env.local`

**⚠️ IMPORTANT:** Restart your dev server after adding:

```bash
# Stop server (Ctrl+C)
# Start again:
npm run dev
```

---

#### **Check 2: Storage Bucket**

**Problem:** `ConnectSpace` bucket doesn't exist

**Solution:**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → **Storage**
2. Check if bucket `ConnectSpace` exists
3. If not, click **"New bucket"**
   - Name: `ConnectSpace` (exact spelling, case-sensitive!)
   - **Public bucket**: Toggle **ON** ✅
   - Click **Create bucket**

**Verify bucket is public:**

1. Click on `ConnectSpace` bucket
2. Click **Settings** tab
3. Make sure **"Public bucket"** is enabled

---

#### **Check 3: Service Role Key Works**

**Problem:** Service role key is invalid or expired

**Test:**

1. Open browser console (F12)
2. Go to `/profile` page
3. Upload an image
4. Check server terminal for logs like:

```
📸 Profile picture upload started
✅ User authenticated: your-email@example.com
📁 File received: { name: '...', size: ..., type: '...' }
✅ File validation passed
📦 Storage path: user-profile/1234567890-image.jpg
🪣 Bucket: ConnectSpace
📤 Uploading to Supabase Storage...
```

**If you see:**

- ❌ `SUPABASE_SERVICE_ROLE_KEY is not defined` → Add to `.env.local`
- ❌ `Invalid authentication token` → Service role key is wrong
- ❌ `Bucket not found` → Create `ConnectSpace` bucket
- ❌ `Upload error: ...` → Check error details in console

---

### **Issue 2: Image uploads but doesn't show**

#### **Symptoms:**

- Upload succeeds
- File appears in Supabase Storage
- Avatar still shows initials/fallback

#### **Solution 1: Check Public URL**

1. Go to Supabase Dashboard → Storage → ConnectSpace → user-profile
2. Click on uploaded image
3. Click **Get URL** → **Public URL**
4. Copy URL
5. Paste in browser - should show image

**If image shows in browser but not in profile:**

- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh page (Ctrl+Shift+R)

**If image doesn't show in browser:**

- Bucket is not public
- Go to Storage → ConnectSpace → Settings
- Enable **"Public bucket"**

---

#### **Solution 2: Check Auth Metadata**

**Verify avatar_url is saved:**

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Find your user
3. Click **"..."** → **View user**
4. Check **User Metadata** section
5. Should see: `"avatar_url": "https://..."`

**If avatar_url is missing:**

- Service role key doesn't have permission
- Double-check you copied the **service_role** key (not anon key)

---

### **Issue 3: "Failed to upload profile picture"**

#### **Symptoms:**

- Toast shows "Failed to upload profile picture"
- Check server terminal for exact error

#### **Common Errors:**

**Error: "Bucket not found"**

```
❌ Upload error: { message: "Bucket not found" }
```

**Solution:** Create `ConnectSpace` bucket (see Check 2 above)

---

**Error: "The resource already exists"**

```
❌ Upload error: { message: "The resource already exists" }
```

**Solution:**

- File with same name exists
- This is rare (we use timestamps)
- Try uploading again (new timestamp will be used)

---

**Error: "Invalid JWT"**

```
❌ Authentication failed: Invalid JWT
```

**Solution:**

- Service role key is wrong
- Copy key again from Supabase Dashboard → Settings → API
- Make sure it's the **service_role** key

---

**Error: "Row Level Security"**

```
❌ Upload error: new row violates row-level security policy
```

**Solution:**

- Service role key bypasses RLS, so this shouldn't happen
- Make sure you're using `SUPABASE_SERVICE_ROLE_KEY` not `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## ✅ Complete Checklist

Run through this checklist:

```
Setup:
[ ] .env.local has SUPABASE_SERVICE_ROLE_KEY
[ ] Dev server restarted after adding env var
[ ] ConnectSpace bucket exists in Storage
[ ] ConnectSpace bucket is public
[ ] user-profile folder exists (or will be auto-created)

Test Upload:
[ ] Go to http://localhost:3000/profile
[ ] Click camera icon on avatar
[ ] Select image file (< 2MB, JPG/PNG/GIF/WebP)
[ ] See spinner on camera button
[ ] See "Uploading..." toast
[ ] See "Profile picture updated" toast
[ ] Avatar updates immediately

Verify in Supabase:
[ ] Storage → ConnectSpace → user-profile has your image
[ ] Authentication → Users → Your user → avatar_url is set
[ ] Image public URL works in browser

Check Logs:
[ ] Server terminal shows upload progress logs
[ ] No errors in server terminal
[ ] No errors in browser console
```

---

## 🔧 Debug Commands

### **Check Environment Variables**

```bash
# In your terminal:
cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY

# Should output something like:
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Check Supabase Connection**

```bash
# Test if Supabase URL is correct
curl https://your-project.supabase.co/rest/v1/
```

### **Check Storage Bucket**

```bash
# Test if bucket is accessible (replace URL)
curl https://your-project.supabase.co/storage/v1/bucket/ConnectSpace
```

---

## 📞 Still Not Working?

If you've tried everything above and it still doesn't work:

1. **Check Server Terminal Output**

   - Look for the emoji logs (📸, ✅, ❌)
   - Find the exact error message
   - Google the error message

2. **Check Browser Console**

   - Press F12 → Console tab
   - Look for red error messages
   - Screenshot any errors

3. **Check Supabase Logs**

   - Go to Supabase Dashboard → Logs
   - Select **Storage** logs
   - Look for failed upload attempts

4. **Verify Supabase Plan**
   - Free plan has limits
   - Check if you've hit storage quota
   - Dashboard → Settings → Usage

---

## 🎯 Quick Test Script

Copy this into your browser console while on `/profile` page:

```javascript
// Test if upload API is accessible
fetch("/api/user/profile-picture", {
  method: "OPTIONS",
})
  .then((r) => console.log("API accessible:", r.status))
  .catch((e) => console.error("API not accessible:", e));

// Check if user is authenticated
fetch("/api/user/profile-picture", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${sessionStorage.getItem("supabase.auth.token")}`,
  },
})
  .then((r) => r.json())
  .then((data) => console.log("Auth check:", data))
  .catch((e) => console.error("Auth failed:", e));
```

---

## 📚 Related Files

- `/app/api/user/profile-picture/route.ts` - API endpoint
- `/config/storage.ts` - Storage configuration
- `/app/profile/page.tsx` - Profile page UI
- `.env.local` - Environment variables

---

**Last Updated:** November 2024
