# YouTube OAuth Setup Guide

This guide will help you set up Google OAuth for YouTube integration in yedits.net, enabling features like:

- ✅ Import your YouTube playlists
- ✅ Like/unlike videos from within the app
- ✅ Post comments and replies
- ✅ Search your YouTube content
- ✅ Create and manage playlists

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter project name: `yedits-youtube-oauth`
5. Click **"Create"**

## Step 2: Enable YouTube Data API v3

1. In your project, go to **"APIs & Services"** > **"Library"**
2. Search for **"YouTube Data API v3"**
3. Click on it and press **"Enable"**

## Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** > **"OAuth consent screen"**
2. Choose **"External"** user type (unless you have Google Workspace)
3. Click **"Create"**
4. Fill in the required fields:
   - **App name**: `yedits.net`
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click **"Save and Continue"**
6. On **"Scopes"** page, click **"Add or Remove Scopes"**
7. Add these scopes:
   - `https://www.googleapis.com/auth/youtube.readonly`
   - `https://www.googleapis.com/auth/youtube.force-ssl`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/userinfo.email`
8. Click **"Update"** then **"Save and Continue"**
9. On **"Test users"** page, add your Google email if in testing mode
10. Click **"Save and Continue"**

## Step 4: Create OAuth Credentials

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"Create Credentials"** > **"OAuth client ID"**
3. Choose **"Web application"**
4. Set **Application name**: `yedits.net Web Client`
5. Under **"Authorized redirect URIs"**, click **"Add URI"** and add:
   
   **For Development:**
   ```
   http://localhost:3000/youtube/callback
   ```
   
   **For Production:**
   ```
   https://yourdomain.com/youtube/callback
   ```
   
   (Add both if you're deploying to production)

6. Click **"Create"**
7. A dialog will appear with your credentials
8. **Copy the Client ID and Client Secret** - you'll need these!

## Step 5: Configure Environment Variables

1. Open your `.env` file (or create from `.env.example`)
2. Add the following variables:

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your-client-secret
VITE_GOOGLE_REDIRECT_URI=http://localhost:3000/youtube/callback
```

3. Replace `your-client-id` and `your-client-secret` with the values from Step 4
4. Save the file
5. Restart your development server:

```bash
npm run dev
```

## Step 6: Test the Integration

1. Navigate to the YouTube page in yedits.net
2. Click **"Connect Google Account"** button
3. You'll be redirected to Google's consent screen
4. Review the permissions and click **"Allow"**
5. You'll be redirected back to yedits.net
6. You should now see your profile picture and name
7. Try these features:
   - Click **"Import My Playlists"** to see your YouTube playlists
   - Like a video by clicking the thumbs up button
   - Post a comment on a video

## OAuth Scopes Explained

| Scope | Purpose |
|-------|--------|
| `youtube.readonly` | Read your YouTube account data, playlists, and subscriptions |
| `youtube.force-ssl` | Manage your YouTube account (like videos, post comments) |
| `userinfo.profile` | See your basic profile info (name, picture) |
| `userinfo.email` | See your email address |

## Security Best Practices

### Development

✅ **OK for Development:**
- Storing client secret in `.env` file
- Using localhost redirect URI
- Testing with your own Google account

### Production

⚠️ **Required for Production:**

1. **Never commit `.env` to git** - It's in `.gitignore` but double-check!
2. **Use backend OAuth flow** - Don't expose client secret in frontend
3. **Implement backend proxy:**

```typescript
// Backend service to handle OAuth
app.post('/api/youtube/oauth/callback', async (req, res) => {
  const { code } = req.body;
  
  // Exchange code for tokens on backend (keeps secret secure)
  const tokens = await exchangeCodeForTokens(code, CLIENT_SECRET);
  
  // Store refresh token in database
  await db.saveRefreshToken(userId, tokens.refresh_token);
  
  // Only send access token to frontend
  res.json({
    access_token: tokens.access_token,
    expires_in: tokens.expires_in,
  });
});
```

4. **Use environment variables** in your hosting platform (Vercel, Railway, etc.)
5. **Enable HTTPS** for production redirect URIs

## Troubleshooting

### "redirect_uri_mismatch" Error

**Problem:** Google shows "Error 400: redirect_uri_mismatch"

**Solution:**
1. Check that redirect URI in Google Console **exactly matches** your app
2. Include protocol (`http://` or `https://`)
3. Check for trailing slashes
4. Make sure port number matches if using localhost

**Correct examples:**
```
http://localhost:3000/youtube/callback  ✅
http://localhost:3000/youtube/callback/ ❌ (extra slash)
https://localhost:3000/youtube/callback ❌ (https on localhost)
```

### "Access blocked: This app's request is invalid"

**Problem:** OAuth consent screen not configured properly

**Solution:**
1. Go to OAuth consent screen settings
2. Make sure app is in "Testing" mode if not verified
3. Add your Google account to "Test users"
4. Save changes and try again

### "insufficient_permissions" Error

**Problem:** API call fails with 403 error

**Solution:**
1. Check that all required scopes are added in OAuth consent screen
2. Disconnect and reconnect your Google account to grant new permissions
3. Verify YouTube Data API v3 is enabled

### Tokens Not Persisting

**Problem:** Keep getting logged out after refresh

**Solution:**
1. Check browser localStorage is enabled
2. Open DevTools > Application > Local Storage
3. Look for `youtube-oauth-storage` key
4. If missing, check Zustand persist is working
5. Try clearing localStorage and re-authenticating

### "invalid_client" Error

**Problem:** OAuth flow fails with invalid client error

**Solution:**
1. Verify `VITE_GOOGLE_CLIENT_ID` is correct
2. Check for extra spaces or quotes in `.env`
3. Restart dev server after changing `.env`
4. Ensure client ID is from **Web application** type, not Android/iOS

## API Quota Limits

YouTube Data API has daily quotas:

- **Free quota**: 10,000 units/day
- **Read operations**: ~1-5 units
- **Write operations**: ~50 units (likes, comments)
- **Video upload**: 1,600 units

**Typical usage:**
- Load playlists: 1 unit
- Like a video: 50 units
- Post comment: 50 units
- Search: 100 units

**To increase quota:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **YouTube Data API v3**
3. Click **"Quotas"**
4. Request quota increase (requires billing account)

## Publishing Your App

If you want to make your app available to all users (not just test users):

1. Go to OAuth consent screen
2. Click **"Publish App"**
3. You may need to go through Google's verification process
4. This can take several days to weeks
5. Alternatively, keep in "Testing" mode (limited to 100 test users)

## Next Steps

✅ **You're all set!** Your YouTube OAuth integration is now configured.

**Try these features:**
- Import your YouTube playlists
- Like videos directly from yedits.net
- Post comments on videos
- Search your YouTube content
- Create new playlists

**Need help?** Check the [main README](../README.md) or open an issue on GitHub.

## Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [YouTube Data API v3 Docs](https://developers.google.com/youtube/v3)
- [OAuth Scopes Reference](https://developers.google.com/youtube/v3/guides/auth/installed-apps#identify-access-scopes)
- [API Quota Calculator](https://developers.google.com/youtube/v3/determine_quota_cost)
