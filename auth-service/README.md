# Aonsoku Auth Service

Authentication and user management service for Aonsoku with OAuth support.

## 🚀 Quick Start (5 Minutes)

See [QUICK_START.md](./QUICK_START.md) for the fastest way to get running!

## Features

- ✅ JWT-based authentication with refresh tokens
- ✅ Email/password registration and login
- ✅ Google OAuth 2.0 (for YouTube integration)
- ✅ Discord OAuth 2.0
- ✅ User profiles with avatars and bios
- ✅ Editor credits system
- ✅ Comments on songs/albums
- ✅ Playlist sharing with tokens
- ✅ User activity tracking for stats
- ✅ Rate limiting and security

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Get running in 5 minutes
- **[OAUTH_SETUP.md](./OAUTH_SETUP.md)** - Set up Google/Discord login (optional)
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup instructions
- **[FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)** - Integrate with React frontend

## Installation

```bash
cd auth-service
npm install
```

## Configuration

```bash
cp .env.example .env
# Edit .env with your settings
```

### Required Configuration

```env
# Server
PORT=3005
FRONTEND_URL=http://localhost:5173  # Your Aonsoku frontend URL

# JWT Secrets (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=<64-char-random-string>
JWT_REFRESH_SECRET=<64-char-random-string>
SESSION_SECRET=<64-char-random-string>

# Database (SQLite for dev, Postgres for prod)
DATABASE_TYPE=sqlite
DATABASE_PATH=./data/auth.db
```

### Optional: OAuth Configuration

OAuth is **not required**. Users can register with email/password.

To enable Google/Discord login, see [OAUTH_SETUP.md](./OAUTH_SETUP.md).

## Usage

### Development

```bash
npm run dev
```

Server starts on `http://localhost:3005`

### Production

```bash
npm start
```

### Test Installation

```bash
# Health check
curl http://localhost:3005/health

# Register a user
curl -X POST http://localhost:3005/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test1234"
  }'
```

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
- `DELETE /api/comments/:id` - Delete comment

## Database

**Development:** SQLite (file-based, auto-created)

**Production:** PostgreSQL (recommended)

Schemas provided for both:
- `db/schema.sql` - SQLite schema
- `db/schema-postgres.sql` - PostgreSQL schema

## Security Features

- Password hashing with bcrypt (12 rounds)
- JWT tokens with refresh mechanism
- HTTP-only secure cookies
- Rate limiting (100 req/15min general, 5 req/15min auth)
- CORS protection
- Helmet.js security headers
- Input validation with express-validator
- SQL injection prevention

## What This Enables

With this auth service, you can now build:

- ✅ **Comments** on songs and albums
- ✅ **Editor profiles** with credits
- ✅ **Playlist sharing** with public links
- ✅ **User stats/wrapped** features
- ✅ **YouTube integration** (via Google OAuth)
- ✅ **Social features** (follows, likes)
- ✅ **Activity tracking** for listening history

## Frontend Integration

See [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md) for:
- React auth context setup
- Login/register forms
- Protected routes
- API client configuration

## Deployment

### Docker

```bash
docker build -t aonsoku-auth .
docker run -d -p 3005:3005 --name aonsoku-auth aonsoku-auth
```

### Docker Compose

```bash
docker-compose up -d
```

Includes PostgreSQL setup.

### Manual Deployment

1. Set `NODE_ENV=production`
2. Use PostgreSQL database
3. Set secure JWT secrets
4. Enable HTTPS (set `COOKIE_SECURE=true`)
5. Configure OAuth production URLs

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for complete deployment guide.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3005` | Server port |
| `NODE_ENV` | `development` | Environment |
| `FRONTEND_URL` | `http://localhost:5173` | Aonsoku frontend URL (for CORS) |
| `DATABASE_TYPE` | `sqlite` | Database type (`sqlite` or `postgres`) |
| `DATABASE_PATH` | `./data/auth.db` | SQLite database path |
| `DATABASE_URL` | - | PostgreSQL connection string |
| `JWT_SECRET` | - | **Required:** JWT access token secret |
| `JWT_REFRESH_SECRET` | - | **Required:** JWT refresh token secret |
| `SESSION_SECRET` | - | **Required:** Session secret for OAuth |
| `JWT_EXPIRES_IN` | `7d` | Access token expiration |
| `JWT_REFRESH_EXPIRES_IN` | `30d` | Refresh token expiration |
| `GOOGLE_CLIENT_ID` | - | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | - | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | `http://localhost:3005/api/auth/google/callback` | Google OAuth callback |
| `DISCORD_CLIENT_ID` | - | Discord OAuth client ID |
| `DISCORD_CLIENT_SECRET` | - | Discord OAuth client secret |
| `DISCORD_CALLBACK_URL` | `http://localhost:3005/api/auth/discord/callback` | Discord OAuth callback |
| `COOKIE_SECURE` | `false` | Use secure cookies (set `true` in production with HTTPS) |
| `BCRYPT_ROUNDS` | `12` | Bcrypt hashing rounds |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |

## Troubleshooting

See [QUICK_START.md](./QUICK_START.md#common-issues) for common issues.

## License

MIT
