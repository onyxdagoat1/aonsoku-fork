# Aonsoku Authentication Service

Comprehensive authentication and user management service for Aonsoku with OAuth support, user profiles, comments, and social features.

## Features

- ✅ **User Authentication**
  - Email/password registration and login
  - JWT token-based authentication
  - Refresh tokens for extended sessions
  - Password reset functionality

- ✅ **OAuth Integration**
  - Google OAuth 2.0 (for YouTube integration)
  - Discord OAuth 2.0
  - Account linking (connect multiple OAuth providers)

- ✅ **User Profiles**
  - Customizable profiles with bio, location, avatar
  - Editor credits and roles
  - Personal statistics and listening history

- ✅ **Social Features**
  - Comments on songs and albums
  - Reply threads
  - Like/unlike comments
  - Follow/unfollow users

- ✅ **Playlist Sharing**
  - Share Navidrome playlists publicly
  - Generate unique share links
  - Track playlist views and shares

- ✅ **Activity Tracking**
  - Play count tracking
  - Listening time statistics
  - User wrapped/stats generation

## Prerequisites

- Node.js 18 or higher
- PostgreSQL 14+ (production) or SQLite (development)
- Navidrome instance running

## Installation

```bash
cd auth-service
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Update `.env` with your configuration:

### Required Settings

- `JWT_SECRET`: Strong random string for JWT signing
- `SESSION_SECRET`: Strong random string for session encryption
- `NAVIDROME_URL`: Your Navidrome server URL
- `NAVIDROME_USERNAME/PASSWORD`: Navidrome credentials

### OAuth Setup

#### Google OAuth (for YouTube Integration)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3002/api/v1/auth/google/callback`
6. Copy Client ID and Secret to `.env`

#### Discord OAuth

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to OAuth2 settings
4. Add redirect URI: `http://localhost:3002/api/v1/auth/discord/callback`
5. Copy Client ID and Secret to `.env`

## Database Setup

### Development (SQLite)

```bash
npm run migrate
```

### Production (PostgreSQL)

1. Create database:

```sql
CREATE DATABASE aonsoku_auth;
```

2. Update `.env` with PostgreSQL credentials

3. Run migrations:

```bash
npm run migrate
```

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

The service will start on `http://localhost:3002`

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login with email/password
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/google` - Initiate Google OAuth
- `GET /api/v1/auth/google/callback` - Google OAuth callback
- `GET /api/v1/auth/discord` - Initiate Discord OAuth
- `GET /api/v1/auth/discord/callback` - Discord OAuth callback

### User Profile

- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update profile
- `GET /api/v1/users/:id` - Get user by ID
- `GET /api/v1/users/:id/stats` - Get user statistics

### Comments

- `POST /api/v1/comments` - Create comment
- `GET /api/v1/comments/song/:songId` - Get song comments
- `GET /api/v1/comments/album/:albumId` - Get album comments
- `PUT /api/v1/comments/:id` - Update comment
- `DELETE /api/v1/comments/:id` - Delete comment
- `POST /api/v1/comments/:id/like` - Like comment

### Editor Credits

- `POST /api/v1/credits` - Add editor credit
- `GET /api/v1/credits/song/:songId` - Get song credits
- `GET /api/v1/credits/user/:userId` - Get user credits

### Playlist Sharing

- `POST /api/v1/playlists/share` - Share playlist
- `GET /api/v1/playlists/shared/:token` - Get shared playlist
- `GET /api/v1/playlists/user/:userId` - Get user playlists

### Activity Tracking

- `POST /api/v1/activity/play` - Record song play
- `GET /api/v1/activity/stats` - Get user stats
- `GET /api/v1/activity/wrapped/:year` - Get yearly wrapped

## Security Features

- Password hashing with bcrypt (10 rounds)
- JWT tokens with httpOnly cookies
- CSRF protection
- Rate limiting (100 requests per 15 minutes)
- Helmet.js security headers
- SQL injection prevention
- XSS protection

## Integration with Frontend

### Authentication Flow

```javascript
// 1. Register/Login
const response = await fetch('http://localhost:3002/api/v1/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

// JWT token is automatically stored in httpOnly cookie

// 2. Make authenticated requests
const profile = await fetch('http://localhost:3002/api/v1/users/me', {
  credentials: 'include'
});

// 3. OAuth Login
window.location.href = 'http://localhost:3002/api/v1/auth/google';
// User is redirected back with authentication cookie
```

## Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3002

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t aonsoku-auth .
docker run -d \
  -p 3002:3002 \
  --env-file .env \
  --name aonsoku-auth \
  aonsoku-auth
```

## Troubleshooting

### OAuth Errors

- Ensure redirect URIs match exactly in OAuth provider settings
- Check client ID and secret are correct
- Verify callback URLs are accessible

### Database Errors

- Run migrations: `npm run migrate`
- Check database connection settings
- Ensure database exists (PostgreSQL)

### JWT Errors

- Verify JWT_SECRET is set and consistent
- Check token expiry settings
- Clear cookies if getting invalid token errors

## License

MIT