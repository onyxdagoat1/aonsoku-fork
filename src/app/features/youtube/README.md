# YouTube OAuth Integration

This directory contains components and services for integrating Google OAuth with YouTube features.

## Features

- ✅ Google OAuth 2.0 authentication
- ✅ Import user's YouTube playlists
- ✅ Like/unlike videos
- ✅ Post comments and replies
- ✅ Search user's content
- ✅ Token refresh and persistence

## Setup

### 1. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **YouTube Data API v3**
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Configure OAuth consent screen
6. Create **Web application** credentials
7. Add authorized redirect URIs:
   - `http://localhost:3000/youtube/callback` (development)
   - `https://yourdomain.com/youtube/callback` (production)

### 2. Configure Environment Variables

Add to your `.env` file:

```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_client_secret_here
VITE_GOOGLE_REDIRECT_URI=http://localhost:3000/youtube/callback
```

### 3. Add OAuth Callback Route

Add to `src/routes/router.tsx`:

```tsx
import { YouTubeOAuthCallback } from '@/app/features/youtube/pages/YouTubeOAuthCallback';

// Add this route
{
  path: '/youtube/callback',
  element: <YouTubeOAuthCallback />,
}
```

## Usage

### Connect Google Account Button

```tsx
import { YouTubeAuthButton } from '@/app/features/youtube/components/YouTubeAuthButton';

function YouTubePage() {
  return (
    <div>
      <YouTubeAuthButton />
    </div>
  );
}
```

### Import User Playlists

```tsx
import { YouTubeUserPlaylists } from '@/app/features/youtube/components/YouTubeUserPlaylists';

function YouTubePage() {
  const handleImportPlaylist = (playlist) => {
    console.log('Importing playlist:', playlist);
    // Handle playlist import logic
  };

  return (
    <YouTubeUserPlaylists onImportPlaylist={handleImportPlaylist} />
  );
}
```

### Like Button

```tsx
import { LikeButton } from '@/app/features/youtube/components/LikeButton';

function VideoCard({ video }) {
  return (
    <div>
      <LikeButton 
        videoId={video.id}
        likeCount={video.statistics?.likeCount}
        onLikeChange={(liked) => console.log('Like changed:', liked)}
      />
    </div>
  );
}
```

### Comment Box

```tsx
import { CommentBox } from '@/app/features/youtube/components/CommentBox';

function VideoPlayer({ videoId }) {
  return (
    <div>
      <CommentBox 
        videoId={videoId}
        onCommentPosted={() => {
          console.log('Comment posted, refresh comments');
        }}
      />
    </div>
  );
}
```

### Check Authentication Status

```tsx
import { useYouTubeOAuthStore } from '@/store/useYouTubeOAuthStore';

function MyComponent() {
  const { isAuthenticated, userInfo } = useYouTubeOAuthStore();

  if (!isAuthenticated) {
    return <p>Please connect your Google account</p>;
  }

  return (
    <div>
      <p>Welcome, {userInfo?.name}!</p>
    </div>
  );
}
```

## API Methods

The `youtubeOAuthService` provides these methods:

```typescript
import { youtubeOAuthService } from '@/service/youtube-oauth.service';

// Authentication
youtubeOAuthService.initiateAuth();
youtubeOAuthService.logout();

// Playlists
const playlists = await youtubeOAuthService.getUserPlaylists();
const created = await youtubeOAuthService.createPlaylist('My Playlist', 'Description');
await youtubeOAuthService.addToPlaylist(playlistId, videoId);

// Videos
const likedVideos = await youtubeOAuthService.getLikedVideos();
await youtubeOAuthService.likeVideo(videoId);
await youtubeOAuthService.unlikeVideo(videoId);

// Comments
await youtubeOAuthService.postComment(videoId, 'Great video!');
await youtubeOAuthService.replyToComment(commentId, 'Thanks!');

// Search
const results = await youtubeOAuthService.searchMyContent('music');
```

## OAuth Scopes Required

The integration uses these YouTube API scopes:

- `https://www.googleapis.com/auth/youtube.readonly` - Read channel data, playlists
- `https://www.googleapis.com/auth/youtube.force-ssl` - Manage likes and comments
- `https://www.googleapis.com/auth/userinfo.profile` - User profile info
- `https://www.googleapis.com/auth/userinfo.email` - User email

## Security Notes

- OAuth tokens are stored in localStorage with Zustand persist
- Tokens automatically refresh when expired
- Client secret should be kept secure (use backend proxy in production)
- State parameter prevents CSRF attacks
- Tokens are cleared on logout

## Production Deployment

⚠️ **Important**: For production, implement a backend OAuth flow:

1. Never expose `GOOGLE_CLIENT_SECRET` in frontend code
2. Use a backend service to exchange auth code for tokens
3. Store refresh tokens securely in backend
4. Frontend should only receive short-lived access tokens

Example backend endpoint:

```typescript
// Backend API endpoint
app.post('/api/youtube/oauth/token', async (req, res) => {
  const { code } = req.body;
  
  // Exchange code for tokens on backend
  const tokens = await exchangeCodeForTokens(code);
  
  // Store refresh token securely
  await storeRefreshToken(userId, tokens.refresh_token);
  
  // Return only access token to frontend
  res.json({
    access_token: tokens.access_token,
    expires_in: tokens.expires_in,
  });
});
```

## Troubleshooting

### "redirect_uri_mismatch" Error

- Ensure redirect URI in Google Console matches exactly
- Include both development and production URIs
- Check for trailing slashes

### "insufficient_permissions" Error

- Verify all required scopes are included
- Re-authenticate to grant new permissions
- Check API is enabled in Google Console

### Tokens Not Persisting

- Check browser localStorage is enabled
- Verify Zustand persist middleware is configured
- Clear localStorage and re-authenticate

## License

MIT
