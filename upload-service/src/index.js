import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import sanitize from 'sanitize-filename';
import { parseFile } from 'music-metadata';
import axios from 'axios';
import config from './config.js';
import { writeMp3Metadata, writeFlacMetadata, writeM4aMetadata, writeOggMetadata } from './metadata-writers.js';
import { loadHistory, saveHistory, addToHistory } from './history-storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Ensure upload directory exists
await fs.mkdir(config.uploadDir, { recursive: true });

// Load upload history from persistent storage
let uploadHistory = await loadHistory();

// Helper function to move files across filesystems
async function moveFile(source, destination) {
  try {
    await fs.rename(source, destination);
  } catch (error) {
    if (error.code === 'EXDEV') {
      await fs.copyFile(source, destination);
      await fs.unlink(source);
    } else {
      throw error;
    }
  }
}

// Helper to remove extension from filename
function removeExtension(filename) {
  const ext = path.extname(filename);
  return ext ? filename.slice(0, -ext.length) : filename;
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = config.uploadDir;
    await fs.mkdir(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${sanitize(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.mp3', '.flac', '.m4a', '.ogg', '.opus', '.wav', '.aac', '.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`));
  }
};

// Main upload multer instance
const upload = multer({
  storage,
  limits: {
    fileSize: config.maxFileSize,
    fieldSize: 10 * 1024 * 1024,
  },
  fileFilter
});

// Metadata update multer instance
const metadataUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    fieldSize: 10 * 1024 * 1024,
  },
  fileFilter
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'aonsoku-upload' });
});

// Get upload history
app.get('/api/upload/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json({
    uploads: uploadHistory.slice(0, limit)
  });
});

// Get metadata from a file path
app.post('/api/metadata/read', async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path required' });
    }

    const fullPath = path.join(config.musicLibraryPath, filePath);
    const normalizedPath = path.normalize(fullPath);
    
    if (!normalizedPath.startsWith(config.musicLibraryPath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const metadata = await parseFile(normalizedPath);
    
    res.json({
      format: metadata.format,
      common: metadata.common,
      filePath: filePath
    });
  } catch (error) {
    console.error('Metadata read error:', error);
    res.status(500).json({ error: 'Failed to read metadata', details: error.message });
  }
});

// Update metadata for an existing file
app.post('/api/metadata/update', metadataUpload.single('coverart'), async (req, res) => {
  try {
    const { filePath, metadata: metadataJson } = req.body;
    const coverArtFile = req.file;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path required' });
    }

    const fullPath = path.join(config.musicLibraryPath, filePath);
    const normalizedPath = path.normalize(fullPath);
    
    if (!normalizedPath.startsWith(config.musicLibraryPath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const ext = path.extname(normalizedPath).toLowerCase();
    let metadata = null;

    if (metadataJson) {
      try {
        metadata = JSON.parse(metadataJson);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid metadata JSON' });
      }
    }

    // Read existing metadata to preserve cover art if not replacing
    const existingMetadata = await parseFile(normalizedPath);
    const existingCover = existingMetadata.common.picture?.[0];

    // Handle cover art - use new if provided, otherwise keep existing
    let imageBuffer = null;
    let imageMime = 'image/jpeg';

    if (coverArtFile) {
      imageBuffer = await fs.readFile(coverArtFile.path);
      imageMime = coverArtFile.mimetype;
      await fs.unlink(coverArtFile.path);
    } else if (existingCover) {
      imageBuffer = existingCover.data;
      imageMime = existingCover.format || 'image/jpeg';
    } else if (metadata.coverArt) {
      imageBuffer = Buffer.from(metadata.coverArt, 'base64');
    }

    // Write metadata based on file type
    let success = false;
    let warning = null;

    switch (ext) {
      case '.mp3':
        await writeMp3Metadata(normalizedPath, metadata, imageBuffer, imageMime);
        success = true;
        break;
      
      case '.flac':
        success = await writeFlacMetadata(normalizedPath, metadata, imageBuffer, imageMime);
        if (!success) {
          warning = 'metaflac tool not found. Install flac package for full FLAC editing support.';
        }
        break;
      
      case '.m4a':
      case '.aac':
        success = await writeM4aMetadata(normalizedPath, metadata, imageBuffer, imageMime);
        if (!success) {
          warning = 'ffmpeg not found. Install ffmpeg for full M4A/AAC editing support.';
        }
        break;
      
      case '.ogg':
      case '.opus':
        success = await writeOggMetadata(normalizedPath, metadata, imageBuffer, imageMime);
        if (!success) {
          warning = 'ffmpeg not found. Install ffmpeg for full OGG/OPUS editing support.';
        }
        break;
      
      default:
        return res.status(400).json({ 
          error: `Metadata editing not supported for ${ext} files` 
        });
    }

    // Move file if artist/album/title changed
    const newArtist = sanitize(metadata.artist || 'Unknown Artist');
    const newAlbum = sanitize(metadata.album || 'Unknown Album');
    // Remove extension from title before adding it back
    const newTitle = sanitize(removeExtension(metadata.title || path.parse(filePath).name));
    
    const newDir = path.join(config.musicLibraryPath, newArtist, newAlbum);
    const newPath = path.join(newDir, `${newTitle}${ext}`);

    if (normalizedPath !== newPath) {
      await fs.mkdir(newDir, { recursive: true });
      await moveFile(normalizedPath, newPath);
      
      try {
        const oldDir = path.dirname(normalizedPath);
        const files = await fs.readdir(oldDir);
        if (files.length === 0) {
          await fs.rmdir(oldDir);
        }
      } catch (e) {}
    }

    if (config.navidromeUrl) {
      try {
        await triggerNavidromeScan();
      } catch (error) {
        console.error('Failed to trigger scan:', error.message);
      }
    }

    res.json({
      success: true,
      message: 'Metadata updated successfully',
      newPath: path.relative(config.musicLibraryPath, newPath),
      warning: warning
    });
  } catch (error) {
    console.error('Metadata update error:', error);
    res.status(500).json({ error: 'Failed to update metadata', details: error.message });
  }
});

// Get metadata from uploaded file
app.post('/api/upload/metadata', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const metadata = await parseFile(filePath);

    await fs.unlink(filePath);

    res.json({
      format: metadata.format,
      common: metadata.common,
      native: metadata.native
    });
  } catch (error) {
    console.error('Metadata extraction error:', error);
    res.status(500).json({ error: 'Failed to extract metadata', details: error.message });
  }
});

// Upload file with metadata
app.post('/api/upload', upload.fields([{ name: 'file', maxCount: 1 }, { name: 'coverart', maxCount: 1 }]), async (req, res) => {
  try {
    if (!req.files || !req.files['file']) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const audioFile = req.files['file'][0];
    const coverArtFile = req.files['coverart'] ? req.files['coverart'][0] : null;
    const { metadata } = req.body;
    let parsedMetadata = null;

    if (metadata) {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch (e) {
        console.warn('Failed to parse metadata JSON:', e);
      }
    }

    const filePath = audioFile.path;
    const ext = path.extname(audioFile.originalname).toLowerCase();

    // Handle cover art
    let imageBuffer = null;
    let imageMime = 'image/jpeg';

    if (coverArtFile) {
      imageBuffer = await fs.readFile(coverArtFile.path);
      imageMime = coverArtFile.mimetype;
      await fs.unlink(coverArtFile.path);
    } else if (parsedMetadata?.coverArt) {
      imageBuffer = Buffer.from(parsedMetadata.coverArt, 'base64');
    }

    // Write metadata if provided
    if (parsedMetadata) {
      try {
        switch (ext) {
          case '.mp3':
            await writeMp3Metadata(filePath, parsedMetadata, imageBuffer, imageMime);
            break;
          case '.flac':
            await writeFlacMetadata(filePath, parsedMetadata, imageBuffer, imageMime);
            break;
          case '.m4a':
          case '.aac':
            await writeM4aMetadata(filePath, parsedMetadata, imageBuffer, imageMime);
            break;
          case '.ogg':
          case '.opus':
            await writeOggMetadata(filePath, parsedMetadata, imageBuffer, imageMime);
            break;
        }
      } catch (error) {
        console.error('Failed to write metadata:', error);
      }
    }

    // Remove extension from title/filename before adding it back
    const baseFilename = parsedMetadata?.title || removeExtension(audioFile.originalname);
    const finalFilename = sanitize(baseFilename);
    const artistFolder = sanitize(parsedMetadata?.artist || 'Unknown Artist');
    const albumFolder = sanitize(parsedMetadata?.album || 'Unknown Album');
    
    const finalDir = path.join(config.musicLibraryPath, artistFolder, albumFolder);
    await fs.mkdir(finalDir, { recursive: true });
    
    const finalPath = path.join(finalDir, `${finalFilename}${ext}`);
    await moveFile(filePath, finalPath);

    // Add to history and save
    const historyItem = {
      id: uuidv4(),
      originalName: audioFile.originalname,
      path: path.relative(config.musicLibraryPath, finalPath),
      size: audioFile.size,
      artist: parsedMetadata?.artist,
      album: parsedMetadata?.album,
      title: parsedMetadata?.title,
      uploadedAt: new Date().toISOString()
    };
    
    uploadHistory = await addToHistory(uploadHistory, historyItem);

    if (config.navidromeUrl) {
      try {
        await triggerNavidromeScan();
      } catch (error) {
        console.error('Failed to trigger Navidrome scan:', error.message);
      }
    }

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        originalName: audioFile.originalname,
        path: path.relative(config.musicLibraryPath, finalPath),
        size: audioFile.size
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    if (req.files) {
      for (const fieldFiles of Object.values(req.files)) {
        for (const file of fieldFiles) {
          try {
            await fs.unlink(file.path);
          } catch (e) {
            console.error('Failed to clean up file:', e);
          }
        }
      }
    }
    
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

async function triggerNavidromeScan() {
  if (!config.navidromeUrl || !config.navidromeUsername || !config.navidromePassword) {
    throw new Error('Navidrome credentials not configured');
  }

  const authParams = new URLSearchParams({
    u: config.navidromeUsername,
    p: config.navidromePassword,
    v: '1.16.1',
    c: 'aonsoku-upload',
    f: 'json'
  });

  const scanUrl = `${config.navidromeUrl}/rest/startScan?${authParams.toString()}`;
  const response = await axios.get(scanUrl);
  
  if (response.data['subsonic-response']?.status !== 'ok') {
    throw new Error('Navidrome scan failed');
  }
  
  return response.data;
}

app.post('/api/upload/batch', upload.array('files', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = [];
    const errors = [];

    for (const file of req.files) {
      try {
        const ext = path.extname(file.originalname).toLowerCase();
        const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
        
        if (isImage) {
          await fs.unlink(file.path);
          continue;
        }

        let metadata = null;
        try {
          const fileMetadata = await parseFile(file.path);
          metadata = fileMetadata.common;
        } catch (error) {
          console.warn(`Could not extract metadata from ${file.originalname}:`, error.message);
        }

        const artistFolder = sanitize(metadata?.artist || metadata?.albumArtist || 'Unknown Artist');
        const albumFolder = sanitize(metadata?.album || 'Unknown Album');
        // Remove extension from title/filename before adding it back
        const baseTitle = metadata?.title || removeExtension(file.originalname);
        const trackTitle = sanitize(baseTitle);
        
        const finalDir = path.join(config.musicLibraryPath, artistFolder, albumFolder);
        await fs.mkdir(finalDir, { recursive: true });
        
        const finalPath = path.join(finalDir, `${trackTitle}${ext}`);
        await moveFile(file.path, finalPath);

        const fileInfo = {
          id: uuidv4(),
          originalName: file.originalname,
          path: path.relative(config.musicLibraryPath, finalPath),
          size: file.size,
          artist: metadata?.artist,
          album: metadata?.album,
          title: metadata?.title,
          uploadedAt: new Date().toISOString()
        };

        results.push(fileInfo);
        uploadHistory = await addToHistory(uploadHistory, fileInfo);

        console.log(`Uploaded: ${artistFolder}/${albumFolder}/${trackTitle}${ext}`);
      } catch (error) {
        console.error(`Error uploading ${file.originalname}:`, error);
        errors.push({
          file: file.originalname,
          error: error.message
        });
        
        try {
          await fs.unlink(file.path);
        } catch (e) {}
      }
    }

    if (config.navidromeUrl && results.length > 0) {
      try {
        await triggerNavidromeScan();
        console.log('Triggered Navidrome library scan');
      } catch (error) {
        console.error('Failed to trigger scan:', error.message);
      }
    }

    res.json({
      success: true,
      uploaded: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error) {
    console.error('Batch upload error:', error);
    res.status(500).json({ error: 'Batch upload failed', details: error.message });
  }
});

app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error', 
    details: error.message 
  });
});

app.listen(config.port, () => {
  console.log(`Upload service running on port ${config.port}`);
  console.log(`Upload directory: ${config.uploadDir}`);
  console.log(`Music library: ${config.musicLibraryPath}`);
  console.log(`Upload history: ${uploadHistory.length} items loaded`);
});
