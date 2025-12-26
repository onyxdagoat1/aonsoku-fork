# Aonsoku Full Stack Setup Guide

Complete guide to setting up the Aonsoku music player with authentication, comments, editor credits, and social features.

## Architecture Overview

```
┌───────────────────┐
│   Frontend (React)   │
│   Port: 3000         │
└───────┬────────────┘
        │
    ┌───┼────────────────┐
    │   │                  │
┌───┴─────────┐  │  ┌────────────┐
│ Navidrome     │  │  │ Auth Service │
│ (Music API)   │  │  │ Port: 3002   │
│ Port: 4533    │  │  │              │
└───────────────┘  │  │ - Users      │
                   │  │ - OAuth      │
┌───────────────┐  │  │ - Comments   │
│ Tag Service   │  │  │ - Credits    │
│ Port: 3001    │  │  │ - Playlists  │
│               │  │  │ - Activity   │
│ - Write ID3   │  │  └─────┬───────┘
│ - Trigger scan│  │       │
└───────────────┘  │   ┌───┴──────────┐
                   └───┤ PostgreSQL    │
                       │ Port: 5432    │
                       └───────────────┘
```

## Prerequisites

- Docker & Docker Compose (recommended)
- OR Node.js 18+, PostgreSQL 14+, and Navidrome
- Music library with proper ID3 tags
- Google Cloud Console account (for Google OAuth - optional)
- Discord Developer account (for Discord OAuth - optional)

## Quick Start with Docker Compose

### 1. Clone and Configure

```bash
git clone https://github.com/onyxdagoat1/aonsoku-fork.git
cd aonsoku-fork
git checkout testing
```

### 2. Create Environment File

Create `.env` in the root directory:

```env
# Database
DB_PASSWORD=your-secure-password-here

# JWT Secrets (generate with: openssl rand -hex 32)
JWT_SECRET=your-jwt-secret-here
SESSION_SECRET=your-session-secret-here

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Navidrome Credentials
NAVIDROME_USERNAME=admin
NAVIDROME_PASSWORD=your-navidrome-password

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3002/api/v1/auth/google/callback

# Discord OAuth (optional)
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_CALLBACK_URL=http://localhost:3002/api/v1/auth/discord/callback
```

### 3. Set Up Music Library

Create a `music` directory and add your music files:

```bash
mkdir music
# Copy your music files to ./music/
```

### 4. Start All Services

```bash
docker-compose -f docker-compose-full-stack.yml up -d
```

This will start:
- **Frontend**: http://localhost:3000
- **Auth Service**: http://localhost:3002
- **Tag Service**: http://localhost:3001
- **Navidrome**: http://localhost:4533
- **PostgreSQL**: localhost:5432

### 5. Initial Setup

1. **Create Navidrome Admin Account**:
   - Visit http://localhost:4533
   - Create your admin account
   - Update `.env` with these credentials

2. **Create Auth Service Test User**:
   ```bash
   docker exec -it aonsoku-auth npm run seed
   ```
   - Test user: `admin@aonsoku.local` / `password123`

3. **Access Frontend**:
   - Visit http://localhost:3000
   - Register a new account or login

## Manual Installation (Development)

### 1. Install Navidrome

Follow [Navidrome installation guide](https://www.navidrome.org/docs/installation/)

### 2. Set Up PostgreSQL

```bash
# Install PostgreSQL
sudo apt install postgresql

# Create database
sudo -u postgres createdb aonsoku_auth
sudo -u postgres createuser aonsoku
sudo -u postgres psql -c "ALTER USER aonsoku WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE aonsoku_auth TO aonsoku;"
```

### 3. Install Auth Service

```bash
cd auth-service
npm install
cp .env.example .env
# Edit .env with your configuration
npm run migrate
npm run seed
npm run dev
```

### 4. Install Tag Service

```bash
cd backend
npm install
cp .env.example .env
# Edit .env
npm run dev
```

### 5. Install Frontend

```bash
npm install
npm run dev
```

## OAuth Setup

### Google OAuth (for YouTube Integration)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs:
   - `http://localhost:3002/api/v1/auth/google/callback`
   - (Add production URL when deploying)
7. Copy **Client ID** and **Client Secret** to `.env`

### Discord OAuth

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. **New Application** → Give it a name
3. Go to **OAuth2** settings
4. Add Redirects:
   - `http://localhost:3002/api/v1/auth/discord/callback`
   - (Add production URL when deploying)
5. Copy **Client ID** and **Client Secret** to `.env`

## Features Enabled

### ✅ User Accounts
- Email/password registration and login
- Google OAuth (ties to YouTube integration later)
- Discord OAuth
- JWT-based authentication with httpOnly cookies
- User profiles with avatars, bio, location

### ✅ Comments System
- Comment on songs and albums
- Reply threads
- Like/unlike comments
- Edit and delete own comments

### ✅ Editor Credits
- Add credits for mixer, mastering, producer, editor roles
- Display credits on song pages
- User profile shows all their credits

### ✅ Playlist Sharing
- Share Navidrome playlists publicly or privately
- Generate unique share links
- Track playlist views

### ✅ Activity Tracking
- Record every song play
- Track listening time
- Personal statistics
- Yearly wrapped (Spotify-style)

### ✅ Stats & Wrapped
- Total plays, listening time
- Top songs, artists, albums
- Unique songs/artists/albums count
- Year-specific wrapped data

## API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /register` - Register new user
- `POST /login` - Login
- `POST /logout` - Logout
- `GET /google` - Google OAuth
- `GET /discord` - Discord OAuth
- `POST /refresh` - Refresh JWT token
- `GET /me` - Get current user

### Users (`/api/v1/users`)
- `GET /:id` - Get user profile
- `GET /me` - Get own profile
- `PUT /me` - Update profile
- `GET /:id/stats` - Get user stats
- `GET /:id/top-songs` - Get top songs

### Comments (`/api/v1/comments`)
- `POST /` - Create comment
- `GET /song/:songId` - Get song comments
- `GET /album/:albumId` - Get album comments
- `PUT /:id` - Update comment
- `DELETE /:id` - Delete comment
- `POST /:id/like` - Like comment
- `DELETE /:id/like` - Unlike comment

### Credits (`/api/v1/credits`)
- `POST /` - Create credit
- `GET /song/:songId` - Get song credits
- `GET /user/:userId` - Get user credits
- `DELETE /:id` - Delete credit

### Playlists (`/api/v1/playlists`)
- `POST /share` - Share playlist
- `GET /shared/:token` - Get shared playlist
- `GET /user/:userId` - Get user playlists
- `GET /public` - Get public playlists
- `PUT /:id` - Update playlist
- `DELETE /:id` - Delete playlist

### Activity (`/api/v1/activity`)
- `POST /play` - Record song play
- `GET /stats` - Get user stats
- `GET /top-songs` - Get top songs
- `GET /recent` - Get recent plays
- `GET /wrapped/:year` - Get wrapped for year
- `GET /wrapped` - Get current year wrapped

## Production Deployment

### Security Checklist

- [ ] Change all default passwords
- [ ] Generate strong JWT_SECRET and SESSION_SECRET
- [ ] Use HTTPS (SSL certificates)
- [ ] Set NODE_ENV=production
- [ ] Enable CORS only for your domain
- [ ] Use secure PostgreSQL connection
- [ ] Regular database backups
- [ ] Update OAuth redirect URLs to production URLs
- [ ] Rate limiting configured appropriately
- [ ] Firewall rules configured

### Environment Variables for Production

```env
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/v1/auth/google/callback
DISCORD_CALLBACK_URL=https://yourdomain.com/api/v1/auth/discord/callback
```

## Troubleshooting

### Auth Service Won't Start
- Check PostgreSQL is running: `docker ps` or `systemctl status postgresql`
- Verify database credentials in `.env`
- Run migrations: `npm run migrate`

### OAuth Not Working
- Verify redirect URLs match exactly (including http/https)
- Check Client ID and Secret are correct
- Ensure OAuth provider credentials are in `.env`

### Comments Not Showing
- Check auth service is running on port 3002
- Verify frontend can reach auth service
- Check browser console for CORS errors

### Database Errors
- Run migrations: `cd auth-service && npm run migrate`
- Check PostgreSQL logs
- Verify database exists and user has permissions

## Next Steps

Now that you have the auth system set up, you can:

1. **Integrate with Frontend**: Update React components to use auth endpoints
2. **Add Comment UI**: Create comment components for songs/albums
3. **Build Profile Pages**: Display user profiles with stats and credits
4. **Implement Wrapped**: Create yearly wrapped visualization
5. **YouTube Integration**: Use Google OAuth tokens for YouTube API

## Support

For issues or questions:
- Check the auth-service README: `auth-service/README.md`
- Review API documentation above
- Check Docker logs: `docker-compose logs -f`

## License

MIT