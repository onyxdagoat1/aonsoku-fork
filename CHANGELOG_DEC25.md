# Changelog - December 25, 2025

## Major Improvements

### 1. Album Display Logic

**Fixed:** Single-track albums now correctly display as "Single" instead of "Comp"

- Albums with `songCount === 1` are labeled as "Single"
- Multi-track albums show as "Album" or "Comp"
- Contextual display throughout the UI

### 2. Edit Album Tags - Moved to Dropdown Menu

**Changed:** Removed inline "Edit Album Tags" button, moved to 3-dot menu

- Cleaner UI with less button clutter
- Contextual naming: "Edit Single Tags" or "Edit Comp Tags"
- Accessible from the album options menu (3-dot button)
- Full dialog experience with progress tracking

**How to use:**
1. Navigate to any album
2. Click the 3-dot menu button
3. Select "Edit Single Tags" or "Edit Comp Tags"
4. Edit metadata and save

### 3. Drag and Drop Cover Art Upload

**Added:** Drag and drop functionality for cover art uploads

**Features:**
- Drag image files directly onto the cover art area
- Visual feedback when dragging (highlight effect)
- Works in all metadata editors:
  - Upload page
  - Album edit dialog
  - Individual song edit dialog
- Maintains existing click-to-upload functionality
- Shows preview immediately

**User Experience:**
- Drag image over cover area → Blue highlight appears
- Drop image → Instant preview
- Can also click to browse files (original behavior)
- Remove button (X) to clear selection

### 4. File Path Resolution - MAJOR FIX

**Fixed:** "File not found" errors when editing metadata

**Problem:** 
- Navidrome API returns absolute paths (e.g., `/mnt/d/.../music/Artist/Album/song.mp3`)
- Upload history stores relative paths (e.g., `Artist/Album/song.mp3`)
- Backend couldn't handle both formats

**Solution:**
- Smart path resolution function that tries multiple strategies:
  1. Check if path is absolute and file exists
  2. Join with music library path and check
  3. Search for filename in music library
- Better error messages showing all attempted paths
- Works with paths from:
  - Navidrome API (absolute)
  - Upload history (relative)
  - Manual input

**Configuration Required:**
```env
# upload-service/.env
MUSIC_LIBRARY_PATH=/mnt/d/website_2.0/aonsoku-fork/music
```
Must exactly match your Navidrome music folder!

### 5. Upload History Synchronization

**Added:** Upload history now updates when files are moved/renamed

**Features:**
- When metadata changes cause file reorganization, history is updated
- File paths in history stay accurate
- No more "file not found" errors from outdated history
- Automatic sync during:
  - Individual song edits
  - Album-wide edits
  - Any metadata change that moves files

**Technical Details:**
- New `updateHistoryPath()` function in `history-storage.js`
- Tracks old path → new path changes
- Persists to `upload-history.json`
- Maintains history integrity across edits

### 6. Right-Click Edit Tags (Verification)

**Status:** Already implemented in previous updates

**Features:**
- Right-click any song → "Edit Tags" option
- Works from:
  - Album view
  - Search results
  - Playlist view
  - Queue view
- Full metadata editor dialog
- Cover art upload support

## Files Changed

### Frontend

1. **`src/app/components/album/options.tsx`**
   - Added full edit dialog to dropdown menu
   - Contextual naming (Single/Comp)
   - Progress tracking for bulk updates

2. **`src/app/components/album/buttons.tsx`**
   - Removed inline Edit Album Tags button
   - Cleaner button layout

3. **`src/app/components/upload/CoverArtUpload.tsx`**
   - Added drag and drop support
   - Visual feedback on drag over
   - Maintains click-to-upload

### Backend

4. **`upload-service/src/index.js`**
   - Smart file path resolution with `resolveFilePath()`
   - Upload history sync on file moves
   - Better error messages with attempted paths

5. **`upload-service/src/history-storage.js`**
   - New `updateHistoryPath()` function
   - Syncs history when files are reorganized

### Documentation

6. **`METADATA_EDITING_FEATURES.md`**
   - Updated troubleshooting section
   - File path resolution explanation
   - Configuration guide

## User Benefits

### Improved UX
- ✅ Cleaner album UI (less button clutter)
- ✅ Faster cover art uploads (drag and drop)
- ✅ Correct Single vs Album labeling
- ✅ Contextual menu options

### Reliability
- ✅ No more "file not found" errors
- ✅ Upload history stays accurate
- ✅ Works with files from any source
- ✅ Better error messages for debugging

### Workflow
- ✅ Edit tags from 3-dot menu
- ✅ Drag images instead of browsing
- ✅ Right-click for quick edits
- ✅ Upload history always works

## Breaking Changes

**None** - All changes are backwards compatible!

## Migration Guide

### For Existing Installations

1. **Pull latest code:**
   ```bash
   git checkout testing
   git pull origin testing
   ```

2. **Verify environment:**
   ```bash
   cd upload-service
   cat .env
   ```
   Ensure `MUSIC_LIBRARY_PATH` matches Navidrome's music folder

3. **Restart upload service:**
   ```bash
   cd upload-service
   npm start
   ```

4. **Restart frontend:**
   ```bash
   npm run dev
   ```

5. **Test the changes:**
   - Navigate to any album
   - Click 3-dot menu → "Edit Single/Comp Tags"
   - Try dragging an image onto the cover area
   - Edit a song from upload history

## Known Issues

**None reported** - Please open an issue if you encounter problems!

## Future Enhancements

Potential next steps:
- Batch select multiple songs for editing
- Fetch metadata from online databases (MusicBrainz, Last.fm)
- Tag templates for common scenarios
- Keyboard shortcuts for editing
- Undo functionality

## Technical Notes

### Path Resolution Algorithm

```javascript
1. Try absolute path as-is
2. If fails, join with MUSIC_LIBRARY_PATH
3. If fails, search for basename in MUSIC_LIBRARY_PATH
4. If all fail, return detailed error with all attempts
```

### History Update Flow

```javascript
1. User edits metadata
2. Backend writes new tags to file
3. If artist/album/title changed, file is moved
4. updateHistoryPath(oldPath, newPath) called
5. History JSON updated and saved
6. Upload history reflects new location
```

### Drag and Drop Implementation

```javascript
1. dragover event → set isDragging = true
2. Visual feedback (border highlight)
3. drop event → extract image file
4. Read as DataURL → show preview
5. Call onCoverArtSelected(file)
```

## Testing Checklist

- [x] Single-track albums show "Single" label
- [x] Edit button in 3-dot menu works
- [x] Drag and drop cover art works
- [x] File path resolution handles absolute paths
- [x] File path resolution handles relative paths
- [x] Upload history updates on file moves
- [x] Right-click edit tags works
- [x] Error messages show attempted paths
- [x] Album-wide edits work correctly
- [x] Individual song edits work correctly

## Credits

All improvements developed and tested on December 25, 2025.

---

**Version:** 2.0.0  
**Branch:** testing  
**Status:** Ready for testing  
**Compatibility:** Navidrome 0.49.0+
