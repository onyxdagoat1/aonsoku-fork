# Yedits.net Setup Guide

Complete setup guide for Yedits.net music streaming platform with social features.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup (Supabase)](#database-setup-supabase)
4. [Authentication Setup](#authentication-setup)
5. [Navidrome Integration](#navidrome-integration)
6. [YouTube Integration](#youtube-integration)
7. [Backend Services](#backend-services)
8. [Running the Application](#running-the-application)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 16+ and npm/pnpm
- A running Navidrome server
- Supabase account (free tier works)
- Google Cloud Console account (for YouTube features)
- Admin access to Navidrome (for user registration)

## Environment Setup

Create a `.env` file in the root directory with the following variables:

### Frontend (.env)

```env
# Supabase Configuration (Required for social features)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Navidrome Configuration
VITE_API_URL=http://localhost:4533

# Backend API
VITE_BACKEND_URL=http://localhost:3001

# YouTube OAuth (Optional - for YouTube features)
VITE_YOUTUBE_OAUTH_CLIENT_ID=your_youtube_client_id
VITE_YOUTUBE_OAUTH_CLIENT_SECRET=your_youtube_client_secret
VITE_YOUTUBE_API_KEY=your_youtube_api_key

# Auth Service (for Navidrome account creation)
VITE_ACCOUNT_API_URL=http://localhost:3005/api
```

### Backend (.env in backend/ folder)

```env
# Supabase (for admin API)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# OR if you only have anon key:
SUPABASE_ANON_KEY=your_anon_key

# Navidrome
NAVIDROME_URL=http://localhost:4533
NAVIDROME_USERNAME=admin
NAVIDROME_PASSWORD=your_password
MUSIC_LIBRARY_PATH=/path/to/your/music

# Server
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### Auth Service (.env in auth-service/ folder)

```env
NAVIDROME_URL=http://localhost:4533
NAVIDROME_ADMIN_USER=admin
NAVIDROME_ADMIN_PASSWORD=your_password
PORT=3005
```

## Database Setup (Supabase)

1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor
3. Run the contents of `supabase/setup.sql` to create all tables, policies, and triggers
4. Verify tables are created in the Table Editor

### Key Tables Created

- `profiles` - User profiles with Navidrome integration
- `comments` - Comments on tracks, albums, artists
- `ratings` - 5-star and thumbs up/down ratings
- `edit_credits` - Credits for editors, remixers, etc.
- `playlists` - User playlists
- `favorites` - User favorites
- `listening_history` - Play history

## Authentication Setup

### Supabase OAuth Providers

1. Go to Supabase Dashboard > Authentication > Providers
2. Enable desired providers (Google, Discord, GitHub)
3. Configure OAuth credentials for each provider
4. Set redirect URLs to: `http://localhost:3001/auth/callback`

### Login Flow

The application supports two login methods:

1. **Direct Navidrome Login**: Username/password directly to Navidrome (for testing)
2. **Supabase OAuth**: Google, Discord, or GitHub login that automatically creates Navidrome accounts

After OAuth login, the system:
- Creates a Supabase user profile
- Creates a Navidrome account automatically
- Stores credentials securely
- Auto-connects to Navidrome

## Navidrome Integration

### Automatic Account Creation

When users sign up via OAuth:
1. A Navidrome account is created via the auth service
2. Credentials are stored in Supabase profile table
3. User is automatically logged into Navidrome

### Manual Account Creation

For testing, you can login directly with Navidrome credentials at `/server-config`.

## YouTube Integration

### Setup YouTube OAuth

1. Go to Google Cloud Console
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3001/youtube/callback`
6. Copy Client ID and Secret to `.env`

### YouTube Features

- Import YouTube playlists
- Like/dislike videos
- Comment on videos (uses Supabase comments)
- Add videos to playlists
- Subscribe to channels

## Backend Services

### Start Backend Server

```bash
cd backend
npm install
npm start
```

The backend provides:
- Admin API endpoints (user management)
- Tag writing service
- Health checks

### Start Auth Service

```bash
cd auth-service
npm install
npm start
```

The auth service handles:
- Navidrome user creation
- OAuth callback processing
- Password management

## Running the Application

1. Install dependencies:
```bash
npm install
# or
pnpm install
```

2. Start development server:
```bash
npm run dev
```

3. Access the application:
- Frontend: http://localhost:3001
- Backend: http://localhost:3001 (if using proxy)
- Navidrome: http://localhost:4533

## Features

### Social Features

- **User Profiles**: Bio, avatar, display name
- **Comments**: Per-track/album comment threads with reactions
- **Ratings**: 5-star and thumbs up/down ratings
- **Edit Credits**: Credit editors, remixers, producers
- **Playlists**: Create and share playlists
- **Favorites**: Save favorite tracks
- **Listening History**: Track play history

### Admin Panel

Access at `/admin` (admin users only):
- User management
- Comment moderation
- Promote users to admin/yeditor

### Profile Page

Access at `/profile`:
- Edit bio and avatar
- View stats (ratings, comments, credits)
- Account settings

## Troubleshooting

### OAuth Login Error: "Database error saving new user"

**Solution**: Run the database setup SQL again. The trigger function might have an error. Check Supabase logs for details.

### YouTube OAuth: "Missing required parameter: client_id"

**Solution**: Ensure `VITE_YOUTUBE_OAUTH_CLIENT_ID` is set in your `.env` file and restart the dev server.

### Comments Not Showing

**Solution**: 
1. Verify Supabase is configured
2. Check user is logged in
3. Verify database tables exist
4. Check browser console for errors

### Admin Panel Can't Load Users

**Solution**:
1. Ensure backend server is running
2. Set `VITE_BACKEND_URL` in frontend `.env`
3. Verify Supabase credentials in backend `.env`
4. Check backend logs for errors

### Navidrome Auto-Login Not Working

**Solution**:
1. Check auth service is running
2. Verify `VITE_ACCOUNT_API_URL` is correct
3. Check Navidrome credentials in profile table
4. Verify Navidrome server is accessible

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Navidrome Documentation](https://www.navidrome.org/docs/)
- [YouTube Data API](https://developers.google.com/youtube/v3)
