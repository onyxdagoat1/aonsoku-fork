# YouTube Integration Setup

This guide explains how to set up YouTube integration for the YeditsCommunity channel.

## Features

- Display all videos from YeditsCommunity channel
- Browse channel playlists
- Embedded video player
- View video descriptions and metadata
- Read and display comments with replies
- Responsive grid layout
- Automatic channel ID resolution from handle

## Setup Instructions

### 1. Get a YouTube Data API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key
5. (Recommended) Restrict your API key:
   - Click on the created API key
   - Under "Application restrictions", select "HTTP referrers"
   - Add your domain (e.g., `localhost:*` for development)
   - Under "API restrictions", select "Restrict key"
   - Choose only "YouTube Data API v3"

### 2. Configure the Application

1. Create a `.env` file in the root directory:
   ```bash
   cp .env.local.example .env
   ```

2. Add your YouTube API key to `.env`:
   ```
   VITE_YOUTUBE_API_KEY=your_api_key_here
   ```

3. Restart your development server:
   ```bash
   npm run dev
   ```

### 3. Channel Configuration

The app is configured for **@YeditsCommunity** by default. The channel ID is automatically resolved from the handle.

#### To use a different channel:

**Option 1: Use channel handle (recommended)**
1. Open `src/service/youtube.ts`
2. Update `CHANNEL_HANDLE` constant:
   ```typescript
   const CHANNEL_HANDLE = 'YourChannelHandle';
   ```

**Option 2: Use channel ID directly (faster)**
1. Find your channel ID:
   - Visit your channel page on YouTube
   - View page source (Ctrl+U or Cmd+U)
   - Search for `"channelId"` or `"externalId"`
   - Or use: https://commentpicker.com/youtube-channel-id.php

2. Update `CHANNEL_ID` in `src/service/youtube.ts`:
   ```typescript
   const CHANNEL_ID = 'UCxxxxxxxxxxxxxxxxxx';
   ```

## Usage

1. Navigate to **Library → YouTube** or go to `/#/library/youtube`
2. Browse through videos and playlists
3. Click any video to:
   - Watch in embedded player
   - Read full description
   - Browse comments and replies
4. Click playlists to view all videos

## Features Breakdown

### Video Cards
- Thumbnail preview
- Title and publish date
- Duration badge
- View count, likes, and comment count
- Click to open detailed view

### Video Player
- Full YouTube embedded player
- Auto-adjusts to container size
- Support for all YouTube player features
- Statistics display (views, likes, comments)

### Comments
- Top-level comments with replies
- Author profile pictures
- Like counts
- Relative timestamps ("2 days ago")
- HTML formatting preserved
- Nested reply threading

### Playlists
- Grid view of all channel playlists
- Video count badge
- Click to expand and view all videos
- Individual video access from playlist

## API Quota Management

YouTube Data API has daily quota limits (10,000 units/day by default):

| Operation | Quota Cost | Notes |
|-----------|------------|-------|
| List videos | ~100 units | Per 50 videos |
| List playlists | ~1 unit | Per request |
| Get comments | ~5 units | Per 100 comments |
| Channel info | ~3 units | Cached after first call |

### Tips to reduce quota usage:

1. **Lower maxResults**: Reduce the number of items fetched
   ```typescript
   youtubeService.getChannelVideos(25); // Instead of 50
   ```

2. **Implement caching**: Store results in localStorage
   ```typescript
   const cached = localStorage.getItem('youtube_videos');
   if (cached && Date.now() - cached.timestamp < 3600000) {
     return JSON.parse(cached.data);
   }
   ```

3. **Lazy load comments**: Only fetch when user opens video
4. **Pagination**: Load more videos on demand instead of all at once

## Troubleshooting

### "YouTube API key not configured"
**Solution:**
- Ensure `.env` file exists in root directory
- Variable must be named exactly `VITE_YOUTUBE_API_KEY`
- Restart dev server after adding the key
- Check for typos in the key

### No videos/playlists showing
**Possible causes:**
- Invalid API key → Check Google Cloud Console
- API not enabled → Enable YouTube Data API v3
- Quota exceeded → Check quota in Cloud Console
- Wrong channel handle/ID → Verify channel exists
- Network error → Check browser console

### "Could not find channel ID for: YeditsCommunity"
**Solution:**
- Hardcode the channel ID in `CHANNEL_ID` constant
- Verify the handle is correct (check YouTube URL)
- Ensure API key has proper permissions

### Comments not loading
**Possible causes:**
- Comments disabled on video
- API quota exceeded
- Video is age-restricted
- Comments are being held for review

### Rate limiting errors
**Solution:**
- Implement exponential backoff
- Cache responses locally
- Reduce frequency of API calls
- Consider pagination instead of loading all at once

## Development Notes

### Component Structure
```
src/app/pages/youtube/
├── index.tsx              # Main YouTube page
├── components/
│   ├── ChannelHeader.tsx  # Channel info display
│   ├── VideoCard.tsx      # Individual video card
│   ├── VideoPlayer.tsx    # Video player + tabs
│   ├── PlaylistCard.tsx   # Playlist card
│   ├── PlaylistViewer.tsx # Playlist video list
│   └── Comments.tsx       # Comments display
```

### Service Architecture
- Singleton pattern for YouTube service
- Automatic channel ID caching
- Error handling with fallbacks
- TypeScript interfaces for type safety

### UI Components Used
- shadcn/ui Card, Dialog, Tabs
- Lucide React icons
- TailwindCSS for styling
- React Suspense for lazy loading

## Security Best Practices

1. **Never commit API keys**
   - `.env` is in `.gitignore`
   - Use environment variables in production

2. **Restrict API key**
   - Limit to YouTube Data API v3 only
   - Add HTTP referrer restrictions
   - Monitor usage in Cloud Console

3. **Production deployment**
   - Use server-side proxy for API calls
   - Implement rate limiting
   - Add request authentication

4. **API key rotation**
   - Regularly rotate keys
   - Use different keys for dev/prod
   - Monitor for unauthorized usage

## Future Enhancements

- [ ] Infinite scroll pagination
- [ ] Search within channel videos
- [ ] Filter by date/popularity
- [ ] Video categories/tags
- [ ] Save favorite videos locally
- [ ] Export playlists
- [ ] Live stream support
- [ ] Community posts integration
- [ ] Shorts support
- [ ] Multi-channel support
- [ ] Offline mode with cached data

## Support

For issues or questions:
1. Check the browser console for errors
2. Review the troubleshooting section
3. Verify API key and quota in Google Cloud Console
4. Check YouTube Data API documentation: https://developers.google.com/youtube/v3
