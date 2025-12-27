# Complete Setup Guide - yedits.net New Features

This guide covers setting up all the new features added to yedits.net:

1. ✅ **YouTube OAuth Integration** - Connect Google accounts, import playlists, like videos, comment
2. ✅ **Comment System** - Supabase-powered comments for artists, albums, compilations, and singles

## Quick Start Checklist

- [ ] Set up Google OAuth credentials
- [ ] Configure environment variables for YouTube
- [ ] Add OAuth callback route
- [ ] Set up Supabase project
- [ ] Run Supabase migration for comments
- [ ] Configure environment variables for Supabase
- [ ] Test YouTube integration
- [ ] Test comment system

---

## Part 1: YouTube OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Create Project"**
3. Name: `yedits-youtube-oauth`
4. Click **"Create"**

### Step 2: Enable YouTube Data API

1. In your project, go to **"APIs & Services" > "Library"**
2. Search for **"YouTube Data API v3"**
3. Click **"Enable"**

### Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services" > "OAuth consent screen"**
2. Choose **"External"** user type
3. Fill in:
   - App name: `yedits.net`
   - User support email: Your email
   - Developer contact email: Your email
4. Click **"Save and Continue"**
5. On **"Scopes"** page, add:
   - `https://www.googleapis.com/auth/youtube.readonly`
   - `https://www.googleapis.com/auth/youtube.force-ssl`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/userinfo.email`
6. Click **"Save and Continue"**
7. Add test users (your Google email)
8. Click **"Save and Continue"**

### Step 4: Create OAuth Credentials

1. Go to **"APIs & Services" > "Credentials"**
2. Click **"Create Credentials" > "OAuth client ID"**
3. Choose **"Web application"**
4. Name: `yedits.net Web Client`
5. Under **"Authorized redirect URIs"**, add:
   ```
   http://localhost:3000/youtube/callback
   ```
6. Click **"Create"**
7. **Copy the Client ID and Client Secret**

### Step 5: Configure YouTube Environment Variables

Add to your `.env` file:

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your-client-secret
VITE_GOOGLE_REDIRECT_URI=http://localhost:3000/youtube/callback

# YouTube API Key (for read-only features)
VITE_YOUTUBE_API_KEY=your-youtube-api-key
```

### Step 6: Add OAuth Callback Route

In `src/routes/router.tsx`, add:

```tsx
import { YouTubeOAuthCallback } from '@/app/features/youtube/pages/YouTubeOAuthCallback';

// Add this route
{
  path: '/youtube/callback',
  element: <YouTubeOAuthCallback />,
}
```

### Step 7: Test YouTube Integration

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Navigate to the YouTube page
3. Click **"Connect Google Account"**
4. Authorize the app
5. You should see your profile picture
6. Try:
   - Import playlists
   - Like a video
   - Post a comment

---

## Part 2: Supabase Comment System Setup

### Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in:
   - Name: `yedits-comments`
   - Database Password: (choose a strong password)
   - Region: Choose closest to you
4. Click **"Create new project"**
5. Wait for database to provision (~2 minutes)

### Step 2: Get Supabase Credentials

1. Go to **"Settings" > "API"**
2. Copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (under "Project API keys")

### Step 3: Configure Supabase Environment Variables

Add to your `.env` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Run Database Migration

1. In Supabase Dashboard, go to **"SQL Editor"**
2. Click **"New query"**
3. Copy the entire contents of:
   ```
   supabase/migrations/20251228000000_comments_system.sql
   ```
4. Paste into the SQL editor
5. Click **"Run"** (bottom right)
6. You should see: **"Success. No rows returned"**

### Step 5: Verify Database Setup

In the SQL Editor, run:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('comments', 'comment_reactions');

-- Should return 2 rows
```

Expected output:
```
comments
comment_reactions
```

### Step 6: Test Comment System

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Navigate to any artist/album/song page
3. Add the comment component:
   ```tsx
   import { CommentSection } from '@/app/components/comments/CommentSection';
   
   <CommentSection
     contentType="artist"
     contentId={artist.id}
     userId={currentUser?.id}
     username={currentUser?.username}
     userAvatar={currentUser?.avatar}
   />
   ```

4. Try:
   - Post a comment
   - Reply to a comment
   - Add emoji reactions
   - Edit your comment
   - Delete your comment

---

## Common Issues & Fixes

### YouTube OAuth Issues

#### Error: "redirect_uri_mismatch"

**Fix:**
1. Check redirect URI in Google Console **exactly matches**:
   ```
   http://localhost:3000/youtube/callback
   ```
2. No trailing slash
3. Correct protocol (http vs https)
4. Correct port number

#### Error: "Access blocked: This app's request is invalid"

**Fix:**
1. Add your Google account to **Test users** in OAuth consent screen
2. Make sure all required scopes are added
3. App must be in "Testing" mode

#### Tokens not persisting

**Fix:**
1. Check browser console for errors
2. Open DevTools > Application > Local Storage
3. Look for `youtube-oauth-storage`
4. Clear localStorage and try again

### Comment System Issues

#### Error: "column 'content_type' does not exist"

**Fix:**
1. Make sure you're using the FIXED migration file
2. The GROUP BY clause must include all columns
3. Re-run the migration from `supabase/migrations/20251228000000_comments_system.sql`

#### Comments not showing

**Fix:**
1. Check Supabase configuration:
   ```tsx
   import { isSupabaseConfigured } from '@/lib/supabase';
   console.log('Configured:', isSupabaseConfigured());
   ```
2. Verify environment variables are set
3. Check browser console for errors
4. Verify RLS policies are enabled

#### Can't post comments

**Fix:**
1. Ensure `userId` and `username` are provided
2. Check user is authenticated
3. Verify text is 1-2000 characters
4. Check Supabase logs for errors

#### RLS Policy Errors

**Fix:**
If you see "row level security policy violation":

1. Go to Supabase Dashboard > Authentication
2. Make sure you're logged in OR
3. Temporarily disable RLS for testing:
   ```sql
   ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.comment_reactions DISABLE ROW LEVEL SECURITY;
   ```
   ⚠️ **Re-enable RLS before production!**

---

## Integration Examples

### Artist Page with Comments

```tsx
import { CommentSection } from '@/app/components/comments/CommentSection';
import { useAuth } from '@/hooks/useAuth';

function ArtistPage({ artist }) {
  const { user } = useAuth();

  return (
    <div>
      <h1>{artist.name}</h1>
      <p>{artist.bio}</p>

      {/* Artist content */}
      
      {/* Comments */}
      <CommentSection
        contentType="artist"
        contentId={artist.id}
        userId={user?.id}
        username={user?.username}
        userAvatar={user?.avatar}
        title="Artist Discussion"
      />
    </div>
  );
}
```

### Album Page with Comments

```tsx
import { CommentSection } from '@/app/components/comments/CommentSection';

function AlbumPage({ album }) {
  const { user } = useAuth();

  return (
    <div>
      <h1>{album.name}</h1>
      
      {/* Album details */}
      
      <CommentSection
        contentType="album"
        contentId={album.id}
        userId={user?.id}
        username={user?.username}
        userAvatar={user?.avatar}
      />
    </div>
  );
}
```

### YouTube Page Integration

```tsx
import { YouTubeAuthButton } from '@/app/features/youtube/components/YouTubeAuthButton';
import { YouTubeUserPlaylists } from '@/app/features/youtube/components/YouTubeUserPlaylists';
import { LikeButton } from '@/app/features/youtube/components/LikeButton';

function YouTubePage() {
  return (
    <div>
      {/* Auth button in header */}
      <YouTubeAuthButton />
      
      {/* Import playlists */}
      <YouTubeUserPlaylists 
        onImportPlaylist={(playlist) => {
          console.log('Importing:', playlist);
        }} 
      />
      
      {/* On video cards */}
      <LikeButton videoId={video.id} />
    </div>
  );
}
```

---

## Production Deployment

### Before Deploying:

1. **YouTube OAuth:**
   - [ ] Add production redirect URI to Google Console
   - [ ] Use backend proxy for client secret
   - [ ] Enable HTTPS
   - [ ] Request quota increase if needed

2. **Comment System:**
   - [ ] Enable RLS on all tables
   - [ ] Set up database backups
   - [ ] Configure rate limiting
   - [ ] Add moderation workflow
   - [ ] Set up error monitoring

3. **Environment Variables:**
   - [ ] Add all variables to hosting platform
   - [ ] Never commit `.env` to git
   - [ ] Use secrets management

### Production Environment Variables

```env
# Production URLs
VITE_GOOGLE_REDIRECT_URI=https://yourdomain.com/youtube/callback
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

---

## Support

For detailed documentation:

- **YouTube OAuth:** See `docs/YOUTUBE_OAUTH_SETUP.md`
- **Comment System:** See `docs/COMMENT_SYSTEM_SETUP.md`
- **Components:** See `src/app/features/youtube/README.md`
- **Examples:** See `src/app/features/comments/examples/`

## Testing Checklist

### YouTube Integration
- [ ] Connect Google account
- [ ] Import a playlist
- [ ] Like a video
- [ ] Unlike a video
- [ ] Post a comment
- [ ] Reply to a comment
- [ ] Disconnect account

### Comment System
- [ ] Post a top-level comment
- [ ] Reply to a comment (1 level)
- [ ] Reply to a reply (2 levels)
- [ ] Edit your comment
- [ ] Delete your comment
- [ ] Add emoji reaction
- [ ] Remove emoji reaction
- [ ] View reaction counts
- [ ] Test character limit (2000 max)

---

## Next Steps

1. ✅ Complete setup following this guide
2. ✅ Test all features locally
3. ✅ Integrate into your existing pages
4. ✅ Customize UI to match your design
5. ✅ Deploy to production

**All code is ready on the `testing` branch!** 🎉

Happy coding! 🚀
