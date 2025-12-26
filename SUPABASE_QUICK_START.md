# Supabase Quick Start - Get Social Features Running in 15 Minutes

## What You're Getting

✅ User authentication (Email + Google/Discord/GitHub OAuth)
✅ User profiles with avatars
✅ Comments on songs (with replies)
✅ Shared playlists with collaborators
✅ Favorites and listening history
✅ All integrated with your existing Navidrome backend

## Step 1: Create Supabase Project (5 minutes)

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click **"New Project"**
3. Fill in:
   - Name: `yedits-net`
   - Database Password: (generate strong password, save it!)
   - Region: Choose closest to you
4. Click **"Create new project"** (takes ~2 min)

## Step 2: Get API Keys (1 minute)

1. In Supabase Dashboard, go to **Settings** (gear icon) > **API**
2. Copy these two values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: (the long key under "Project API keys")

## Step 3: Add to Your .env File (2 minutes)

Open your `.env` file and add:

```env
# Add these new lines:
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Example:**
```env
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...
```

## Step 4: Create Database Tables (3 minutes)

1. In Supabase Dashboard, click **SQL Editor** in sidebar
2. Click **"New Query"**
3. Copy **ALL** the SQL from `supabase/schema.sql` (in this repo)
4. Paste into the SQL editor
5. Click **"Run"** (or press Cmd/Ctrl + Enter)
6. You should see: **"Success. No rows returned"**

## Step 5: Enable Google Login (4 minutes - Optional)

### Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** > **Create Credentials** > **OAuth client ID**
5. Configure consent screen:
   - User Type: External
   - App name: "yedits.net"
   - Add your email
6. Create OAuth client:
   - Type: Web application
   - Authorized redirect URIs: `https://your-project.supabase.co/auth/v1/callback`
7. Copy **Client ID** and **Client Secret**

### Add to Supabase

1. In Supabase Dashboard: **Authentication** > **Providers**
2. Find **Google** and enable it
3. Paste your Client ID and Client Secret
4. Click **Save**

## Step 6: Test It! (1 minute)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start dev server:
   ```bash
   npm run dev
   ```

3. Open browser to `http://localhost:3000`

4. You should now see OAuth login options!

## What's Working Now?

✅ **Backend is 100% ready:**
- Database tables created
- Security policies configured
- Authentication enabled
- APIs ready to use

✅ **Frontend infrastructure:**
- `useAuth()` hook - Get current user, login/logout
- `useComments()` hook - Add comments to songs
- `usePlaylists()` hook - Create and manage playlists
- `useFavorites()` hook - Favorite songs

🔄 **What you need to build:**
- Login page UI
- Register page UI  
- Comments UI components
- Playlist management UI

## Quick Usage Examples

### Check if user is logged in

```tsx
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { user, profile } = useAuth()
  
  if (!user) {
    return <div>Please log in</div>
  }
  
  return <div>Welcome, {profile?.username}!</div>
}
```

### Add a comment to a song

```tsx
import { useComments } from '@/hooks/useComments'

function SongPage({ songId }) {
  const { createComment } = useComments(songId)
  
  const handleComment = () => {
    createComment({
      song_id: songId,
      content: "This song is amazing!"
    })
  }
  
  return <button onClick={handleComment}>Comment</button>
}
```

### Favorite a song

```tsx
import { useFavorites } from '@/hooks/useFavorites'
import { useAuth } from '@/contexts/AuthContext'

function FavoriteButton({ songId }) {
  const { user } = useAuth()
  const { toggleFavorite, isFavorite } = useFavorites(user?.id)
  
  return (
    <button onClick={() => toggleFavorite(songId)}>
      {isFavorite(songId) ? '❤️ Favorited' : '🤍 Favorite'}
    </button>
  )
}
```

## Next Steps

Now that your backend is ready, you can:

1. **Build login/register pages** - See `docs/SUPABASE_IMPLEMENTATION.md` for examples
2. **Add comments to song pages** - Use the `useComments` hook
3. **Build playlist sharing** - Use the `usePlaylists` hook
4. **Add user profiles** - Let users customize their profiles

## Enable More OAuth Providers

### Discord (Recommended for gaming/music communities)

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** > Name it "yedits.net"
3. Go to **OAuth2** > Add redirect: `https://your-project.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret
5. In Supabase: **Authentication** > **Providers** > Enable **Discord**
6. Paste credentials and save

### GitHub

1. GitHub Settings > Developer settings > OAuth Apps
2. **New OAuth App**
3. Callback URL: `https://your-project.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret
5. In Supabase: **Authentication** > **Providers** > Enable **GitHub**
6. Paste credentials and save

## Troubleshooting

**"Supabase not configured" error**
- Check `.env` file has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart dev server: Stop it (Ctrl+C) and run `npm run dev` again

**OAuth redirect errors**
- Go to Supabase: **Authentication** > **URL Configuration**
- Add: `http://localhost:3000` and `http://localhost:3000/auth/callback`

**Can't see tables in Supabase**
- Make sure you ran the SQL from `supabase/schema.sql`
- Check **Table Editor** in Supabase Dashboard

## Documentation

- **Full Implementation Guide**: `docs/SUPABASE_IMPLEMENTATION.md`
- **Supabase Setup**: `docs/SUPABASE_SETUP.md`
- **Database Schema**: `supabase/schema.sql`

## Free Tier Limits

- 50,000 users/month (plenty for personal use)
- 500 MB database (thousands of users)
- Unlimited API requests
- **Cost: $0/month**

## Need Help?

1. Check browser console for errors
2. Review `docs/SUPABASE_SETUP.md` for detailed troubleshooting
3. Visit [Supabase Discord](https://discord.supabase.com)
4. Check [Supabase Docs](https://supabase.com/docs)

---

**Congratulations!** 🎉 Your social features backend is ready. Time to build some amazing UI!
