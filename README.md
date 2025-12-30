# yedits.net - Complete Documentation

*A modern music streaming platform combining Navidrome backend with advanced features including user registration, music upload, metadata editing, YouTube integration, and social features.*

---

## 📑 Table of Contents

1. [Quick Start](#-quick-start)
2. [Features](#-features)
3. [Installation](#-installation)
4. [Configuration](#-configuration)
5. [Supabase Setup](#-supabase-setup)
6. [Railway Deployment](#-railway-deployment)
7. [YouTube Integration](#-youtube-integration)
8. [Service APIs](#-service-apis)
9. [Development](#-development)
10. [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start

### One Command Development

```bash
# 1. Install all dependencies
npm install
cd auth-service && npm install && cd ..
cd tag-writer-service && npm install && cd ..
cd upload-service && npm install && cd ..

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Start everything
npm run dev
```

**Services running:**
- **Main App**: http://localhost:3000 (Blue)
- **Tag Writer**: http://localhost:3001 (Yellow)
- **Upload Service**: http://localhost:3002 (Green)
- **Auth Service**: http://localhost:3005 (Magenta)

---

## ✨ Features

### Core Features
- 🎵 Modern web and desktop client for Navidrome
- 👤 Self-service user registration
- 🎨 Dark/light theme support
- 📱 Responsive design for all devices
- 📻 Internet radio streaming
- 🎹 Comprehensive playlist management
- 🔍 Advanced search and filtering
- ⌨️ Keyboard shortcuts

### User Registration (Auth Service)
- ✅ Self-service account creation
- ✅ Creates users directly in Navidrome
- ✅ Username and email validation
- ✅ Password strength requirements (8+ characters)
- ✅ Duplicate username detection

### Music Metadata Editor (Tag Writer Service)
- ✅ Write ID3v2.4 tags to MP3 files
- ✅ Update all metadata fields
- ✅ Update cover art (JPEG, PNG, WebP)
- ✅ Automatic Navidrome library rescan
- ✅ CORS support for frontend integration

### Music Upload System
- 📤 Drag and drop file upload
- 🏷️ Automatic metadata detection from ID3 tags
- ✏️ In-browser metadata editor
- 📦 Batch upload support
- 📊 Real-time upload progress
- 📁 Automatic file organization (Artist/Album)
- 🎼 Supports: MP3, FLAC, M4A, OGG, OPUS, WAV, AAC

### YouTube Integration
- 🎥 Browse channel videos and playlists
- 🔍 Advanced search and filtering
- 📊 Statistics dashboard
- 🖥️ Split-screen video player
- 💬 Threaded comments
- ⚡ Smart caching (1-hour)

### Social Features (Supabase)
- 👤 User profiles with avatars and bios
- 💬 Comments on tracks/albums (with nested replies)
- ⭐ Ratings (5-star and thumbs up/down)
- 🎭 Edit credits for editors, remixers, producers
- 📋 Collaborative playlists
- ❤️ Favorites tracking
- 📈 Listening history

---

## 📦 Installation

### Prerequisites
- Node.js 16+ and npm
- A running Navidrome server
- Admin access to Navidrome
- Supabase account (free tier)
- Google Cloud account (for YouTube features)

### Setup Steps

1. **Clone repository:**
```bash
git clone https://github.com/onyxdagoat1/aonsoku-fork.git
cd aonsoku-fork
```

2. **Install dependencies:**
```bash
npm install
cd auth-service && npm install && cd ..
cd tag-writer-service && npm install && cd ..
cd upload-service && npm install && cd ..
```

3. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your settings (see Configuration section)
```

---

## ⚙️ Configuration

### Single .env File System

**IMPORTANT:** Only ONE `.env` file at the root. Never create `.env` files in service directories.

```
aonsoku-fork/
  .env                    <-- Configure this file
  .env.example            <-- Template
  auth-service/
    .env.loader.cjs       <-- Reads from parent
  tag-writer-service/
    .env.loader.cjs       <-- Reads from parent
  upload-service/
    .env.loader.cjs       <-- Reads from parent
```

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
VITE_YOUTUBE_OAUTH_CLIENT_ID=your_client_id
VITE_YOUTUBE_OAUTH_CLIENT_SECRET=your_client_secret

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

---

## 🗄️ Supabase Setup

### Why Supabase?

Provides user authentication, profiles, comments, playlists, favorites, and real-time features with built-in security.

### Step 1: Create Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in with GitHub
3. Click **New Project**
4. Fill in:
   - **Name**: `aonsoku`
   - **Database Password**: Strong password (save it!)
   - **Region**: Closest to users
5. Click **Create** (takes ~2 minutes)

### Step 2: Get API Credentials

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key

### Step 3: Configure .env

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Create Database Schema

1. In Supabase Dashboard, click **SQL Editor**
2. Click **New Query**
3. Copy contents of `supabase/schema.sql` from your project
4. Paste and click **Run**
5. Verify: "Success. No rows returned"

### Tables Created

- `profiles` - User profiles with Navidrome integration
- `comments` - Comments on tracks/albums/artists
- `comment_reactions` - Reactions to comments
- `playlists` - User playlists
- `playlist_songs` - Playlist contents
- `playlist_collaborators` - Sharing
- `favorites` - Favorite tracks
- `listening_history` - Play tracking

### Step 5: Enable OAuth Providers (Optional)

#### Google OAuth
1. [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth client ID (Web application)
3. Add redirect: `https://your-project.supabase.co/auth/v1/callback`
4. In Supabase: **Authentication** → **Providers** → Enable **Google**

#### Discord OAuth
1. [Discord Developer Portal](https://discord.com/developers/applications)
2. Create New Application
3. Add redirect: `https://your-project.supabase.co/auth/v1/callback`
4. In Supabase: Enable **Discord**

---

## 🚂 Railway Deployment

### Architecture

Deploy 5 services:
1. **Navidrome** - Music server backend
2. **Auth Service** - User registration
3. **Tag Writer Service** - Metadata editing
4. **Upload Service** - Music file uploads
5. **Frontend** - Main web app

### Step 1: Deploy Navidrome

1. **+ New Service** → **Empty Service**
2. **Docker Image**: `deluan/navidrome:latest`
3. **Variables:**
   ```env
   ND_SCANSCHEDULE=1m
   ND_LOGLEVEL=info
   ND_PORT=4533
   ```
4. **Storage** → Add volumes:
   - `navidrome-data` → `/data` (1GB)
   - `music-library` → `/music` (10GB+)
5. **Generate Domain** → Save URL
6. Visit URL and create admin account

### Step 2: Deploy Upload Service

1. **+ New Service** → **GitHub Repo**
2. Select: `onyxdagoat1/aonsoku-fork`, Branch: `testing`
3. **Root Directory**: `/upload-service`
4. **Variables:**
   ```env
   NAVIDROME_URL=https://your-navidrome.up.railway.app
   NAVIDROME_USERNAME=admin
   NAVIDROME_PASSWORD=your_password
   MUSIC_LIBRARY_PATH=/music
   PORT=3002
   NODE_ENV=production
   ```
5. **Mount Volume**: Select `music-library` → `/music`
6. **Add Volume**: `temp-uploads` → `/tmp/uploads` (5GB)
7. **Generate Domain** → Save URL

### Step 3: Deploy Tag Writer Service

1. **+ New Service** → **GitHub Repo**
2. **Root Directory**: `/tag-writer-service`
3. **Variables:**
   ```env
   NAVIDROME_URL=https://your-navidrome.up.railway.app
   NAVIDROME_USERNAME=admin
   NAVIDROME_PASSWORD=your_password
   MUSIC_LIBRARY_PATH=/music
   PORT=3001
   NODE_ENV=production
   ```
4. **Mount Volume**: Select `music-library` → `/music`
5. **Generate Domain** → Save URL

### Step 4: Deploy Auth Service

1. **+ New Service** → **GitHub Repo**
2. **Root Directory**: `/auth-service`
3. **Variables:**
   ```env
   NAVIDROME_URL=https://your-navidrome.up.railway.app
   NAVIDROME_USERNAME=admin
   NAVIDROME_PASSWORD=your_password
   PORT=3005
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend.up.railway.app
   ```
4. **Generate Domain** → Save URL

### Step 5: Deploy Frontend

1. **+ New Service** → **GitHub Repo**
2. **Root Directory**: Leave **empty**
3. **Variables:**
   ```env
   NODE_ENV=production
   VITE_API_URL=https://your-navidrome.up.railway.app
   SERVER_URL=https://your-navidrome.up.railway.app
   VITE_TAG_WRITER_SERVICE_URL=https://your-tag-writer.up.railway.app
   VITE_UPLOAD_SERVICE_URL=https://your-upload.up.railway.app
   VITE_ACCOUNT_API_URL=https://your-auth.up.railway.app/api
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. **Custom Start Command**: `nginx -g 'daemon off;'`
5. **Generate Domain** → Main app URL

### Step 6: Update CORS

Update these services with frontend URL:
- **Auth**: `FRONTEND_URL=https://your-frontend.up.railway.app`
- **Tag Writer**: `CORS_ORIGINS=https://your-frontend.up.railway.app`
- **Upload**: `CORS_ORIGINS=https://your-frontend.up.railway.app`

Restart each service after updating.

---

## 🎥 YouTube Integration

### Features

- Browse YouTube channel videos
- Advanced search/filtering
- Sort by date, views, likes, duration
- Statistics dashboard
- Split-screen video player
- Threaded comments
- Smart caching (saves 90% API quota)

### Step 1: Create API Key

1. [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project
3. Enable **YouTube Data API v3**
4. Create **API Key** in Credentials

### Step 2: Restrict API Key

**Application restrictions:**
- Select **HTTP referrers**
- Add: `http://localhost:*`, `https://yourdomain.com/*`

**API restrictions:**
- Select **Restrict key**
- Check only: **YouTube Data API v3**

### Step 3: Configure .env

```env
VITE_YOUTUBE_API_KEY=your_api_key_here
```

### YouTube OAuth (Optional)

For authenticated features (like videos, post comments, manage playlists):

#### Step 1: Configure OAuth Consent Screen

1. **OAuth consent screen** → **External**
2. Fill in app name and emails
3. **Scopes** → Add:
   - `https://www.googleapis.com/auth/youtube.readonly`
   - `https://www.googleapis.com/auth/youtube.force-ssl`
   - `https://www.googleapis.com/auth/youtubepartner`
4. **Test users** → Add your Google email

#### Step 2: Create OAuth Client ID

1. **Credentials** → **OAuth client ID** → **Web application**
2. **Authorized redirect URIs**:
   - `http://localhost:3000/#/youtube/callback`
   - `https://yourdomain.com/#/youtube/callback`
3. Copy **Client ID** and **Client Secret**

#### Step 3: Configure .env

```env
VITE_YOUTUBE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_YOUTUBE_OAUTH_CLIENT_SECRET=your-client-secret
```

### API Quota

- **Free quota**: 10,000 units/day
- **Typical page load**: ~104 units
- **With caching**: ~240 loads/day
- **Completely free** - no charges

### Quota Costs

| Operation | Cost |
|-----------|------|
| Channel Info | 3 units |
| List Videos | 100 units |
| Video Details | 1 unit |
| Comments | 1 unit |
| Search | 100 units |

---

## 🔌 Service APIs

### Auth Service API

**Base URL**: `http://localhost:3005`

#### Register New User
**POST** `/api/auth/register`

```json
{
  "username": "newuser",
  "password": "securepass123",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "username": "newuser",
    "email": "user@example.com"
  }
}
```

#### Health Check
**GET** `/api/health`

### Tag Writer Service API

**Base URL**: `http://localhost:3001`

#### Update Song Metadata
**POST** `/api/update-tags`

```json
{
  "songId": "navidrome-song-id",
  "metadata": {
    "title": "New Title",
    "artist": "New Artist",
    "album": "New Album",
    "year": 2025,
    "genre": "Rock",
    "track": 1
  }
}
```

#### Update Cover Art
**POST** `/api/update-cover-art`

**Form Data:**
- `songId`: Navidrome song ID
- `coverArt`: Image file (JPEG, PNG, WebP)

#### Get Current Tags
**GET** `/api/get-tags/:songId`

#### Trigger Rescan
**POST** `/api/rescan`

---

## 👨‍💻 Development

### Available Commands

```bash
# Development
npm run dev              # Run all services
npm run dev:frontend     # Just main app
npm run dev:auth         # Just auth service
npm run dev:tag-writer   # Just tag writer
npm run dev:upload       # Just upload service

# Building
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run linter
npm run lint:fix         # Fix linting issues

# Desktop App
npm run electron:dev     # Start electron in dev mode
npm run electron:build   # Build electron app
```

### Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Desktop**: Electron
- **Backend**: Node.js, Express
- **Tag Writing**: node-id3
- **Database**: Supabase (PostgreSQL)

### Port Allocation

| Service | Port | Color |
|---------|------|-------|
| Main App | 3000 | Blue |
| Tag Writer | 3001 | Yellow |
| Upload | 3002 | Green |
| Auth | 3005 | Magenta |
| Navidrome | 4533 | External |

---

## 🔧 Troubleshooting

### Services Won't Start

**Check if ports are in use:**
```bash
# Linux/Mac
lsof -i :3000,3001,3002,3005

# Windows
netstat -ano | findstr :3000
```

**Run services individually:**
```bash
npm run dev:frontend
npm run dev:auth
npm run dev:tag-writer
npm run dev:upload
```

### Registration Issues

**"Cannot connect to auth service":**
- Ensure auth service running: `npm run dev:auth`
- Check port 3005: `lsof -i :3005`
- Verify `VITE_ACCOUNT_API_URL` in `.env`

**"Failed to authenticate with Navidrome":**
- Check `NAVIDROME_USERNAME` and `NAVIDROME_PASSWORD`
- Verify admin account exists
- Test: `curl http://localhost:3005/api/health`

### Supabase Issues

**Comments not persisting:**
1. Check browser console (F12)
2. Verify `.env` has correct Supabase credentials
3. Restart dev server after changing `.env`
4. Check Supabase **Logs** for errors

**"relation 'comments' does not exist":**
1. Database schema wasn't run
2. Go to SQL Editor in Supabase
3. Run database schema again

### Tag Writer Issues

**"Music file not found":**
- Check `TAG_WRITER_MUSIC_PATH` is correct
- Verify path matches Navidrome's music folder
- Ensure service has read/write permissions

**Tags not updating:**
- Wait for rescan to complete
- Check file permissions
- Manually trigger rescan in Navidrome

### Upload Service Issues

**Files not appearing:**
- Verify `UPLOAD_MUSIC_PATH` matches Navidrome
- Check Navidrome has read/write permissions
- Manually trigger scan

### YouTube Integration

**"Invalid API key":**
- Verify key in `.env` correct
- Check YouTube Data API v3 enabled
- Ensure API key restrictions match domain

**Videos not loading:**
- Check browser console
- Verify API quota not exceeded
- Clear browser cache

**Quota exceeded:**
1. Check usage in Google Cloud Console
2. Wait for quota reset (daily)
3. Request quota increase (free)
4. Enable caching

### Railway Deployment

**Services not connecting:**
1. Check all environment variables set
2. Verify service URLs correct
3. Check service logs for errors
4. Ensure CORS origins include Railway domains

**Build failures:**
1. Check build logs
2. Verify `package.json` scripts
3. Ensure all dependencies listed

### Environment Variables

**Variables not loading:**
1. Verify `.env` exists: `ls -la .env`
2. Check for typos
3. No spaces around `=` signs
4. Quote values with spaces
5. Restart all services after changes

### CORS Errors

Update CORS origins in `.env`:
```env
TAG_WRITER_CORS_ORIGINS=http://localhost:3000
AUTH_FRONTEND_URL=http://localhost:3000
```

---

## 🐳 Docker Deployment

### Complete Docker Compose

```yaml
services:
  navidrome:
    image: deluan/navidrome:latest
    ports:
      - "4533:4533"
    volumes:
      - ./data:/data
      - /path/to/music:/music
    environment:
      ND_SCANSCHEDULE: "@every 1m"
  
  auth-service:
    build: ./auth-service
    ports:
      - "3005:3005"
    environment:
      - NAVIDROME_URL=http://navidrome:4533
      - NAVIDROME_USERNAME=admin
      - NAVIDROME_PASSWORD=yourpassword
      - FRONTEND_URL=http://localhost:3000
    depends_on:
      - navidrome
  
  tag-writer:
    build: ./tag-writer-service
    ports:
      - "3001:3001"
    volumes:
      - /path/to/music:/music
    environment:
      - NAVIDROME_URL=http://navidrome:4533
      - MUSIC_LIBRARY_PATH=/music
      - CORS_ORIGINS=http://localhost:3000
    depends_on:
      - navidrome
  
  upload-service:
    build: ./upload-service
    ports:
      - "3002:3002"
    volumes:
      - /path/to/music:/music
      - /tmp/uploads:/tmp/uploads
    environment:
      - NAVIDROME_URL=http://navidrome:4533
      - MUSIC_LIBRARY_PATH=/music
    depends_on:
      - navidrome
  
  yedits-net:
    image: ghcr.io/onyxdagoat1/yedits-net:latest
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=http://navidrome:4533
      - VITE_TAG_WRITER_SERVICE_URL=http://tag-writer:3001
      - VITE_UPLOAD_SERVICE_URL=http://upload-service:3002
      - VITE_ACCOUNT_API_URL=http://auth-service:3005/api
    depends_on:
      - navidrome
      - auth-service
      - tag-writer
      - upload-service
```

---

## 🍎 macOS Users

### "App cannot be opened" Error

Since the app is not signed by Apple:

1. Move to `/Applications`
2. Open Terminal:
```bash
# Remove quarantine
sudo xattr -cr /Applications/yedits.net.app

# Re-sign locally
sudo codesign --force --deep --sign - /Applications/yedits.net.app
```
3. Launch normally

---

## 🔒 Security Notes

**Never commit your .env file!** It contains:
- Passwords
- API keys
- Sensitive configuration

The `.gitignore` prevents this, but verify:
```bash
git status  # Should NOT show .env
```

**Rotate credentials if exposed:**
- YouTube API key
- Navidrome admin password
- Supabase keys

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Navidrome Documentation](https://www.navidrome.org/docs/)
- [YouTube Data API](https://developers.google.com/youtube/v3)
- [Railway Documentation](https://docs.railway.app)
- [OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)

---

## 📄 License

MIT License - see [LICENSE.txt](LICENSE.txt)

---

## 🙏 Credits

- Integrates with [Navidrome](https://www.navidrome.org/)
- Uses [music-metadata](https://github.com/Borewit/music-metadata)
- Uses [node-id3](https://github.com/Zazama/node-id3)
- YouTube integration via [YouTube Data API v3](https://developers.google.com/youtube/v3)

---

## 🔗 Repository

**GitHub**: https://github.com/onyxdagoat1/aonsoku-fork

**Issues**: https://github.com/onyxdagoat1/aonsoku-fork/issues

---

**Setup complete!** 🎉 You now have a fully functional music streaming platform with social features.