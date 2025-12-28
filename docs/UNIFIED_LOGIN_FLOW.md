# Unified Login Flow

## Overview

The login system now has a unified flow that handles both Supabase authentication and Navidrome connection automatically.

## How It Works

### 1. User Visits Login Page (`/server-config`)

The login page (`LoginForm` component) now:

1. **Checks if Supabase is configured**
   - If **NOT configured**: Shows traditional Navidrome direct login (URL, username, password)
   - If **configured**: Proceeds to step 2

2. **Checks if user is authenticated with Supabase**
   - If **NOT authenticated**: Shows message to sign in with Supabase account + OAuth buttons
   - If **authenticated**: Proceeds to step 3

3. **Auto-connects to Navidrome**
   - Checks if Navidrome credentials exist in user metadata
   - If credentials exist: Automatically connects to Navidrome
   - If credentials missing: Creates Navidrome account via auth service
   - Redirects to home page after successful connection

### 2. OAuth Login Flow

When user clicks OAuth button (Google/Discord):

1. Redirects to OAuth provider
2. User authenticates with provider
3. Redirects back to `/auth/callback`
4. `AuthCallback` component:
   - Gets Supabase session
   - Creates/retrieves Navidrome account
   - Stores credentials in user metadata
   - Auto-connects to Navidrome
   - Redirects to home page

### 3. Email/Password Login Flow

When user signs in with email/password:

1. Authenticates with Supabase
2. `Login` page (`/auth/login`) detects authentication
3. Auto-connects to Navidrome (same as step 1.3)
4. Redirects to home page

## Routes

- `/server-config` - Main login page (unified)
- `/auth/login` - Supabase email/password login
- `/auth/register` - Supabase registration
- `/auth/callback` - OAuth callback handler

## Key Features

✅ **Single Login Screen** - No more multiple login screens
✅ **Automatic Navidrome Setup** - Creates account if needed
✅ **Seamless Connection** - Auto-connects after authentication
✅ **Backward Compatible** - Still works without Supabase

## Troubleshooting

### Issue: "Multiple login screens"
**Solution**: Make sure you're using `/server-config` route. The system will automatically show the right screen based on Supabase configuration.

### Issue: "Not connecting to Navidrome"
**Solution**: 
1. Check that `VITE_API_URL` is set in `.env`
2. Check that `VITE_ACCOUNT_API_URL` is set in `.env`
3. Check browser console for errors
4. Verify auth service is running on port 3005

### Issue: "OAuth not working"
**Solution**:
1. Check Supabase OAuth providers are enabled
2. Check redirect URL is correct in Supabase dashboard
3. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set

