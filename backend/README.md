# Aonsoku Tag Writing Service

A backend service that writes ID3 tags to audio files and automatically triggers Navidrome library rescans.

## Features

- ✅ Write ID3v2.4 tags to MP3 files
- ✅ Update metadata (title, artist, album, year, genre, etc.)
- ✅ Update cover art (embedded in audio files)
- ✅ Update lyrics
- ✅ Automatic Navidrome library rescan after tag updates
- ✅ RESTful API for frontend integration
- 🔄 FLAC, M4A, OGG support (coming soon)

## Prerequisites

- Node.js 16 or higher
- Navidrome instance running
- Access to music library file system

## Installation

```bash
cd backend
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Edit `.env` with your settings:

```env
PORT=3001
NAVIDROME_URL=http://localhost:4533
NAVIDROME_USERNAME=admin
NAVIDROME_PASSWORD=your_password
MUSIC_LIBRARY_PATH=/path/to/your/music/library
FRONTEND_URL=http://localhost:3000
```

### Important Settings:

- `MUSIC_LIBRARY_PATH`: Must be the **exact same path** that Navidrome uses for your music library
- `NAVIDROME_URL`: URL where Navidrome is accessible
- `NAVIDROME_USERNAME/PASSWORD`: Admin credentials for Navidrome API access

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

The service will start on `http://localhost:3001`

## API Endpoints

### Update Song Tags

```
POST /api/update-song-tags
```

**Request Body:**

```json
{
  "songId": "navidrome-song-id",
  "metadata": {
    "title": "New Title",
    "artist": "New Artist",
    "album": "New Album",
    "albumArtist": "Album Artist",
    "year": 2025,
    "genre": "Rock",
    "track": 1,
    "disc": 1,
    "composer": "Composer Name",
    "bpm": 120,
    "comment": "My comment",
    "lyrics": "Song lyrics here"
  },
  "coverArt": "data:image/jpeg;base64,/9j/4AAQ..." // optional base64 image
}
```

**Response:**

```json
{
  "success": true,
  "message": "Tags updated successfully",
  "filePath": "/music/Artist/Album/Song.mp3",
  "scanTriggered": true,
  "updatedFields": ["title", "artist", "album", "year"]
}
```

### Health Check

```
GET /api/health
```

### Test Navidrome Connection

```
GET /api/test-navidrome
```

## Supported Formats

### Currently Supported
- ✅ MP3 (ID3v2.4 tags)

### Coming Soon
- 🔄 FLAC (Vorbis Comments)
- 🔄 M4A/AAC (MP4 tags)
- 🔄 OGG (Vorbis Comments)

## How It Works

1. Frontend sends tag update request with Navidrome song ID
2. Service queries Navidrome API to get file path
3. Service writes tags directly to the audio file using node-id3
4. Service triggers Navidrome library rescan
5. Navidrome re-reads metadata from the file
6. Updated tags appear in Navidrome/frontend

## Docker Deployment (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t aonsoku-tag-service .
docker run -d \
  -p 3001:3001 \
  -v /path/to/music:/music \
  -e MUSIC_LIBRARY_PATH=/music \
  -e NAVIDROME_URL=http://navidrome:4533 \
  --name aonsoku-tags \
  aonsoku-tag-service
```

## Troubleshooting

### "Audio file not found"
- Ensure `MUSIC_LIBRARY_PATH` matches Navidrome's library path exactly
- Check file permissions (service needs read/write access)

### "Failed to write ID3 tags"
- File might be corrupted or locked by another process
- Check file permissions
- Verify file format is actually MP3

### Tags don't appear in Navidrome
- Check if rescan was triggered (`scanTriggered: true` in response)
- Manually trigger rescan in Navidrome UI
- Wait a few seconds for scan to complete

### Permission denied errors
- Service needs read/write access to music files
- Run with appropriate user permissions
- Check filesystem permissions

## Security Notes

- This service has write access to your music library
- Only expose to trusted networks
- Use environment variables for credentials
- Consider adding authentication middleware
- Run with minimal file system permissions

## License

MIT
