# Aonsoku

A modern desktop and web client for Navidrome/Subsonic music servers with advanced features including music upload, YouTube integration, and comprehensive media management.

## Quick Start - One Command Development

### 1. Install Everything

```bash
# Main app
npm install

# All services
cd tag-writer-service && npm install && cd ..
cd upload-service && npm install && cd ..
cd auth-service && npm install && cd ..
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

That's it! One command starts all 4 services:
- Main App: http://localhost:3000 (Blue)
- Tag Writer: http://localhost:3001 (Yellow)
- Upload Service: http://localhost:3002 (Green)
- Auth Service: http://localhost:3005 (Magenta)

Stop everything with `Ctrl+C`.

### File Structure - Only ONE .env

```
aonsoku-fork/
  .env                    <-- ONLY configure this file
  .env.example            <-- Template (safe to commit)
  tag-writer-service/
    .env.loader.js        <-- Reads from parent .env
  upload-service/
    .env.loader.js        <-- Reads from parent .env
  auth-service/
    .env.loader.js        <-- Reads from parent .env
```

**Delete any other .env files** in service directories - they're not needed.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
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
cd auth-service && npm install && cd ..
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

# Discord OAuth
AUTH_DISCORD_CLIENT_ID=your_client_id
AUTH_DISCORD_CLIENT_SECRET=your_secret

# JWT secrets (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
AUTH_JWT_SECRET=your_random_secret
AUTH_JWT_REFRESH_SECRET=your_random_secret
AUTH_SESSION_SECRET=your_random_secret
```

### How It Works

Each service directory has a `.env.loader.js` file that:
1. Loads the root `.env` file
2. Maps variables to service-specific names
3. Keeps all services in sync

**Variables are prefixed by service:**
- `TAG_WRITER_*` → Tag Writer Service
- `UPLOAD_*` → Upload Service
- `AUTH_*` → Auth Service
- `VITE_*` → Main Frontend App

See `.env.example` for complete documentation.

## Feature Guides

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

- [VS Code](https://code.visualstudio.com/)
- [Biome.js](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) extension

### Available Commands

```bash
# Development
npm run dev              # Run all services (recommended)
npm run dev:frontend     # Just main app
npm run dev:tag-writer   # Just tag writer
npm run dev:upload       # Just upload service
npm run dev:auth         # Just auth service

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

### Port Allocation

| Service | Port | Terminal Color |
|---------|------|----------------|
| Main App | 3000 | Blue |
| Tag Writer | 3001 | Yellow |
| Upload | 3002 | Green |
| Auth | 3005 | Magenta |
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
      - VITE_UPLOAD_SERVICE_URL=http://upload-service:3001
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
lsof -i :3000,3001,3002,3005

# Windows
netstat -ano | findstr :3000
```

**Run services individually to see errors:**
```bash
npm run dev:frontend
npm run dev:tag-writer
npm run dev:upload
npm run dev:auth
```

### Missing .env Variables

Make sure:
1. `.env` file exists at root
2. All required variables are set (see `.env.example`)
3. No typos in variable names

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
- JWT secrets
- OAuth credentials

The `.gitignore` is configured to prevent this, but always double-check:
```bash
git status  # Should NOT show .env
```

**Rotate credentials if exposed:**
- YouTube API key
- Discord OAuth secrets
- Navidrome password
- JWT secrets

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
