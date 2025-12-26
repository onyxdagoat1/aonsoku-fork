# Aonsoku Auth Service

Authentication and user management service for Aonsoku with OAuth support.

## Features

- ✅ JWT-based authentication
- ✅ Email/password registration and login
- ✅ Google OAuth 2.0 (for YouTube integration)
- ✅ Discord OAuth 2.0
- ✅ User profiles with avatars
- ✅ Editor credits system
- ✅ Comments on songs/albums
- ✅ Playlist sharing
- ✅ User activity tracking
- ✅ Rate limiting and security

## Quick Start

### 1. Install Dependencies

```bash
cd auth-service
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Initialize Database

```bash
npm run migrate
```

### 4. Start Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The service will start on `http://localhost:3002`

## OAuth Setup

### Google OAuth (for YouTube integration)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3002/api/auth/google/callback`
6. Copy Client ID and Secret to `.env`

### Discord OAuth

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to OAuth2 section
4. Add redirect URI: `http://localhost:3002/api/auth/discord/callback`
5. Copy Client ID and Secret to `.env`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user
- `GET /api/auth/google` - Start Google OAuth flow
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/discord` - Start Discord OAuth flow
- `GET /api/auth/discord/callback` - Discord OAuth callback

### User Profiles

- `GET /api/users/:id` - Get user profile
- `PUT /api/users/profile` - Update own profile
- `GET /api/users/:id/stats` - Get user statistics

### Comments

- `GET /api/comments/song/:songId` - Get comments for song
- `GET /api/comments/album/:albumId` - Get comments for album
- `POST /api/comments` - Create comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

### Editor Credits

- `GET /api/credits/song/:songId` - Get credits for song
- `POST /api/credits` - Add credit
- `PUT /api/credits/:id` - Update credit
- `DELETE /api/credits/:id` - Delete credit

### Playlist Sharing

- `GET /api/playlists/shared` - Get public playlists
- `POST /api/playlists/share` - Share playlist
- `GET /api/playlists/share/:token` - Get shared playlist
- `DELETE /api/playlists/share/:id` - Unshare playlist

## Database Schema

See `db/schema.sql` for complete database structure.

## Security Features

- Password hashing with bcrypt
- JWT tokens with refresh mechanism
- HTTP-only secure cookies
- Rate limiting on auth endpoints
- CORS protection
- Helmet.js security headers
- SQL injection prevention
- XSS protection

## Development

### Database Migrations

```bash
npm run migrate
```

### Seed Test Data

```bash
npm run seed
```

## Production Deployment

### Using PostgreSQL

1. Update `.env`:
```env
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

2. Run migrations:
```bash
npm run migrate
```

### Using Docker

```bash
docker build -t aonsoku-auth .
docker run -d \
  -p 3002:3002 \
  -e DATABASE_TYPE=postgres \
  -e DATABASE_URL=postgresql://... \
  --name aonsoku-auth \
  aonsoku-auth
```

## Environment Variables

See `.env.example` for all available configuration options.

## License

MIT
