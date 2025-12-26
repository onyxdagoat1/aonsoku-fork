# Supabase Authentication Setup Guide

Complete guide to set up Supabase authentication with Google OAuth and automatic Navidrome user creation.

## Table of Contents
1. [Supabase Project Setup](#supabase-project-setup)
2. [Database Setup](#database-setup)
3. [Google OAuth Configuration](#google-oauth-configuration)
4. [Discord OAuth Configuration (Optional)](#discord-oauth-configuration-optional)
5. [Environment Variables](#environment-variables)
6. [Testing the Setup](#testing-the-setup)
7. [Troubleshooting](#troubleshooting)

---

## Supabase Project Setup

### 1. Create Supabase Project

You already have:
- **Project URL**: `https://wioeokia1jqdbrzsgfpo.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## Database Setup

### 1. Run the Database Schema

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `supabase/setup.sql` from this repo
5. Paste and click **Run**

This will create:
- ✅ All necessary tables (profiles, comments, playlists, etc.)
- ✅ Row Level Security (RLS) policies
- ✅ Automatic profile creation trigger
- ✅ Performance indexes

### 2. Verify Database Setup

Run this query to check:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'comments', 'playlists');
```

You should see all three tables listed.

---

## Google OAuth Configuration

### 1. Google Cloud Console Setup

1. **Go to**: [Google Cloud Console](https://console.cloud.google.com/)

2. **Create/Select Project**:
   - Click project dropdown (top)
   - Create new project or select existing
   - Name: "yedits.net Auth" (or similar)

3. **Enable Google+ API**:
   - Go to **APIs & Services** > **Library**
   - Search for "Google+ API"
   - Click and enable it

4. **Configure OAuth Consent Screen**:
   - Go to **APIs & Services** > **OAuth consent screen**
   - Choose **External** (for public use)
   - Fill in:
     - App name: `yedits.net`
     - User support email: Your email
     - Developer contact: Your email
   - Click **Save and Continue**
   - **Scopes**: Click "Add or Remove Scopes"
     - Add: `../auth/userinfo.email`
     - Add: `../auth/userinfo.profile`
   - Click **Save and Continue**
   - **Test users** (optional during development)
   - Click **Save and Continue**

5. **Create OAuth Credentials**:
   - Go to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **OAuth client ID**
   - Application type: **Web application**
   - Name: "yedits.net Web Client"
   - **Authorized JavaScript origins**:
     ```
     https://wioeokia1jqdbrzsgfpo.supabase.co
     http://localhost:3000
     ```
   - **Authorized redirect URIs**:
     ```
     https://wioeokia1jqdbrzsgfpo.supabase.co/auth/v1/callback
     http://localhost:3000/auth/callback
     ```
   - Click **Create**
   - **Save the Client ID and Client Secret**

### 2. Supabase Google OAuth Setup

1. Go to your Supabase dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Google** and click to enable
4. Enter:
   - **Client ID**: (from Google Cloud Console)
   - **Client Secret**: (from Google Cloud Console)
5. **IMPORTANT - Redirect URL**:
   - Copy this URL: `https://wioeokia1jqdbrzsgfpo.supabase.co/auth/v1/callback`
   - Make sure it matches exactly in Google Console
6. Click **Save**

### 3. Verify Redirect URLs Match

**In Google Cloud Console** (Authorized redirect URIs):
```
https://wioeokia1jqdbrzsgfpo.supabase.co/auth/v1/callback
http://localhost:3000/auth/callback
```

**In Supabase** (should show this URL):
```
https://wioeokia1jqdbrzsgfpo.supabase.co/auth/v1/callback
```

---

## Discord OAuth Configuration (Optional)

### 1. Discord Developer Portal Setup

1. **Go to**: [Discord Developer Portal](https://discord.com/developers/applications)

2. **Create Application**:
   - Click **New Application**
   - Name: "yedits.net"
   - Accept terms and create

3. **Get Client ID and Secret**:
   - Go to **OAuth2** > **General**
   - Copy **Client ID**
   - Click **Reset Secret** and copy **Client Secret**

4. **Add Redirect URIs**:
   - Still in OAuth2 > General
   - Click **Add Redirect**
   - Add:
     ```
     https://wioeokia1jqdbrzsgfpo.supabase.co/auth/v1/callback
     http://localhost:3000/auth/callback
     ```
   - Click **Save Changes**

### 2. Supabase Discord OAuth Setup

1. Go to Supabase dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Discord** and enable
4. Enter:
   - **Client ID**: (from Discord)
   - **Client Secret**: (from Discord)
5. Click **Save**

---

## Environment Variables

### Your `.env` file should have:

```env
# Supabase Configuration (ALREADY SET)
VITE_SUPABASE_URL=https://wioeokia1jqdbrzsgfpo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpb29lZGtpYWpncWJyenNnZnBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NjE1NjQsImV4cCI6MjA4MjMzNzU2NH0.3hH7rys7bi3lnAl_BX3Kd33sfnohhfKy-2tJQanAXtU

# Auth Service (for Navidrome user creation)
VITE_ACCOUNT_API_URL=http://localhost:3005/api

# Navidrome Configuration
NAVIDROME_URL=http://localhost:4533
NAVIDROME_USERNAME=admin
NAVIDROME_PASSWORD=your_admin_password

# Other existing vars...
VITE_API_URL=http://localhost:4533
```

---

## Testing the Setup

### 1. Start All Services

```bash
npm run dev
```

This starts:
- Main app (port 3000)
- Auth service (port 3005) - needed for Navidrome user creation
- Tag writer (port 3001)
- Upload service (port 3002)

### 2. Test Google Login Flow

1. Open browser to `http://localhost:3000`
2. Click "Sign in with Google"
3. You should be redirected to Google login
4. After signing in, you'll be redirected back to your app
5. Check browser console for success messages

### 3. Verify in Supabase Dashboard

1. Go to **Authentication** > **Users**
2. You should see your new user
3. Go to **Table Editor** > **profiles**
4. You should see a profile created automatically

### 4. Verify in Navidrome

1. Open Navidrome UI (`http://localhost:4533`)
2. Log in as admin
3. Go to Users section
4. You should see a new user created with your Supabase username

---

## Troubleshooting

### Google Login Button Does Nothing

**Cause**: OAuth not configured or redirect URL mismatch

**Fix**:
1. Check browser console for errors
2. Verify Google OAuth is enabled in Supabase
3. Verify redirect URLs match exactly:
   - Google Console: `https://wioeokia1jqdbrzsgfpo.supabase.co/auth/v1/callback`
   - Supabase: Same URL shown in provider settings

### "Redirect URI Mismatch" Error

**Cause**: Google Console redirect URIs don't match Supabase

**Fix**:
1. In Google Cloud Console > Credentials
2. Edit your OAuth client
3. Make sure **Authorized redirect URIs** includes:
   ```
   https://wioeokia1jqdbrzsgfpo.supabase.co/auth/v1/callback
   ```
4. Save and wait 5 minutes for changes to propagate

### Supabase Profile Not Created

**Cause**: Database trigger not set up

**Fix**:
1. Go to Supabase SQL Editor
2. Run this to check if trigger exists:
   ```sql
   SELECT trigger_name 
   FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created';
   ```
3. If not found, re-run the `supabase/setup.sql` script

### Navidrome User Not Created

**Cause**: Auth service not running or can't reach Navidrome

**Fix**:
1. Ensure auth service is running: `npm run dev:auth`
2. Check `NAVIDROME_USERNAME` and `NAVIDROME_PASSWORD` in `.env`
3. Check auth service console for errors (magenta output)
4. Test Navidrome connection:
   ```bash
   curl http://localhost:3005/api/health
   ```

### "Supabase not configured" in Console

**Cause**: Environment variables not loaded

**Fix**:
1. Verify `.env` file exists at project root
2. Restart the dev server: `Ctrl+C` then `npm run dev`
3. Check console log shows:
   ```
   Supabase Configuration: { configured: true, ... }
   ```

### CORS Errors

**Cause**: Frontend origin not allowed

**Fix**:
1. In Supabase dashboard > Settings > API
2. Add to **Additional URLs**:
   ```
   http://localhost:3000
   ```

---

## What Happens When a User Signs Up

1. **User clicks "Sign in with Google"**
   - Redirected to Google login
   - User authorizes the app

2. **Google redirects back** to `/auth/callback`
   - Supabase creates auth.users entry
   - Trigger automatically creates profiles entry
   - User is redirected to homepage

3. **Profile creation** (automatic)
   - Username extracted from email
   - Display name from Google profile
   - Avatar URL from Google

4. **Navidrome user creation** (automatic)
   - Auth context detects new profile
   - Calls auth service API
   - Creates Navidrome user with same username
   - Links Supabase profile to Navidrome user

5. **User can now**:
   - Stream music from Navidrome
   - Create public/private playlists
   - Comment on songs
   - Share playlists with others
   - View listening history

---

## Next Steps

1. **Run Database Setup**: Execute `supabase/setup.sql` in Supabase SQL Editor
2. **Configure Google OAuth**: Follow Google Cloud Console steps above
3. **Update Environment**: Verify `.env` has all required variables
4. **Test Login**: Try signing in with Google
5. **Build Features**: Start using the profile, comments, and playlist APIs

---

## Support

If you encounter issues:

1. Check browser console for errors
2. Check auth service console (magenta output)
3. Verify all redirect URLs match exactly
4. Wait 5-10 minutes after changing Google Console settings
5. Try in incognito/private browsing mode

## Security Notes

- Never commit Client Secrets to git
- Use environment variables for all sensitive data
- Enable RLS (Row Level Security) on all tables
- Rotate secrets regularly
- Review Supabase auth logs for suspicious activity
