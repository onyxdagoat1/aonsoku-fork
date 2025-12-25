# Aonsoku Upload Service v2

Clean, bulletproof music upload and metadata editing service.

## Features

✅ Upload single or multiple music files  
✅ Read/write MP3 metadata (ID3v2)  
✅ Cover art support (drag & drop)  
✅ Upload history tracking  
✅ Automatic file organization  
✅ Path resolution that actually works  
✅ Proper error handling  

## Quick Start

### 1. Install Dependencies

```bash
cd upload-service-v2
npm install
```

### 2. Configure

Create `.env` file:

```bash
cp .env.example .env
nano .env
```

**Required:**
```env
MUSIC_PATH=/path/to/your/music/library
```

This MUST be the exact same path as your Navidrome music folder!

### 3. Run

```bash
npm start
```

You should see:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Aonsoku Upload Service v2.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Server:    http://localhost:3001
  Music:     /your/music/path
  Navidrome: Enabled
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## API Endpoints

### Upload

**Upload Single File**
```
POST /api/upload
Content-Type: multipart/form-data

Fields:
- audio: audio file
- cover: cover image (optional)
- metadata: JSON string with tags
```

**Upload Multiple Files**
```
POST /api/upload/batch
Content-Type: multipart/form-data

Fields:
- files: array of audio files
```

**Get Upload History**
```
GET /api/upload/history?limit=100
```

### Metadata

**Read Metadata**
```
POST /api/metadata/read
Content-Type: application/json

{
  "filePath": "Artist/Album/Song.mp3"
}
```

**Update Metadata**
```
POST /api/metadata/update
Content-Type: multipart/form-data

Fields:
- filePath: path to file
- metadata: JSON string with updated tags
- coverart: new cover image (optional)
```

### Health Check

```
GET /health
```

## Architecture

```
src/
├── index.js              # Main server
├── config.js             # Configuration with validation
├── services/
│   ├── FileService.js    # All file operations & path resolution
│   ├── MetadataService.js # Read/write audio metadata
│   └── HistoryService.js  # Upload history tracking
└── routes/
    ├── upload.js         # Upload endpoints
    └── metadata.js       # Metadata endpoints
```

## How It Works

### Path Resolution

The FileService handles ALL path operations with 3 strategies:

1. **Absolute path** - If path is absolute, check if it exists
2. **Relative to music** - Join with MUSIC_PATH and check
3. **Basename search** - Look for filename in music root

This handles paths from:
- Navidrome API (absolute)
- Upload history (relative)
- Manual input (either)

### File Organization

Files are automatically organized as:
```
MUSIC_PATH/
└── Artist Name/
    └── Album Name/
        └── Track Title.mp3
```

### Upload History

Stored in `data/history.json`, tracks:
- Original filename
- Current relative path (auto-updates when file moves)
- Upload timestamp
- File size
- Metadata snapshot

## Troubleshooting

### "MUSIC_PATH does not exist"

Check your `.env` file and make sure the path exists:

```bash
ls -la /path/from/env/file
```

### "File not found" errors

The error response includes all attempted paths:

```json
{
  "error": "File not found",
  "inputPath": "Artist/Song.mp3",
  "musicPath": "/music",
  "attempts": [
    { "strategy": "absolute", "path": "Artist/Song.mp3" },
    { "strategy": "relative-to-music", "path": "/music/Artist/Song.mp3" },
    { "strategy": "basename-in-music", "path": "/music/Song.mp3" }
  ]
}
```

Check which path should have worked and verify the file exists there.

### Port already in use

```bash
# Find process using port 3001
lsof -i :3001

# Kill it
kill -9 <PID>

# Or use a different port in .env
PORT=3002
```

## Development

**Watch mode (auto-restart):**
```bash
npm run dev
```

**Test endpoints:**
```bash
# Health check
curl http://localhost:3001/health

# Read metadata
curl -X POST http://localhost:3001/api/metadata/read \
  -H "Content-Type: application/json" \
  -d '{"filePath": "Artist/Album/Song.mp3"}'
```

## Supported Formats

**Currently:**
- ✅ MP3 (full read/write support)

**Coming Soon:**
- FLAC
- M4A/AAC
- OGG/OPUS

## Migration from v1

The v2 service is a complete rewrite with:
- Simpler configuration (just `MUSIC_PATH`)
- Better error messages
- More reliable path resolution
- Cleaner code architecture

You can run v1 and v2 side-by-side on different ports to test.

## License

Same as Aonsoku project
