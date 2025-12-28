# Complete Setup Guide - Aonsoku Music Streaming Platform

This guide consolidates all setup instructions for deploying and configuring Aonsoku.

## Table of Contents

- [Quick Start](#quick-start)
- [Supabase Setup](#supabase-setup)
- [Railway Deployment](#railway-deployment)
- [YouTube Integration](#youtube-integration)
- [Configuration Reference](#configuration-reference)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- A running Navidrome server
- Admin access to Navidrome (for user registration)
- Supabase account (free tier)

### 1. Install Dependencies

```bash
git clone https://github.com/onyxdagoat1/aonsoku-fork.git
cd aonsoku-fork

# Install all dependencies
npm install
cd auth-service && npm install && cd ..
cd tag-writer-service && npm install && cd ..
cd upload-service && npm install && cd ..
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your settings (see [Configuration Reference](#configuration-reference)).

### 3. Set Up Supabase Database

Follow the [Supabase Setup](#supabase-setup) section below.

### 4. Run Development Server

```bash
npm run dev
```

Access:
- **Main App**: http://localhost:3000
- **Tag Writer**: http://localhost:3001
- **Upload Service**: http://localhost:3002
- **Auth Service**: http://localhost:3005

---

## Supabase Setup

### Why Supabase?

Supabase provides:
- User profiles and authentication
- Comment system with reactions
- Playlists with collaboration
- Favorites and listening history
- Real-time features
- Built-in security (Row Level Security)

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create account
3. Click **New Project**
4. Fill in:
   - **Name**: `aonsoku` (or your choice)
   - **Database Password**: Strong password (save it!)
   - **Region**: Closest to your users
5. Click **Create new project**
6. Wait ~2 minutes for provisioning

### Step 2: Run Database Schema

1. In Supabase dashboard, click **SQL Editor**
2. Click **New query**
3. Copy entire contents of `database/MASTER_SCHEMA.sql`
4. Paste into SQL editor
5. Click **Run** (or Ctrl/Cmd + Enter)
6. Verify: "Success. No rows returned"

### Step 3: Verify Tables

Click **Table Editor** - you should see:
- `profiles`
- `comments`
- `comment_reactions`
- `playlists`
- `playlist_songs`
- `playlist_collaborators`
- `favorites`
- `listening_history`

### Step 4: Get API Credentials

1. Click **Project Settings** (gear icon)
2. Click **API**
3. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key

### Step 5: Configure App

Add to `.env`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Step 6: Enable Authentication (Optional)

For OAuth providers:

1. Go to **Authentication** → **Providers**
2. Enable desired providers:
   - Email (enabled by default)
   - Google
   - Discord
   - GitHub
3. Configure redirect URLs:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`

### Step 7: Test Connection

```bash
npm run dev
```

1. Navigate to any artist/album page
2. Scroll to comments section
3. Post a comment
4. Refresh page - comment should persist

### Supabase Features Enabled

✅ User profiles with avatars  
✅ Persistent comments with reactions  
✅ Nested replies to comments  
✅ Playlist creation and sharing  
✅ Collaborative playlists  
✅ Favorites tracking  
✅ Listening history  
✅ Real-time updates  
✅ Row Level Security policies  

### Supabase Free Tier Limits

- 500 MB database storage
- Unlimited API requests
- 50,000 monthly active users
- 2 GB bandwidth

---

## Railway Deployment

### What is Railway?

Railway provides easy deployment for:
- Frontend application
- All backend services
- Automatic HTTPS
- Custom domains
- Environment management

### Prerequisites

- Railway account (free tier available)
- GitHub repository
- Supabase project configured

### Step 1: Connect Repository

1. Go to [https://railway.app](https://railway.app)
2. Sign in with GitHub
3. Click **New Project**
4. Select **Deploy from GitHub repo**
5. Choose your aonsoku-fork repository
6. Click **Deploy**

### Step 2: Configure Environment Variables

#### Frontend Service

Click on the deployed service → **Variables** → Add:

```env
VITE_API_URL=https://your-navidrome.com
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_YOUTUBE_API_KEY=your_youtube_key
VITE_ACCOUNT_API_URL=${{AUTH_SERVICE.RAILWAY_PUBLIC_DOMAIN}}/api
VITE_TAG_WRITER_SERVICE_URL=${{TAG_WRITER.RAILWAY_PUBLIC_DOMAIN}}
VITE_UPLOAD_SERVICE_URL=${{UPLOAD_SERVICE.RAILWAY_PUBLIC_DOMAIN}}
```

#### Auth Service

Create new service → **Variables**:

```env
NAVIDROME_URL=https://your-navidrome.com
NAVIDROME_USERNAME=admin
NAVIDROME_PASSWORD=your_password
FRONTEND_URL=${{FRONTEND.RAILWAY_PUBLIC_DOMAIN}}
PORT=3005
```

#### Tag Writer Service

Create new service → **Variables**:

```env
NAVIDROME_URL=https://your-navidrome.com
NAVIDROME_USERNAME=admin
NAVIDROME_PASSWORD=your_password
MUSIC_LIBRARY_PATH=/music
CORS_ORIGINS=${{FRONTEND.RAILWAY_PUBLIC_DOMAIN}}
PORT=3001
```

Mount volume for music files:
- Path: `/music`
- Size: As needed

#### Upload Service

Create new service → **Variables**:

```env
NAVIDROME_URL=https://your-navidrome.com
NAVIDROME_USERNAME=admin
NAVIDROME_PASSWORD=your_password
MUSIC_LIBRARY_PATH=/music
PORT=3002
```

Mount same volume as Tag Writer.

### Step 3: Deploy Services

1. Configure each service with correct start command:
   - **Frontend**: `npm run build && npm run preview`
   - **Auth**: `cd auth-service && npm start`
   - **Tag Writer**: `cd tag-writer-service && npm start`
   - **Upload**: `cd upload-service && npm start`

2. Wait for all services to deploy

3. Railway will provide public URLs for each

### Step 4: Configure Custom Domain (Optional)

1. Click on frontend service
2. Go to **Settings** → **Networking**
3. Click **Generate Domain** or **Custom Domain**
4. Add your domain
5. Update DNS records as shown

### Step 5: Update CORS

Update service URLs in `.env` with Railway public domains:

```env
VITE_ACCOUNT_API_URL=https://auth-production-xxxx.up.railway.app/api
VITE_TAG_WRITER_SERVICE_URL=https://tag-writer-production-xxxx.up.railway.app
VITE_UPLOAD_SERVICE_URL=https://upload-production-xxxx.up.railway.app
```

Redeploy services after updating CORS origins.

### Railway Pricing

- **Free Tier**: $5 credit/month
- **Hobby**: $5/month + usage
- Each service counts separately
- Includes HTTPS and custom domains

---

## YouTube Integration

### Features

- Browse YouTube channel videos
- Advanced search and filtering
- Sort by date, views, likes, duration
- Filter by time period and length
- Statistics dashboard
- Split-screen video player
- Threaded comments
- Smart caching (1-hour)

### Step 1: Create API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Click **Enable APIs and Services**
4. Search for **YouTube Data API v3**
5. Click **Enable**

### Step 2: Get API Key

1. Click **Credentials** in left sidebar
2. Click **Create Credentials** → **API key**
3. Copy the generated key
4. Click **Edit API key** to restrict it

### Step 3: Restrict API Key

**Application restrictions:**
- Select **HTTP referrers**
- Add:
  - `http://localhost:3000/*`
  - `https://yourdomain.com/*`

**API restrictions:**
- Select **Restrict key**
- Check only: **YouTube Data API v3**

### Step 4: Configure App

Add to `.env`:

```env
VITE_YOUTUBE_API_KEY=your_api_key_here
```

### Step 5: Test Integration

1. Restart dev server
2. Navigate to YouTube section in app
3. Search for a channel
4. Videos should load

### YouTube API Quota

- **Free**: 10,000 units/day
- ~104 units per page load
- ~96-240 loads/day with caching
- Caching reduces usage by 90%

### Usage Tips

1. **Enable caching**: Reduces API calls significantly
2. **Monitor quota**: Check usage in Google Cloud Console
3. **Request increase**: If needed, request quota increase (free)
4. **Optimize searches**: Use specific search terms

---

## Configuration Reference

### Complete .env Template

```env
# ============================================
# NAVIDROME CONNECTION (Required)
# ============================================
VITE_API_URL=http://localhost:4533
NAVIDROME_URL=http://localhost:4533
NAVIDROME_USERNAME=admin
NAVIDROME_PASSWORD=your_password

# ============================================
# SUPABASE (Required for social features)
# ============================================
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# ============================================
# MUSIC PATHS (Required for upload/tag editing)
# ============================================
TAG_WRITER_MUSIC_PATH=/path/to/music
UPLOAD_MUSIC_PATH=/path/to/music

# ============================================
# SERVICE PORTS (Optional - defaults shown)
# ============================================
PORT=3000
TAG_WRITER_PORT=3001
UPLOAD_PORT=3002
AUTH_PORT=3005

# ============================================
# SERVICE URLS (Auto-configured in development)
# ============================================
VITE_ACCOUNT_API_URL=http://localhost:3005/api
VITE_TAG_WRITER_SERVICE_URL=http://localhost:3001
VITE_UPLOAD_SERVICE_URL=http://localhost:3002

# ============================================
# YOUTUBE (Optional)
# ============================================
VITE_YOUTUBE_API_KEY=your_youtube_api_key

# ============================================
# CORS (Optional)
# ============================================
TAG_WRITER_CORS_ORIGINS=http://localhost:3000
AUTH_FRONTEND_URL=http://localhost:3000
```

### Environment Variable Prefixes

- `VITE_*` → Frontend app (browser-accessible)
- `AUTH_*` → Auth service
- `TAG_WRITER_*` → Tag writer service
- `UPLOAD_*` → Upload service
- No prefix → Shared/backend only

### Security Notes

⚠️ **NEVER commit `.env` file to git!**

- Contains passwords and API keys
- Already in `.gitignore`
- Use environment variables in production
- Rotate credentials if exposed

---

## Troubleshooting

### Supabase Issues

**Comments not persisting:**
1. Check browser console (F12) for errors
2. Verify `.env` has correct Supabase credentials
3. Restart dev server after changing `.env`
4. Check Supabase **Logs** for errors

**"relation 'comments' does not exist":**
1. Database schema wasn't run
2. Go to SQL Editor in Supabase
3. Run `database/MASTER_SCHEMA.sql` again

**RLS policy errors:**
1. Ensure user is authenticated
2. Check policies in **Authentication** → **Policies**
3. Verify `auth.uid()` is working

### Service Connection Issues

**Cannot connect to auth service:**
- Ensure auth service is running: `npm run dev:auth`
- Check port 3005 is available: `lsof -i :3005`
- Verify `VITE_ACCOUNT_API_URL` in `.env`

**Tag writer not updating files:**
- Check `TAG_WRITER_MUSIC_PATH` matches Navidrome path
- Verify file permissions (read/write access)
- Check Navidrome credentials are correct

**Upload service not working:**
- Verify `UPLOAD_MUSIC_PATH` is correct
- Check Navidrome has read/write permissions
- Ensure temp directory `/tmp/uploads` is writable

### Railway Deployment Issues

**Services not connecting:**
1. Check all environment variables are set
2. Verify service references use `${{SERVICE.RAILWAY_PUBLIC_DOMAIN}}`
3. Check service logs for errors
4. Ensure CORS origins include Railway domains

**Build failures:**
1. Check build logs for specific errors
2. Verify `package.json` scripts are correct
3. Ensure all dependencies are in `package.json`
4. Check Node.js version compatibility

**Volume/storage issues:**
1. Verify volume is mounted to correct path
2. Check volume size is sufficient
3. Ensure services share same volume (Tag Writer & Upload)

### YouTube Integration Issues

**"Invalid API key":**
- Verify key in `.env` is correct
- Check API key restrictions (HTTP referrers)
- Ensure YouTube Data API v3 is enabled
- Check API key hasn't expired

**Videos not loading:**
- Check browser console for errors
- Verify API quota hasn't been exceeded
- Clear browser cache and try again
- Check network tab for failed requests

**Quota exceeded:**
1. Check usage in Google Cloud Console
2. Wait for quota to reset (daily)
3. Request quota increase (free)
4. Enable caching to reduce usage

### General Issues

**Port already in use:**
```bash
# Find process using port
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows
```

**Dependencies not installing:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**Environment variables not loading:**
1. Verify `.env` exists: `ls -la .env`
2. Check for typos in variable names
3. No spaces around `=` signs
4. Quote values with spaces: `PATH="/my path/music"`
5. Restart all services after changes

### Getting Help

- **Supabase**: [docs.supabase.com](https://docs.supabase.com)
- **Railway**: [docs.railway.app](https://docs.railway.app)
- **YouTube API**: [developers.google.com/youtube](https://developers.google.com/youtube)
- **GitHub Issues**: Report bugs on repository

---

## Next Steps

After completing setup:

1. ✅ Test all features in development
2. ✅ Configure user authentication
3. ✅ Set up production deployment
4. ✅ Configure custom domain (optional)
5. ✅ Enable monitoring and logging
6. ✅ Set up backups (Supabase automatic)
7. ✅ Customize branding and UI

---

**Setup complete!** 🎉 You now have a fully functional music streaming platform with social features.
