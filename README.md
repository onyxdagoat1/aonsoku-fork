# Aonsoku

A modern desktop and web client for Navidrome/Subsonic music servers with advanced features including music upload, metadata editing, YouTube integration, and comprehensive media management.

## Quick Start - One Command Development

### 1. Install Everything

```bash
# Main app
npm install

# All services
cd tag-writer-service && npm install && cd ..
cd upload-service && npm install && cd ..
```

### 2. Create Your Configuration

**IMPORTANT:** You only need ONE .env file at the root:

```bash
cp .env.example .env
```

Edit `.env` and set these required values:
```env
NAVIDROME_USERNAME=your_username
NAVIDROME_PASSWORD=your_password
TAG_WRITER_MUSIC_PATH=/your/music/path
UPLOAD_MUSIC_PATH=/your/music/path
```

### 3. Run Everything

```bash
npm run dev
```

That's it! One command starts all 3 services:
- **Main App**: http://localhost:3000 (Blue)
- **Tag Writer**: http://localhost:3001 (Yellow)
- **Upload Service**: http://localhost:3002 (Green)

Stop everything with `Ctrl+C`.

### File Structure - Only ONE .env

```
aonsoku-fork/
  .env                    <-- ONLY configure this file
  .env.example            <-- Template (safe to commit)
  tag-writer-service/
    .env.loader.cjs       <-- Reads from parent .env
  upload-service/
    .env.loader.cjs       <-- Reads from parent .env
```

**Important:** 
- Never create .env files in service directories
- All configuration happens in the root .env
- The .env.loader.cjs files automatically map variables

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Service APIs](#service-apis)
- [Feature Guides](#feature-guides)
- [Development](#development)
- [Docker Deployment](#docker-deployment)
- [macOS Users](#macos-users)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Features

### Core Features
- Modern web and desktop client for Subsonic-compatible servers
- Support for Navidrome, Subsonic, and LMS servers
- Responsive design for all screen sizes
- Dark/light theme support
- Internet radio streaming
- Comprehensive playlist management
- Advanced search and filtering
- Keyboard shortcuts

### Music Metadata Editor (Tag Writer Service)
- ✅ Write ID3v2.4 tags to MP3 files
- ✅ Update metadata: title, artist, album, year, genre, track#, disc#, composer, BPM, lyrics
- ✅ Update cover art (JPEG, PNG, WebP)
- ✅ Automatically trigger Navidrome library rescan after updates
- ✅ CORS support for frontend integration
- ✅ File validation and error handling

### Music Upload System
- Drag and drop music file upload
- Automatic metadata detection from ID3 tags
- In-browser metadata editor
- Batch upload support
- Real-time upload progress tracking
- Automatic file organization by Artist/Album
- Supported formats: MP3, FLAC, M4A, OGG, OPUS, WAV, AAC
- Automatic Navidrome library scanning after upload

### YouTube Integration
- Browse YouTube channel videos and playlists
- Advanced search and filtering
- Sort by date, views, likes, comments, or duration
- Filter by time period and video length
- Statistics dashboard with channel metrics
- Grid and list view modes
- Split-screen video player with side panel
- Threaded comments with collapsible replies
- Smart caching (1-hour local storage)
- Trending badges for popular videos

## Installation

### Prerequisites
- Node.js 16+ and npm
- A running Navidrome or Subsonic-compatible server

### Setup

1. Clone the repository:
```bash
git clone https://github.com/onyxdagoat1/aonsoku-fork.git
cd aonsoku-fork
```

2. Install all dependencies:
```bash
npm install
cd tag-writer-service && npm install && cd ..
cd upload-service && npm install && cd ..
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your settings
```

## Configuration

### Single .env File Configuration

All services read from ONE `.env` file at the root. Copy `.env.example` to `.env` and configure:

### Required Settings

```env
# Navidrome connection (required)
VITE_API_URL=http://localhost:4533
NAVIDROME_URL=http://localhost:4533
NAVIDROME_USERNAME=your_username
NAVIDROME_PASSWORD=your_password

# Music paths (required for upload/tag features)
TAG_WRITER_MUSIC_PATH=/path/to/music
UPLOAD_MUSIC_PATH=/path/to/music
```

### Optional Settings

```env
# YouTube integration
VITE_YOUTUBE_API_KEY=your_api_key

# Service ports (defaults shown)
PORT=3000
TAG_WRITER_PORT=3001
UPLOAD_PORT=3002

# CORS origins
TAG_WRITER_CORS_ORIGINS=http://localhost:3000
```

### How It Works

Each service directory has a `.env.loader.cjs` file that:
1. Loads the root `.env` file
2. Maps variables to service-specific names
3. Keeps all services in sync

**Variables are prefixed by service:**
- `TAG_WRITER_*` → Tag Writer Service
- `UPLOAD_*` → Upload Service
- `VITE_*` → Main Frontend App

See `.env.example` for complete documentation.

## Service APIs

### Tag Writer Service API

Base URL: `http://localhost:3001`

#### Update Song Metadata
**POST** `/api/update-tags`

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
    "comment": "Comments here",
    "lyrics": "Song lyrics here"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tags updated successfully",
  "path": "Artist/Album/01 - Song.mp3"
}
```

#### Update Cover Art
**POST** `/api/update-cover-art`

**Form Data:**
- `songId`: Navidrome song ID
- `coverArt`: Image file (JPEG, PNG, WebP)

**Response:**
```json
{
  "success": true,
  "message": "Cover art updated successfully"
}
```

#### Get Current Tags
**GET** `/api/get-tags/:songId`

**Response:**
```json
{
  "success": true,
  "tags": {
    "title": "Song Title",
    "artist": "Artist Name",
    ...
  },
  "path": "Artist/Album/01 - Song.mp3"
}
```

#### Trigger Manual Rescan
**POST** `/api/rescan`

**Response:**
```json
{
  "success": true,
  "message": "Rescan triggered"
}
```

#### Health Check
**GET** `/health`

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

## Feature Guides

### Music Metadata Editing

#### Quick Start

1. Ensure tag writer service is running (`npm run dev` starts everything)
2. Select a song in the main app
3. Open metadata editor
4. Edit fields as needed
5. Save changes
6. Navidrome automatically rescans

#### Important Notes

1. **File Access**: The service must have read/write access to the music library path
2. **Path Matching**: `TAG_WRITER_MUSIC_PATH` must match Navidrome's music folder mount
3. **Permissions**: Ensure the service runs with appropriate file permissions
4. **Backups**: Always backup your music library before bulk tag editing
5. **Rescan**: Automatic rescans are triggered after each tag update

### Music Upload System

#### Quick Start

1. Ensure upload service is running (`npm run dev` starts everything)
2. Navigate to Upload page in sidebar
3. Drag and drop music files
4. Review/edit metadata
5. Click Upload

#### Batch Upload Mode

Toggle "Batch Upload Mode" to upload entire folders:
- Files keep existing metadata
- Auto-organized by Artist/Album
- No individual editing needed

#### File Organization

```
/music/
  Artist Name/
    Album Name/
      01 - Track Title.mp3
```

### YouTube Integration

#### Setup

1. Get API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable YouTube Data API v3
3. Restrict API key (HTTP referrers + API restrictions)
4. Add to `.env`:
```env
VITE_YOUTUBE_API_KEY=your_key
```

#### Features

- Real-time search and filtering
- Multiple sort options (date, views, likes, comments, duration)
- Time filters (week, month, year, popular)
- Duration filters (short, medium, long)
- Grid and list views
- Split-screen video player
- Statistics dashboard
- 1-hour caching (saves 90% API quota)

#### API Quota

- Completely free (10,000 units/day)
- ~104 units per page load
- ~96-240 loads/day with caching

## Development

### Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) or [PyCharm](https://www.jetbrains.com/pycharm/)
- [Biome.js](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) extension for VS Code

### Available Commands

```bash
# Development
npm run dev              # Run all services (recommended)
npm run dev:frontend     # Just main app
npm run dev:tag-writer   # Just tag writer
npm run dev:upload       # Just upload service

# Building
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run linter
npm run lint:fix         # Fix linting issues
npm run lint:format      # Format code
npm run test             # Run tests

# Desktop App
npm run electron:dev     # Start electron in dev mode
npm run electron:build   # Build electron app
npm run build:win        # Build for Windows
npm run build:mac        # Build for macOS
npm run build:linux      # Build for Linux
```

### Technology Stack

- **Frontend**: React 18, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Desktop**: Electron
- **Backend Services**: Node.js, Express
- **Tag Writing**: node-id3
- **Tag Reading**: music-metadata

### Port Allocation

| Service | Port | Terminal Color |
|---------|------|----------------|
| Main App | 3000 | Blue |
| Tag Writer | 3001 | Yellow |
| Upload | 3002 | Green |
| Navidrome | 4533 | (external) |

## Docker Deployment

### Main Application

```yaml
version: '3.8'

services:
  aonsoku:
    container_name: aonsoku
    image: ghcr.io/victoralvesf/aonsoku:latest
    restart: unless-stopped
    ports:
      - 8080:8080
    environment:
      - SERVER_URL=http://your-navidrome:4533
      - VITE_UPLOAD_SERVICE_URL=http://upload-service:3002
      - VITE_TAG_WRITER_SERVICE_URL=http://tag-writer:3001
```

### Tag Writer Service (Docker)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
```

Build and run:

```bash
cd tag-writer-service
docker build -t navidrome-tag-writer .
docker run -d \
  -p 3001:3001 \
  -v /path/to/music:/music \
  -e NAVIDROME_URL=http://navidrome:4533 \
  -e NAVIDROME_USERNAME=admin \
  -e NAVIDROME_PASSWORD=yourpassword \
  -e MUSIC_LIBRARY_PATH=/music \
  --name tag-writer \
  navidrome-tag-writer
```

### Complete Docker Compose

```yaml
services:
  navidrome:
    image: deluan/navidrome:latest
    ports:
      - "4533:4533"
    volumes:
      - ./data:/data
      - /path/to/music:/music
    environment:
      ND_SCANSCHEDULE: "@every 1m"
  
  tag-writer:
    build: ./tag-writer-service
    ports:
      - "3001:3001"
    volumes:
      - /path/to/music:/music
    environment:
      - NAVIDROME_URL=http://navidrome:4533
      - NAVIDROME_USERNAME=admin
      - NAVIDROME_PASSWORD=yourpassword
      - MUSIC_LIBRARY_PATH=/music
      - CORS_ORIGINS=http://localhost:3000
    depends_on:
      - navidrome
  
  upload-service:
    build: ./upload-service
    ports:
      - "3002:3002"
    volumes:
      - /path/to/music:/music
      - /tmp/uploads:/tmp/uploads
    environment:
      - NAVIDROME_URL=http://navidrome:4533
      - NAVIDROME_USERNAME=admin
      - NAVIDROME_PASSWORD=yourpassword
      - MUSIC_LIBRARY_PATH=/music
    depends_on:
      - navidrome
  
  aonsoku:
    image: ghcr.io/victoralvesf/aonsoku:latest
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=http://navidrome:4533
      - VITE_TAG_WRITER_SERVICE_URL=http://tag-writer:3001
      - VITE_UPLOAD_SERVICE_URL=http://upload-service:3002
    depends_on:
      - navidrome
      - tag-writer
      - upload-service
```

### Podman Quadlet

```ini
[Unit]
Description=Aonsoku Container

[Container]
ContainerName=aonsoku
Image=ghcr.io/victoralvesf/aonsoku:latest
PublishPort=8080:8080
AutoUpdate=registry

[Service]
Restart=always

[Install]
WantedBy=multi-user.target default.target
```

## macOS Users

### "App cannot be opened" or Crash on Launch

Since this application is not signed and notarized by Apple, macOS Gatekeeper may block it.

**Solution:**

1. Move Aonsoku to `/Applications` folder

2. Open Terminal and run:
```bash
# Remove quarantine attribute
sudo xattr -cr /Applications/Aonsoku.app

# Re-sign the application locally
sudo codesign --force --deep --sign - /Applications/Aonsoku.app
```

3. Launch Aonsoku normally

## Troubleshooting

### Services Won't Start

**Check if ports are in use:**
```bash
# Linux/Mac
lsof -i :3000,3001,3002

# Windows
netstat -ano | findstr :3000
```

**Run services individually to see errors:**
```bash
npm run dev:frontend
npm run dev:tag-writer
npm run dev:upload
```

### .env File Issues

**File not found in IDE/Explorer (WSL users):**
- This is normal on Windows + WSL
- Use `nano .env` or `code .env` to edit from terminal
- Or create it from Windows side: `Copy-Item .env.example .env` in PowerShell

**Variables not loading:**
- Verify `.env` exists at root: `ls -la .env`
- Check for typos in variable names
- Restart services after editing .env

### Missing .env Variables

Make sure:
1. `.env` file exists at root (not in service directories)
2. All required variables are set (see `.env.example`)
3. No extra spaces around `=` signs
4. Values with spaces are quoted: `PATH="/my path/music"`

### Tag Writer Service Issues

**"Music file not found on disk":**
- Check that `TAG_WRITER_MUSIC_PATH` is correctly set
- Verify the path matches Navidrome's music folder
- Ensure the service has read/write permissions

**"Failed to trigger Navidrome rescan":**
- Verify `NAVIDROME_URL` is accessible
- Check Navidrome credentials are correct
- Ensure Navidrome API is enabled

**Tags not updating in Navidrome:**
- Wait for the rescan to complete (check Navidrome logs)
- Manually trigger a rescan from Navidrome UI
- Check file permissions

### Upload Service Issues

**Files not appearing:**
- Verify `UPLOAD_MUSIC_PATH` matches Navidrome's music folder
- Check Navidrome has read/write permissions
- Manually trigger scan in Navidrome

**Metadata not saving:**
- Only MP3 files support metadata editing
- Check file isn't read-only

### YouTube Integration

**Invalid API key:**
- Verify key in `.env` is correct
- Check YouTube Data API v3 is enabled
- Ensure API key restrictions allow your domain

**Videos not loading:**
- Check browser console for errors
- Verify API quota hasn't been exceeded
- Clear browser cache

### CORS Errors

Update `TAG_WRITER_CORS_ORIGINS` in `.env`:
```env
TAG_WRITER_CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Cannot Connect to Navidrome

- Verify `VITE_API_URL` and `NAVIDROME_URL` are correct
- Check Navidrome server is running
- Verify network connectivity
- Check CORS settings in Navidrome

## Security Notes

**Never commit your .env file!** It contains:
- Passwords
- API keys
- Sensitive configuration

The `.gitignore` is configured to prevent this, but always double-check:
```bash
git status  # Should NOT show .env
```

**Rotate credentials if exposed:**
- YouTube API key
- Navidrome password

## License

MIT License - see [LICENSE.txt](LICENSE.txt)

## Credits

- Original Aonsoku by [Victor Alves](https://github.com/victoralvesf/aonsoku)
- Integrates with [Navidrome](https://www.navidrome.org/)
- Uses [music-metadata](https://github.com/Borewit/music-metadata) for tag reading
- Uses [node-id3](https://github.com/Zazama/node-id3) for tag writing
- YouTube integration via [YouTube Data API v3](https://developers.google.com/youtube/v3)

## Repository

https://github.com/onyxdagoat1/aonsoku-fork
