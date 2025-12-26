# Supabase Setup Guide

This guide will help you set up Supabase authentication and database for yedits.net social features.

## What You'll Get

- ✅ User authentication (Email/Password + OAuth)
- ✅ User profiles with avatars and bios
- ✅ Comments on songs (with nested replies)
- ✅ Shared playlists with collaborators
- ✅ Favorites and listening history
- ✅ Secure Navidrome credential storage

## Prerequisites

- A Supabase account (free tier works great)
- Node.js 16+ installed
- Your Navidrome server running

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub (recommended) or email
4. Click "New Project"
5. Fill in:
   - **Name**: `yedits-net` (or your preferred name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free (50,000 MAUs)
6. Click "Create new project" (takes ~2 minutes)

## Step 2: Get Your API Credentials

1. Once project is created, go to **Settings** (gear icon in sidebar)
2. Click **API** in the left menu
3. Copy these values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (the long string under "Project API keys")

## Step 3: Add Credentials to .env

Open your `.env` file and add:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Example:**
```env
VITE_SUPABASE_URL=https://abcdefghijk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 4: Create Database Schema

1. In Supabase Dashboard, click **SQL Editor** in sidebar
2. Click **New Query**
3. Copy the entire contents of `supabase/schema.sql` from this repo
4. Paste into the SQL editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned"

**What this creates:**
- `profiles` table for user data
- `comments` table for song comments
- `playlists` table for user playlists
- `playlist_songs` table for playlist contents
- `playlist_collaborators` table for sharing
- `favorites` table for favorite songs
- `listening_history` table for play tracking
- All necessary policies and triggers

## Step 5: Enable Authentication Providers

### Email/Password (Default)

1. Go to **Authentication** > **Providers** in sidebar
2. **Email** should already be enabled
3. Configure email templates (optional):
   - Click **Email Templates**
   - Customize confirmation and reset emails

### Google OAuth (Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** > **Create Credentials** > **OAuth client ID**
5. Configure consent screen:
   - User Type: External
   - App name: "yedits.net"
   - Add your email
   - Add scopes: `email`, `profile`
6. Create OAuth client:
   - Application type: Web application
   - Authorized redirect URIs: `https://your-project.supabase.co/auth/v1/callback`
7. Copy **Client ID** and **Client Secret**
8. In Supabase Dashboard:
   - Go to **Authentication** > **Providers**
   - Enable **Google**
   - Paste Client ID and Secret
   - Click **Save**

### Discord OAuth (Recommended for Communities)

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application**
3. Name it "yedits.net" > Create
4. Go to **OAuth2** in sidebar
5. Click **Add Redirect**:
   - Add: `https://your-project.supabase.co/auth/v1/callback`
6. Copy **Client ID** and **Client Secret**
7. In Supabase Dashboard:
   - Go to **Authentication** > **Providers**
   - Enable **Discord**
   - Paste Client ID and Secret
   - Click **Save**

### GitHub OAuth (Optional)

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Click **New OAuth App**
3. Fill in:
   - Application name: "yedits.net"
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `https://your-project.supabase.co/auth/v1/callback`
4. Click **Register application**
5. Copy **Client ID**
6. Click **Generate a new client secret** > Copy it
7. In Supabase Dashboard:
   - Go to **Authentication** > **Providers**
   - Enable **GitHub**
   - Paste Client ID and Secret
   - Click **Save**

## Step 6: Configure URL Redirects

1. In Supabase Dashboard, go to **Authentication** > **URL Configuration**
2. Add these Site URLs:
   - `http://localhost:3000` (development)
   - `https://your-production-domain.com` (production)
3. Add these Redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://your-production-domain.com/auth/callback`

## Step 7: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. The app should now show OAuth login buttons

3. Try signing up with:
   - Email/Password
   - Google (if configured)
   - Discord (if configured)

4. Check Supabase Dashboard:
   - Go to **Authentication** > **Users**
   - You should see your new user
   - Go to **Table Editor** > **profiles**
   - Your profile should be auto-created

## Security Best Practices

### Row Level Security (RLS)

All tables have RLS enabled automatically. This means:
- Users can only edit their own profiles
- Users can only see public playlists or their own
- Comments are public but only editable by author
- Navidrome credentials are encrypted and private

### Environment Variables

**Never commit these to git:**
- ✅ `.env` is in `.gitignore`
- ✅ Use `.env.example` as template
- ❌ Don't share your `SUPABASE_ANON_KEY` publicly
- ❌ Don't commit OAuth secrets

### Production Checklist

- [ ] Use production Supabase project (not the same as dev)
- [ ] Enable email confirmation
- [ ] Configure email rate limiting
- [ ] Set up custom SMTP (optional but recommended)
- [ ] Enable MFA/2FA for admin accounts
- [ ] Set up database backups
- [ ] Monitor usage in Supabase Dashboard

## Troubleshooting

### "Failed to create profile" error

**Cause**: The `handle_new_user()` trigger didn't fire

**Fix**: 
1. Check SQL Editor for errors when creating schema
2. Re-run the schema.sql file
3. Verify trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

### OAuth redirect errors

**Cause**: Redirect URLs don't match

**Fix**:
1. Check **Authentication** > **URL Configuration**
2. Ensure redirect URLs match exactly (including http/https)
3. Update OAuth provider redirect URIs

### "Row Level Security" errors

**Cause**: Policies not set up correctly

**Fix**:
1. Re-run schema.sql
2. Check policies in **Table Editor** > Select table > **Policies** tab
3. Ensure user is authenticated (check `auth.users` table)

### Supabase client not initializing

**Cause**: Missing or incorrect environment variables

**Fix**:
1. Check `.env` file exists
2. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Restart dev server: `npm run dev`
4. Check browser console for errors

## Next Steps

- ✅ Users can now sign up and log in
- ✅ Profiles are auto-created
- 🔄 Build UI for comments (coming next)
- 🔄 Build UI for shared playlists
- 🔄 Build UI for favorites
- 🔄 Add listening history tracking

## Cost Estimation

**Supabase Free Tier:**
- 50,000 Monthly Active Users
- 500 MB database space
- 1 GB file storage
- 2 GB bandwidth

**Perfect for:**
- Personal use
- Small communities (< 1000 users)
- Development and testing

**Upgrade to Pro ($25/month) when:**
- Need 100,000 MAUs
- Need 8 GB database
- Need daily backups
- Need priority support

## Support

If you run into issues:
1. Check [Supabase Docs](https://supabase.com/docs)
2. Visit [Supabase Discord](https://discord.supabase.com)
3. Open an issue on GitHub

---

**Congratulations!** 🎉 Your social features backend is now ready!
