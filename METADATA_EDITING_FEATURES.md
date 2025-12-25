# Metadata Editing Features

This document describes the metadata editing features added to the Aonsoku frontend.

## Overview

The application now supports comprehensive metadata editing for music files through multiple interfaces:

1. **Upload Page** - Edit tags during and after upload
2. **Album Page** - Edit entire album metadata or individual songs
3. **Song Context Menu** - Quick edit for any song

## Features

### 1. Upload Metadata Editor

**Location:** Upload page (`/upload`)

**Capabilities:**
- View and edit metadata immediately after file selection
- Upload cover art for songs
- Batch upload with automatic metadata extraction
- Upload history with tag editing

**Fixed Issues:**
- ✅ Cover art now displays properly from extracted audio metadata
- ✅ Fixed base64 image detection for JPEG, PNG, WebP, GIF formats
- ✅ Upload history now supports all audio formats (mp3, flac, ogg, opus, m4a, aac, wav, wma, ape)
- ✅ Fixed file path validation errors
- ✅ Improved error messages for missing/moved files
- ✅ Metadata saves correctly to backend
- ✅ Smart file path resolution for absolute and relative paths

### 2. Album-Wide Metadata Editor

**Location:** Album page - "Edit Album Tags" button

**Capabilities:**
- Update metadata for all songs in an album at once
- Change album name, album artist, year, genre
- Upload/replace cover art for entire album
- Progress indicator for bulk updates
- Preserves individual song titles and track numbers
- Detailed success/error reporting

**How to Use:**
1. Navigate to any album page
2. Click "Edit Album Tags" button (next to Play, Shuffle, etc.)
3. Modify album-level metadata
4. Optionally upload new cover art
5. Click "Update Album"
6. Wait for progress to complete

### 3. Individual Song Metadata Editor

**Location:** Song context menu / dropdown menu

**Capabilities:**
- Edit tags for a single song
- Update title, artist, album, year, track number, genre, comments
- Upload/change cover art
- Available from any song in any view

**How to Use:**
1. Right-click on any song (or click the three-dot menu)
2. Select "Edit Tags" from the menu
3. Modify metadata fields
4. Optionally upload cover art
5. Click "Save Metadata"

## Component Structure

### New Components

- `src/app/components/album/edit-metadata-button.tsx` - Individual song editor button
- `src/app/components/album/edit-album-button.tsx` - Bulk album editor

### Modified Components

- `src/app/components/upload/CoverArtUpload.tsx` - Enhanced image format detection
- `src/app/components/upload/UploadHistory.tsx` - Better error handling
- `src/app/components/album/buttons.tsx` - Added album edit button
- `src/app/components/song/menu-options.tsx` - Added edit tags menu item
- `upload-service/src/index.js` - Improved file path resolution

## Technical Details

### File Path Resolution

The upload service now intelligently handles file paths from multiple sources:

1. **Absolute paths** - Checks if file exists at the given path
2. **Relative paths** - Joins with music library path
3. **Fallback** - Searches for filename in music library

This handles paths from:
- Navidrome API (absolute paths)
- Upload history (relative paths)
- Manual input

### API Integration

All metadata editing uses the upload service API:

```typescript
// Read current metadata
const metadata = await uploadService.readMetadata(filePath)

// Update metadata
const result = await uploadService.updateMetadata(
  filePath,
  newMetadata,
  coverArtFile // optional
)
```

### Data Refresh

After metadata updates, the application automatically:
- Invalidates React Query caches
- Refetches album/song data
- Updates the UI to reflect changes

### Error Handling

- Clear error messages with file paths
- Shows all attempted path resolutions
- Warnings for files that were moved/renamed
- Partial success reporting for bulk operations
- Loading states during metadata operations

## Supported Audio Formats

- MP3
- FLAC
- OGG
- OPUS
- M4A
- AAC
- WAV
- WMA
- APE

## Troubleshooting

### Cover Art Not Showing

**Issue:** Cover art doesn't display when editing

**Solution:** The cover art component now properly detects base64 formats. If you still see issues:
- Check browser console for errors
- Verify the audio file actually contains embedded artwork
- Try uploading a new cover image

### "File Not Found" Errors (FIXED)

**Issue:** Cannot edit metadata - "ENOENT: no such file or directory"

**Solution:** This has been fixed! The backend now:
- Tries the path as provided (absolute or relative)
- Joins path with music library directory
- Searches for filename in music library
- Shows all attempted paths in error message

**If you still get errors:**
1. Check the error message to see which paths were tried
2. Verify your `MUSIC_LIBRARY_PATH` in `.env` matches Navidrome's music folder
3. Ensure files are actually in the music library
4. Check file permissions

### Metadata Not Saving

**Issue:** Changes don't persist

**Solution:**
- Check upload service is running (`npm start` in upload-service folder)
- Verify file permissions (upload service needs write access)
- Look for errors in upload service logs
- Ensure Navidrome has been configured to scan for changes

### Album Updates Partially Fail

**Issue:** Some songs update, others fail

**Solution:**
- Review the error messages for specific files
- Check file permissions for failed files
- Try editing failed songs individually
- Verify file format is supported

### Music Library Path Mismatch

**Issue:** Upload service can't find files from Navidrome

**Solution:**
1. Check your `upload-service/.env` file
2. Ensure `MUSIC_LIBRARY_PATH` exactly matches Navidrome's music folder
3. Use absolute paths (e.g., `/mnt/d/website_2.0/aonsoku-fork/music`)
4. Restart upload service after changing `.env`

**Example `.env`:**
```env
MUSIC_LIBRARY_PATH=/path/to/navidrome/music
NAVIDROME_URL=http://localhost:4533
NAVIDROME_USERNAME=admin
NAVIDROME_PASSWORD=password
```

## Best Practices

1. **Before Bulk Editing:** Review album info first
2. **Cover Art:** Use high-quality images (at least 500x500px)
3. **Batch Uploads:** Use batch mode for full albums
4. **After Editing:** Allow Navidrome time to rescan (usually automatic)
5. **Backups:** Keep original files backed up before mass edits
6. **Path Configuration:** Ensure music library paths match between services

## Future Enhancements

Potential improvements:
- Bulk edit multiple selected songs
- Fetch metadata from online databases
- Automatic tag cleanup/standardization
- Undo functionality
- Tag templates for common scenarios

## Integration with Backend

All metadata changes are handled by the upload service middleware. The Navidrome backend remains untouched and will automatically detect file changes through its built-in scanning mechanism.

### Workflow:
1. User edits metadata in frontend
2. Changes sent to upload service
3. Upload service resolves file path (handles absolute/relative)
4. Upload service updates audio file tags
5. Navidrome detects file changes
6. Navidrome updates its database
7. Frontend refreshes data from Navidrome

## Notes

- All changes are pushed to the `testing` branch
- Backend Navidrome integration remains unchanged
- Upload service must be running for editing features to work
- Changes may take a few seconds to appear in Navidrome
- File paths are now resolved intelligently from multiple sources
