# Troubleshooting Guide

## Common Issues and Solutions

### 1. Edit Dialog Closes Immediately

**Symptom:** When clicking "Edit Single/Comp Tags" in the album dropdown menu, the dialog appears briefly then closes.

**Cause:** Dialog was previously rendered inside the dropdown menu component, causing it to close when the dropdown closed.

**Solution:** ✅ FIXED in latest commit!
- Moved `EditAlbumDialog` component outside dropdown
- Dialog now stays open properly
- Update your code to latest `testing` branch

**To Update:**
```bash
git checkout testing
git pull origin testing
npm install  # if there are new dependencies
npm run dev
```

---

### 2. Upload History "File Not Found" Errors

**Symptom:** Clicking "Edit Tags" on upload history items shows:
```
Failed to read metadata
File not found
File: ara/ar/rwa.mp3
```

**Root Cause:** The file path in upload history doesn't match the actual file location.

**Debugging Steps:**

#### Step 1: Check Upload Service Logs

The backend now includes detailed logging. When you try to edit a file, you'll see:

```
[PATH RESOLUTION] Input path: ara/ar/rwa.mp3
[PATH RESOLUTION] Music library: /mnt/d/website_2.0/aonsoku-fork/music
[PATH RESOLUTION] ✗ Not found at absolute path
[PATH RESOLUTION] ✗ Not found as relative path
[PATH RESOLUTION] ✗ Not found by basename
[PATH RESOLUTION] ✗ All attempts failed
```

This tells you:
1. What path the frontend sent
2. What your music library path is configured as
3. All the places it looked for the file

#### Step 2: Verify Music Library Path

Check your `upload-service/.env` file:

```bash
cd upload-service
cat .env
```

Make sure `MUSIC_LIBRARY_PATH` exactly matches where your music files are:

```env
# WRONG - if files are actually in a subdirectory
MUSIC_LIBRARY_PATH=/mnt/d/website_2.0/aonsoku-fork

# CORRECT - match Navidrome's music folder
MUSIC_LIBRARY_PATH=/mnt/d/website_2.0/aonsoku-fork/music
```

#### Step 3: Check Actual File Location

Use the file browser or terminal to verify where the file actually is:

```bash
# Find the file
find /mnt/d/website_2.0/aonsoku-fork/music -name "rwa.mp3"

# Or list the upload history paths
cat upload-service/data/upload-history.json | grep "path"
```

#### Step 4: Check File Exists

Verify the complete path:

```bash
# Combine music library + relative path
ls -la "/mnt/d/website_2.0/aonsoku-fork/music/ara/ar/rwa.mp3"
```

If the file doesn't exist at that location:
- The file may have been moved manually
- The artist/album folders may have been renamed
- The file may have been deleted

#### Step 5: Fix Upload History

If files have been moved, you can manually edit the upload history:

```bash
cd upload-service
nano data/upload-history.json
```

Update the `path` field for affected files:

```json
{
  "id": "abc123",
  "path": "ara/ar/rwa.mp3",  // OLD - wrong location
  "path": "Correct Artist/Correct Album/song.mp3",  // NEW - actual location
}
```

Or delete the entire history and start fresh:

```bash
rm upload-service/data/upload-history.json
```

#### Step 6: Restart Upload Service

After any configuration changes:

```bash
cd upload-service
npm start
```

Watch the startup logs:
```
Upload service running on port 3001
Upload directory: /tmp/upload
Music library: /mnt/d/website_2.0/aonsoku-fork/music
Upload history: 15 items loaded
```

---

### 3. Cover Art Not Uploading

**Symptom:** Drag and drop or click upload doesn't work for cover art.

**Solutions:**

1. **Check File Size:** Images should be under 10MB
2. **Check Format:** Use JPG, PNG, or WebP
3. **Browser Console:** Open DevTools (F12) and check for errors
4. **Try Click Upload:** If drag-drop fails, try clicking the area

---

### 4. Navidrome Not Seeing Changes

**Symptom:** Edit metadata but Navidrome still shows old info.

**Solutions:**

1. **Wait for Scan:** Navidrome auto-scans every few minutes
2. **Manual Scan:** Go to Navidrome settings → Scan Library
3. **Check Credentials:** Verify `NAVIDROME_URL`, `NAVIDROME_USERNAME`, `NAVIDROME_PASSWORD` in `.env`
4. **Check Scan Logs:** Look for `[METADATA UPDATE] Triggered Navidrome scan` in upload service logs

---

### 5. Changes Don't Persist After Edit

**Symptom:** Edit metadata, it saves, but reverts back.

**Possible Causes:**

1. **File Permissions:** Upload service doesn't have write access
   ```bash
   # Check permissions
   ls -la /path/to/music/Artist/Album/
   
   # Fix if needed
   chmod 644 /path/to/music/**/*.mp3
   ```

2. **File Format Not Supported:** 
   - MP3: ✅ Fully supported
   - FLAC: ⚠️ Requires `flac` package
   - M4A/AAC: ⚠️ Requires `ffmpeg`
   - OGG/OPUS: ⚠️ Requires `ffmpeg`

3. **Navidrome Overwriting:** 
   - Check if Navidrome is set to use external metadata
   - Disable "prefer external tags" if enabled

---

### 6. Backend Not Starting

**Symptom:** Upload service won't start or crashes immediately.

**Check:**

1. **Port Already in Use:**
   ```bash
   # Check what's using port 3001
   lsof -i :3001
   
   # Kill it if needed
   kill -9 <PID>
   ```

2. **Missing Dependencies:**
   ```bash
   cd upload-service
   npm install
   ```

3. **Invalid .env File:**
   ```bash
   # Check for syntax errors
   cat upload-service/.env
   ```

4. **Check Logs:**
   ```bash
   cd upload-service
   npm start 2>&1 | tee upload-service.log
   ```

---

## Backend Logging Guide

The upload service now includes detailed logging for debugging:

### Path Resolution Logs

```
[PATH RESOLUTION] Input path: Artist/Album/song.mp3
[PATH RESOLUTION] Music library: /music
[PATH RESOLUTION] ✓ Found as relative path: /music/Artist/Album/song.mp3
```

or when it fails:

```
[PATH RESOLUTION] ✗ All attempts failed
```

### Metadata Operation Logs

```
[METADATA READ] Reading metadata from: /music/Artist/Album/song.mp3
[METADATA UPDATE] Updating: /music/Artist/Album/song.mp3
[METADATA UPDATE] Moving file: /old/path.mp3 -> /new/path.mp3
[METADATA UPDATE] Triggered Navidrome scan
[METADATA UPDATE] Success: Artist/Album/song.mp3
```

### How to Read Logs

1. **Start upload service in foreground:**
   ```bash
   cd upload-service
   npm start
   ```

2. **In another terminal, try your operation**
   (e.g., edit tags from upload history)

3. **Watch the logs in real-time**

4. **Look for:**
   - ✓ (checkmark) = success
   - ✗ (X mark) = failure
   - `[ERROR]` = critical error
   - `[WARN]` = warning

---

## Getting Help

If you're still stuck:

1. **Check Backend Logs:**
   ```bash
   cd upload-service
   npm start
   # Try the operation and copy the full log output
   ```

2. **Check Browser Console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Try the operation
   - Copy any error messages

3. **Provide Details:**
   - Exact error message
   - Backend logs
   - Browser console output
   - Your `.env` configuration (without passwords!)
   - Operating system
   - Node.js version: `node --version`

4. **Create GitHub Issue:**
   - Go to the repository
   - Click "Issues" → "New Issue"
   - Include all details from step 3

---

## Quick Fixes Summary

| Problem | Quick Fix |
|---------|----------|
| Dialog closes immediately | Update to latest `testing` branch |
| Upload history file not found | Check `MUSIC_LIBRARY_PATH` in `.env` |
| Changes don't save | Check file permissions with `ls -la` |
| Navidrome doesn't update | Wait a few minutes or manually trigger scan |
| Backend won't start | Check port 3001 isn't in use: `lsof -i :3001` |
| No cover art showing | Check browser console for errors |

---

## Configuration Checklist

✅ `upload-service/.env` exists and has:
```env
MUSIC_LIBRARY_PATH=/exact/path/to/music  # MUST match Navidrome
NAVIDROME_URL=http://localhost:4533
NAVIDROME_USERNAME=admin
NAVIDROME_PASSWORD=your_password
```

✅ Music library path is accessible:
```bash
ls -la "$MUSIC_LIBRARY_PATH"
```

✅ Upload service is running:
```bash
lsof -i :3001
```

✅ Frontend is configured:
```bash
# Check src/api/uploadService.ts for correct URL
grep "baseURL" src/api/uploadService.ts
```

---

## FAQ

**Q: Why do I see "File: ara/ar/rwa.mp3" instead of the full path?**  
A: That's the relative path stored in upload history. The backend tries to combine it with `MUSIC_LIBRARY_PATH`.

**Q: Can I delete upload history without losing files?**  
A: Yes! Upload history is just a log. Deleting `upload-history.json` won't affect your actual music files.

**Q: Why does the backend try 3 different paths?**  
A: To handle paths from different sources (Navidrome API, upload history, manual input) and account for files being moved.

**Q: What's the difference between absolute and relative paths?**  
A: 
- Absolute: `/mnt/d/music/Artist/song.mp3` (full path from root)
- Relative: `Artist/song.mp3` (relative to music library)

**Q: Do I need to restart both frontend and backend?**  
A: Usually just the one you changed. But when in doubt, restart both!

---

Last Updated: December 25, 2025
