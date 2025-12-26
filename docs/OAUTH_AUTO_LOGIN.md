# OAuth Auto-Login Implementation

This document explains how the OAuth auto-login system works in Aonsoku, allowing users to sign in with Google/Discord/GitHub and automatically connect to Navidrome without seeing the manual login screen.

## Overview

The OAuth auto-login flow integrates three systems:
1. **Supabase** - Handles OAuth authentication (Google, Discord, GitHub)
2. **Auth Service** - Creates Navidrome accounts for OAuth users
3. **Navidrome** - The music streaming server backend

When a user signs in with OAuth, the system:
1. Authenticates via Supabase
2. Creates a Navidrome account (if needed)
3. Stores credentials securely in Supabase user metadata
4. Automatically logs into Navidrome
5. Redirects to the main app

## Architecture

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ Clicks "Sign in with Google"
       ▼
┌─────────────┐
│  Supabase   │  OAuth Provider (Google/Discord/GitHub)
│   OAuth     │◄──────────────────────────────────────┐
└──────┬──────┘                                        │
       │ Returns session + user data                   │
       ▼                                               │
┌─────────────┐                                        │
│ AuthCallback│                                        │
│  Component  │                                        │
└──────┬──────┘                                        │
       │ Sends email + userId                          │
       ▼                                               │
┌─────────────┐                                        │
│Auth Service │  1. Sanitize username from email      │
│  (port 3005)│  2. Generate secure random password   │
│             │  3. Create Navidrome account          │
│             │  4. Return credentials                │
└──────┬──────┘                                        │
       │ Returns username + password                   │
       ▼                                               │
┌─────────────┐                                        │
│  Supabase   │  Store credentials in user_metadata   │
│ user_metadata│                                       │
└──────┬──────┘                                        │
       │                                               │
       ▼                                               │
┌─────────────┐                                        │
│  Navidrome  │  Auto-login with stored credentials   │
│   Login     │                                        │
└──────┬──────┘                                        │
       │                                               │
       ▼                                               │
┌─────────────┐                                        │
│  Main App   │  User is now fully authenticated      │
│   (Home)    │                                        │
└─────────────┘                                        │
```

## Implementation Details

### 1. Auth Service (`auth-service/server.js`)

#### New Endpoint: `/api/auth/oauth-callback`

Handles OAuth users and creates Navidrome accounts:

```javascript
POST /api/auth/oauth-callback
Body: {
  email: string,    // User's email from OAuth provider
  userId: string    // Supabase user ID
}

Response: {
  success: boolean,
  username: string,  // Generated Navidrome username
  password: string,  // Generated secure password (only for new users)
  message: string
}
```

**Features:**
- Sanitizes username from email
- Generates 32-character secure random password
- Creates Navidrome user via admin API
- Handles existing users gracefully
- Rate limited (10 requests per minute)

### 2. AuthCallback Component (`src/app/auth/AuthCallback.tsx`)

Handles the OAuth callback after user returns from OAuth provider:

**Flow:**
1. Get Supabase session
2. Check for existing Navidrome credentials in `user_metadata`
3. If not found, call auth service to create account
4. Store credentials in Supabase `user_metadata`
5. Auto-login to Navidrome using `saveConfig()`
6. Redirect to home page

**User Feedback:**
- Shows loading states: "Completing sign in...", "Setting up your account...", "Connecting to music server..."
- Toast notifications for success/error
- Graceful error handling with redirect to login

### 3. Credential Storage

Credentials are stored in **Supabase user metadata** (not localStorage):

```javascript
await supabase.auth.updateUser({
  data: {
    navidrome_username: string,
    navidrome_password: string  // Stored in user's metadata, encrypted by Supabase
  }
})
```

**Security:**
- Passwords stored in Supabase's encrypted user metadata
- Never exposed to client-side storage
- Only accessible to authenticated user
- Random 32-character passwords

### 4. AuthContext Updates (`src/contexts/AuthContext.tsx`)

**Changes:**
- Added GitHub OAuth provider support
- Removed localStorage credential storage
- Cleaned up legacy code
- All OAuth providers now supported: Google, Discord, GitHub

## Configuration

### Environment Variables

```bash
# .env file

# Navidrome server URL
VITE_API_URL=http://localhost:4533

# Supabase configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Auth service URL
VITE_ACCOUNT_API_URL=http://localhost:3005/api
```

### Auth Service Environment Variables

```bash
# auth-service/.env

NAVIDROME_URL=http://localhost:4533
NAVIDROME_ADMIN_USER=admin
NAVIDROME_ADMIN_PASSWORD=your-admin-password
FRONTEND_URL=http://localhost:5173
PORT=3005
```

## Setup Instructions

### 1. Configure Supabase

1. Create a Supabase project
2. Enable OAuth providers (Google, Discord, GitHub) in Authentication settings
3. Set redirect URL: `http://localhost:5173/auth/callback` (or your production URL)
4. Copy API URL and anon key to `.env`

### 2. Start Auth Service

```bash
cd auth-service
npm install
node server.js
```

Service runs on port 3005 by default.

### 3. Configure Routes

Ensure your router has the callback route:

```typescript
{
  path: '/auth/callback',
  element: <AuthCallback />
}
```

## User Flow

### First-Time OAuth User

1. User clicks "Continue with Google"
2. Redirected to Google OAuth
3. User authorizes app
4. Returns to `/auth/callback`
5. System shows: "Setting up your account..."
6. Auth service creates Navidrome account with:
   - Username: sanitized from email (e.g., `john_doe` from `john.doe@gmail.com`)
   - Password: random 32-character string
7. Credentials stored in Supabase user metadata
8. System shows: "Connecting to music server..."
9. Auto-login to Navidrome succeeds
10. Redirected to home page with success toast

**User never sees the manual login screen!**

### Returning OAuth User

1. User clicks "Continue with Google"
2. Redirected to Google OAuth
3. Returns to `/auth/callback`
4. System retrieves credentials from user metadata
5. Auto-login to Navidrome
6. Redirected to home page

**Even faster - no account creation needed!**

## Troubleshooting

### User sees manual login screen after OAuth

**Possible causes:**
- Auth service not running
- Missing environment variables
- Navidrome admin credentials incorrect
- Network connection issues

**Check:**
```bash
# Test auth service health
curl http://localhost:3005/api/health

# Check environment variables
echo $VITE_ACCOUNT_API_URL
echo $VITE_API_URL
```

### Navidrome account creation fails

**Possible causes:**
- Admin credentials incorrect in auth service
- Navidrome not running
- Username conflicts

**Check auth service logs:**
```bash
# Look for these messages:
[AUTH] ✓ User created successfully
[AUTH] ⚠️ Failed to create Navidrome user
```

### OAuth redirect fails

**Possible causes:**
- Redirect URL not configured in Supabase
- Route not defined in router

**Fix:**
- Add `http://localhost:5173/auth/callback` to Supabase OAuth settings
- Ensure `AuthCallback` component route exists

## Security Considerations

1. **Password Generation:** Uses `crypto.randomBytes()` for secure passwords
2. **Rate Limiting:** OAuth endpoint limited to 10 requests/minute
3. **Metadata Encryption:** Supabase encrypts user metadata
4. **HTTPS:** Use HTTPS in production for all services
5. **Admin Credentials:** Keep Navidrome admin credentials secure

## Future Improvements

- [ ] Add support for Last.fm OAuth
- [ ] Implement password rotation
- [ ] Add option to link existing Navidrome accounts
- [ ] Support for multiple Navidrome servers
- [ ] Implement 2FA for additional security
- [ ] Add audit logging for account creation

## API Reference

### Auth Service Endpoints

#### Health Check
```
GET /api/health
Response: { status: 'ok', message: string, navidromeUrl: string }
```

#### OAuth Callback
```
POST /api/auth/oauth-callback
Body: { email: string, userId: string }
Response: { success: boolean, username: string, password?: string }
Rate Limit: 10 requests/minute
```

#### Register (Legacy)
```
POST /api/auth/register
Body: { username: string, password: string, email: string }
Response: { success: boolean, message: string }
Rate Limit: 5 requests/15 minutes
```

## Credits

Implemented as part of the Aonsoku project to provide seamless OAuth authentication with Navidrome backend integration.
