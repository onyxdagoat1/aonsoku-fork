# YouTube OAuth Integration Setup Guide

This guide will help you set up YouTube OAuth integration to enable authenticated features like liking videos, commenting, importing playlists, and more.

## Prerequisites

- A Google Cloud Platform account
- YouTube Data API v3 enabled
- Basic understanding of OAuth 2.0

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Create Project** or select an existing project
3. Give your project a name (e.g., "Aonsoku YouTube Integration")
4. Click **Create**

## Step 2: Enable YouTube Data API v3

1. In your Google Cloud project, go to **APIs & Services** > **Library**
2. Search for "YouTube Data API v3"
3. Click on it and press **Enable**

## Step 3: Create OAuth 2.0 Credentials

### Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **External** user type (unless you're using Google Workspace)
3. Click **Create**
4. Fill in the required information:
   - **App name**: Your app name (e.g., "Aonsoku")
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click **Save and Continue**
6. On the **Scopes** page, click **Add or Remove Scopes**
7. Add these YouTube scopes:
   - `https://www.googleapis.com/auth/youtube.readonly`
   - `https://www.googleapis.com/auth/youtube.force-ssl`
   - `https://www.googleapis.com/auth/youtubepartner`
8. Click **Update** then **Save and Continue**
9. On **Test users**, add your Google account email
10. Click **Save and Continue**

### Create OAuth Client ID

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application** as the application type
4. Give it a name (e.g., "Aonsoku Web Client")
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000` (for development)
   - Your production domain (e.g., `https://yourdomain.com`)
6. Under **Authorized redirect URIs**, add:
   - `http://localhost:3000/#/youtube/callback` (for development)
   - `https://yourdomain.com/#/youtube/callback` (for production)
7. Click **Create**
8. Copy the **Client ID** and **Client Secret** - you'll need these!

## Step 4: Configure Environment Variables

1. Open your `.env` file in the project root
2. Add the following variables:

```env
# YouTube OAuth Configuration
VITE_YOUTUBE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_YOUTUBE_OAUTH_CLIENT_SECRET=your-client-secret
```

3. Replace `your-client-id` and `your-client-secret` with the values from Step 3

## Step 5: Restart Your Development Server

```bash
npm run dev
# or
yarn dev
```

## Step 6: Test the Integration

1. Navigate to the YouTube page in your app
2. You should see a "Connect YouTube Account" card
3. Click **Connect with Google**
4. Sign in with your Google account
5. Grant the requested permissions
6. You'll be redirected back to the YouTube page
7. You should now see your account connected!

## Features Enabled After Connection

### Video Interactions
- **Like/Dislike**: Click the thumbs up or down buttons on any video
- **Comment**: Add comments to videos directly from the app
- **Save to Playlist**: Add videos to your existing or new YouTube playlists
- **Share**: Share videos easily

### Playlist Management
- **Import Playlists**: Click "Import Playlists" to bring your YouTube playlists into the app
- **Create Playlists**: Create new YouTube playlists from within the app
- **Add to Playlists**: Save videos to your playlists with one click

### Account Features
- View your connected account information
- Disconnect your account at any time
- Access all features while maintaining privacy

## Troubleshooting

### "Access Denied" Error
- Make sure you've added your email to the test users in the OAuth consent screen
- Verify that all required scopes are added
- Check that the redirect URI matches exactly (including the hash `#`)

### "Invalid Client" Error
- Double-check your Client ID and Client Secret in the `.env` file
- Ensure there are no extra spaces or quotes
- Restart your development server after updating `.env`

### Redirect URI Mismatch
- The redirect URI in Google Cloud Console must exactly match: `http://localhost:3000/#/youtube/callback`
- For production, use your actual domain with the hash route

### Scopes Not Working
- Make sure all three YouTube scopes are added in the OAuth consent screen
- Try revoking access at [myaccount.google.com/permissions](https://myaccount.google.com/permissions) and reconnecting

## Security Best Practices

1. **Never commit credentials**: Keep `.env` in `.gitignore`
2. **Use environment variables**: Always use `VITE_*` prefix for client-side variables
3. **Rotate secrets**: If credentials are exposed, rotate them immediately in Google Cloud Console
4. **Limit scopes**: Only request the YouTube scopes you actually need
5. **Refresh tokens**: The app automatically handles token refresh for seamless experience

## Production Deployment

### Before Going Live

1. **Verify your app** in Google Cloud Console:
   - Go to **OAuth consent screen**
   - Click **Publish App**
   - Submit for verification if needed

2. **Update redirect URIs**:
   - Add your production domain to authorized redirect URIs
   - Use HTTPS for production

3. **Environment variables**:
   - Set production environment variables in your hosting platform
   - Never expose client secret in client-side code (it's handled securely)

### Hosting Considerations

- **Vercel/Netlify**: Add environment variables in project settings
- **Custom server**: Ensure `.env` is properly loaded and secured
- **HTTPS**: Always use HTTPS in production for OAuth

## API Quotas and Limits

YouTube Data API v3 has usage quotas:

- **Default quota**: 10,000 units per day
- **Video rating**: 50 units
- **Comment insertion**: 50 units
- **Playlist operations**: 50-150 units

To request a quota increase:
1. Go to **APIs & Services** > **Quotas**
2. Click on YouTube Data API v3
3. Request an increase with justification

## Additional Resources

- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [OAuth 2.0 for Web Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [YouTube API Quota Calculator](https://developers.google.com/youtube/v3/determine_quota_cost)

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure Google Cloud Console configuration matches this guide
4. Check that your app is in "Testing" mode if using test users

---

**Happy YouTubing! 🎥**