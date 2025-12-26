# Aonsoku Auth Service - Complete Setup Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [OAuth Setup](#oauth-setup)
5. [Running the Service](#running-the-service)
6. [Frontend Integration](#frontend-integration)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 16 or higher
- npm or pnpm
- (Optional) PostgreSQL for production
- Google Cloud account (for Google OAuth)
- Discord Developer account (for Discord OAuth)

## Installation

### 1. Install Dependencies

```bash
cd auth-service
npm install
```

### 2. Create Environment File

```bash
cp .env.example .env
```

### 3. Edit Configuration

Open `.env` and configure:

```env
# Basic Settings
PORT=3002
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT Secrets (CHANGE THESE!)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-min-32-characters
SESSION_SECRET=your-session-secret-min-32-characters

# Database (SQLite for dev)
DATABASE_TYPE=sqlite
DATABASE_PATH=./data/auth.db
```

## Configuration

### Generate Secure Secrets

**Option 1: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 2: Using OpenSSL**
```bash
openssl rand -hex 32
```

Copy the output and use it for your JWT_SECRET, JWT_REFRESH_SECRET, and SESSION_SECRET.

### Database Options

#### SQLite (Development)
```env
DATABASE_TYPE=sqlite
DATABASE_PATH=./data/auth.db
```

Database file will be auto-created on first run.

#### PostgreSQL (Production)
```env
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://username:password@localhost:5432/aonsoku_auth
```

## OAuth Setup

### Google OAuth (Required for YouTube Integration)

#### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it "Aonsoku" and create

#### Step 2: Enable APIs

1. Go to "APIs & Services" → "Library"
2. Search for "Google+ API" and enable it

#### Step 3: Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Configure OAuth consent screen:
   - User Type: External
   - App name: Aonsoku
   - User support email: your email
   - Developer contact: your email
4. Add scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
5. Add test users (during development)
6. Create OAuth client ID:
   - Application type: Web application
   - Name: Aonsoku Auth
   - Authorized redirect URIs:
     - `http://localhost:3002/api/auth/google/callback` (dev)
     - `https://your-domain.com/api/auth/google/callback` (prod)

#### Step 4: Configure Environment

Copy the Client ID and Client Secret to `.env`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3002/api/auth/google/callback
```

### Discord OAuth

#### Step 1: Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name it "Aonsoku" and create

#### Step 2: Configure OAuth2

1. Go to "OAuth2" section
2. Click "Add Redirect"
3. Add redirect URIs:
   - `http://localhost:3002/api/auth/discord/callback` (dev)
   - `https://your-domain.com/api/auth/discord/callback` (prod)

#### Step 3: Configure Environment

Copy the Client ID and Client Secret:

```env
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_CALLBACK_URL=http://localhost:3002/api/auth/discord/callback
```

## Running the Service

### Development Mode

```bash
npm run dev
```

Server will start on `http://localhost:3002` with auto-reload.

### Production Mode

```bash
npm start
```

### Verify Installation

```bash
# Health check
curl http://localhost:3002/health

# Should return:
# {"status":"ok","service":"aonsoku-auth-service","version":"1.0.0"}
```

## Frontend Integration

### Step 1: Install Axios (if not already installed)

```bash
cd .. # Go back to main project
npm install axios
```

### Step 2: Create Auth API Client

Create `src/api/auth.ts`:

```typescript
import axios from 'axios';

const authAPI = axios.create({
  baseURL: 'http://localhost:3002/api',
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
authAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
authAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const { data } = await authAPI.post('/auth/refresh');
        localStorage.setItem('access_token', data.tokens.access_token);
        return authAPI.request(error.config);
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default authAPI;

// Auth functions
export const register = (email: string, username: string, password: string) =>
  authAPI.post('/auth/register', { email, username, password });

export const login = (email: string, password: string) =>
  authAPI.post('/auth/login', { email, password });

export const logout = () => authAPI.post('/auth/logout');

export const getCurrentUser = () => authAPI.get('/auth/me');

export const updateProfile = (data: any) => authAPI.put('/users/profile', data);

// Comments
export const getSongComments = (songId: string) =>
  authAPI.get(`/comments/song/${songId}`);

export const createComment = (data: any) => authAPI.post('/comments', data);

export const deleteComment = (id: string) => authAPI.delete(`/comments/${id}`);
```

### Step 3: Create Auth Context (React)

Create `src/contexts/AuthContext.tsx`:

```typescript
import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, login, logout, register } from '@/api/auth';

interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => void;
  loginWithDiscord: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data } = await getCurrentUser();
      setUser(data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    const { data } = await login(email, password);
    setUser(data.user);
    localStorage.setItem('access_token', data.tokens.access_token);
  };

  const handleRegister = async (email: string, username: string, password: string) => {
    const { data } = await register(email, username, password);
    setUser(data.user);
    localStorage.setItem('access_token', data.tokens.access_token);
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    localStorage.removeItem('access_token');
  };

  const loginWithGoogle = () => {
    window.location.href = 'http://localhost:3002/api/auth/google';
  };

  const loginWithDiscord = () => {
    window.location.href = 'http://localhost:3002/api/auth/discord';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        loginWithGoogle,
        loginWithDiscord
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

## Deployment

### Using Docker

#### Build Image

```bash
docker build -t aonsoku-auth .
```

#### Run Container

```bash
docker run -d \
  -p 3002:3002 \
  -e DATABASE_TYPE=postgres \
  -e DATABASE_URL=postgresql://user:pass@host/db \
  -e JWT_SECRET=your-secret \
  -e GOOGLE_CLIENT_ID=your-id \
  --name aonsoku-auth \
  aonsoku-auth
```

### Using PM2

```bash
npm install -g pm2
pm2 start server.js --name aonsoku-auth
pm2 save
pm2 startup
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use PostgreSQL database
- [ ] Generate secure JWT secrets (32+ characters)
- [ ] Set `COOKIE_SECURE=true`
- [ ] Configure production OAuth redirect URLs
- [ ] Set up HTTPS/SSL
- [ ] Enable rate limiting
- [ ] Set up database backups
- [ ] Configure logging
- [ ] Set up monitoring

## Troubleshooting

### Database Issues

**Error: SQLITE_CANTOPEN**
```bash
mkdir -p data
chmod 755 data
```

**PostgreSQL connection fails**
```bash
# Check connection
psql postgresql://user:pass@host/db

# Create database
createdb aonsoku_auth
```

### OAuth Issues

**Google: redirect_uri_mismatch**
- Ensure redirect URI in Google Console exactly matches GOOGLE_CALLBACK_URL
- Include port number if using localhost

**Discord: Invalid OAuth2 redirect**
- Check redirect URI in Discord app settings
- Ensure no trailing slashes

### CORS Errors

```env
# Ensure FRONTEND_URL matches your frontend exactly
FRONTEND_URL=http://localhost:3000
```

### Token Issues

**Tokens expire immediately**
- Check system time is correct
- Verify JWT_EXPIRES_IN format (e.g., "7d", "24h")

**Refresh token not working**
- Check refresh token is being stored in database
- Verify JWT_REFRESH_SECRET is set

### Common Errors

**"No access token provided"**
- Frontend not sending Authorization header or cookie
- Check withCredentials: true in axios config

**"User already exists"**
- Email already registered
- Username already taken

**"Invalid credentials"**
- Wrong email/password
- Account uses OAuth (can't login with password)

## Support

For issues or questions:
1. Check logs: `npm run dev` (shows detailed errors)
2. Verify environment variables
3. Check OAuth credentials are correct
4. Review CORS and network settings

## Next Steps

Now that auth is set up:
1. Integrate login/register forms in frontend
2. Add comments UI to songs/albums
3. Create user profile pages
4. Implement stats/wrapped feature
5. Add playlist sharing
6. Build editor credits system
