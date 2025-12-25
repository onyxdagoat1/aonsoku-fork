# Aonsoku Upload Service V2 - Setup Guide

## Complete Fresh Start

This is a **complete rewrite** from scratch with:
- ✅ Rock-solid path resolution
- ✅ Proper error handling
- ✅ Clean architecture
- ✅ Simple configuration
- ✅ Bulletproof file operations

## Prerequisites

- Node.js 18+
- Your music library folder (same one Navidrome uses)

## Step 1: Install Backend

### 1.1 Navigate to Service Directory

```bash
cd upload-service-v2
```

### 1.2 Install Dependencies

```bash
npm install
```

This installs:
- `express` - Web server
- `multer` - File uploads
- `node-id3` - MP3 tag writing (most reliable)
- `music-metadata` - Tag reading (all formats)
- `cors`, `axios`, `sanitize-filename`, `dotenv`

### 1.3 Configure

Create `.env` file:

```bash
cp .env.example .env
nano .env
```

**Minimum required configuration:**

```env
MUSIC_PATH=/absolute/path/to/your/music/library
```

**Example (Linux/Mac):**
```env
MUSIC_PATH=/home/username/Music
```

**Example (Windows with WSL):**
```env
MUSIC_PATH=/mnt/d/Music
```

**Example (Docker):**
```env
MUSIC_PATH=/music
```

**Full configuration options:**

```env
# Required
MUSIC_PATH=/path/to/music

# Optional - defaults shown
PORT=3001
UPLOAD_PATH=./uploads
DATA_PATH=./data

# Optional - Navidrome integration
NAVIDROME_URL=http://localhost:4533
NAVIDROME_USER=admin
NAVIDROME_PASSWORD=your_password
```

### 1.4 Start Backend

```bash
npm start
```

You should see:

```
════════════════════════════════════════
  Aonsoku Upload Service v2.0
════════════════════════════════════════
  Server:    http://localhost:3001
  Music:     /your/music/path
  Navidrome: Enabled
════════════════════════════════════════
```

**If you see an error:**

❌ **"MUSIC_PATH does not exist"**
- The path in your `.env` doesn't exist
- Check the path: `ls -la /path/from/env`
- Fix the path in `.env` and restart

❌ **"Port 3001 already in use"**
- Another service is using port 3001
- Either kill it: `lsof -i :3001` then `kill -9 <PID>`
- Or change port in `.env`: `PORT=3002`

❌ **"Missing required environment variables"**
- You didn't create `.env` or it's empty
- Copy from `.env.example` and fill it out

## Step 2: Test Backend

### 2.1 Health Check

In a new terminal:

```bash
curl http://localhost:3001/health
```

Should return:
```json
{
  "status": "ok",
  "service": "aonsoku-upload-v2",
  "version": "2.0.0",
  "config": {
    "musicPath": "/your/music/path",
    "navidromeEnabled": true
  }
}
```

### 2.2 Test File Resolution

If you have an existing music file at `Artist/Album/Song.mp3`:

```bash
curl -X POST http://localhost:3001/api/metadata/read \
  -H "Content-Type: application/json" \
  -d '{"filePath": "Artist/Album/Song.mp3"}'
```

Should return the metadata.

If it fails, you'll see exactly what paths it tried:

```json
{
  "error": "File not found",
  "inputPath": "Artist/Album/Song.mp3",
  "musicPath": "/music",
  "attempts": [
    { "strategy": "absolute", "path": "Artist/Album/Song.mp3" },
    { "strategy": "relative-to-music", "path": "/music/Artist/Album/Song.mp3" },
    { "strategy": "basename-in-music", "path": "/music/Song.mp3" }
  ]
}
```

This helps you debug exactly where the file should be!

## Step 3: Update Frontend

The frontend has already been updated to work with v2!

### 3.1 Check Configuration

Make sure the frontend points to the right port:

```bash
grep -r "VITE_UPLOAD_SERVICE_URL" .
```

If you need to change it, create/edit `.env.local`:

```env
VITE_UPLOAD_SERVICE_URL=http://localhost:3001
```

### 3.2 Start Frontend

```bash
npm run dev
```

### 3.3 Test in Browser

1. **Open Aonsoku** in your browser
2. **Navigate to Upload page**
3. **Try uploading a file**
4. **Check Upload History** - previously uploaded files should work!
5. **Try editing tags** from upload history

Watch the backend terminal for logs:
```
2025-12-25T06:00:00.000Z POST /api/upload/history
2025-12-25T06:00:05.000Z POST /api/metadata/read
2025-12-25T06:00:10.000Z POST /api/metadata/update
```

## Step 4: Migration from Old Service

### Option A: Run Side-by-Side (Recommended)

Run v2 on port 3001 and old service on 3002 to test:

**Old service:**
```bash
cd upload-service
PORT=3002 npm start
```

**New service:**
```bash
cd upload-service-v2
npm start  # uses port 3001
```

Switch between them in `.env.local`:
```env
VITE_UPLOAD_SERVICE_URL=http://localhost:3001  # v2
# VITE_UPLOAD_SERVICE_URL=http://localhost:3002  # old
```

### Option B: Direct Migration

1. **Stop old service**
2. **Copy upload history** (optional):
   ```bash
   cp upload-service/data/upload-history.json upload-service-v2/data/history.json
   ```
3. **Start v2 service**
4. **Test thoroughly**
5. **If all works, delete old service**

## Common Issues & Solutions

### Backend Won't Start

**Check Node version:**
```bash
node --version  # Should be 18+
```

**Check dependencies installed:**
```bash
cd upload-service-v2
ls node_modules  # Should have many folders
```

**Re-install if needed:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### File Not Found Errors

**The error shows you exactly what to check:**

```json
{
  "attempts": [
    { "strategy": "relative-to-music", "path": "/music/Artist/Song.mp3" }
  ]
}
```

**Check if file exists:**
```bash
ls -la "/music/Artist/Song.mp3"
```

**If file is elsewhere, either:**
- Move it to the expected location
- Fix `MUSIC_PATH` in `.env`
- Fix the path passed from frontend

### Upload History Doesn't Work

**Check history file:**
```bash
cat upload-service-v2/data/history.json
```

**If empty or missing:**
- Upload a new file
- It will create the history automatically

**If paths are wrong:**
- Upload history stores relative paths
- Make sure `MUSIC_PATH` matches where files actually are

### Frontend Can't Connect

**Check backend is running:**
```bash
curl http://localhost:3001/health
```

**Check port in frontend config:**
```bash
cat .env.local  # Should have correct port
```

**Check browser console:**
- Open DevTools (F12)
- Look for CORS or connection errors
- Make sure you're using `http://` not `https://`

## Architecture Overview

```
upload-service-v2/
├── src/
│   ├── index.js              # Main Express server
│   ├── config.js             # Configuration with validation
│   ├── services/
│   │   ├── FileService.js    # ALL file operations (path resolution, move, delete)
│   │   ├── MetadataService.js # Read/write tags (MP3 supported, more coming)
│   │   └── HistoryService.js # Upload history tracking
│   └── routes/
│       ├── upload.js         # POST /api/upload, /api/upload/batch, GET /api/upload/history
│       └── metadata.js       # POST /api/metadata/read, /api/metadata/update
├── data/
│   └── history.json          # Upload history (auto-created)
├── uploads/                  # Temporary upload directory (auto-created)
├── .env                      # Your configuration
├── .env.example              # Template
└── package.json
```

**Key Design Principles:**

1. **Single Responsibility** - Each service does one thing
2. **Error Handling** - All errors are caught and explained
3. **Path Resolution** - FileService handles ALL path operations
4. **No Globals** - Clean dependency injection
5. **Security** - All resolved paths checked against music library

## What's Different from V1

| Feature | V1 (Old) | V2 (New) |
|---------|----------|----------|
| Configuration | Multiple env vars | Just `MUSIC_PATH` required |
| Path Resolution | Broken/unreliable | 3-strategy system that works |
| Error Messages | Generic | Shows exactly what it tried |
| Architecture | Monolithic | Clean service separation |
| Metadata Writing | Complex multi-library | node-id3 (most reliable) |
| Upload History | Broken paths | Auto-updates when files move |
| Code Quality | Messy | Clean, documented, typed |

## Supported Features

**Currently Working:**
- ✅ Upload single MP3 file with metadata
- ✅ Upload multiple MP3 files (batch)
- ✅ Read MP3 metadata
- ✅ Update MP3 metadata
- ✅ Cover art (read/write)
- ✅ Upload history with auto-sync
- ✅ File organization (Artist/Album/Title)
- ✅ Path resolution (absolute/relative/filename)

**Coming Soon:**
- ⏳ FLAC support
- ⏳ M4A/AAC support
- ⏳ OGG/OPUS support
- ⏳ Navidrome auto-scan

## Next Steps

1. ✅ **Verify backend is running**
   ```bash
   curl http://localhost:3001/health
   ```

2. ✅ **Test file upload** through frontend

3. ✅ **Test metadata editing** from upload history

4. ✅ **Test album editing** (Edit Single/Comp Tags)

5. ✅ **Monitor backend logs** for any errors

6. 📝 **Report issues** with:
   - Exact error message
   - Backend logs
   - Your `.env` (without passwords)
   - What you were trying to do

## Help

If stuck:

1. Check backend logs (terminal where `npm start` is running)
2. Check browser console (F12 → Console tab)
3. Try the health check endpoint
4. Read the error messages - v2 tells you exactly what's wrong!
5. Check this guide for common issues

---

**Status: Ready for Testing** 🚀

Branch: `upload-rewrite`  
Backend: `upload-service-v2/`  
Frontend: Updated API client  
