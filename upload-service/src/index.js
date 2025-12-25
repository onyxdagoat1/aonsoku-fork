import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import sanitize from 'sanitize-filename';
import { parseFile } from 'music-metadata';
import NodeID3 from 'node-id3';
import axios from 'axios';
import config from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Ensure upload directory exists
await fs.mkdir(config.uploadDir, { recursive: true });

// Upload history storage
const uploadHistory = [];

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

// Helper to add to upload history
function addToHistory(fileInfo) {
  uploadHistory.unshift({
    id: uuidv4(),
    ...fileInfo,
    uploadedAt: new Date().toISOString()
  });
  
  if (uploadHistory.length > 500) {
    uploadHistory.pop();
  }
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
    fieldSize: 10 * 1024 * 1024, // 10MB for metadata fields
  },
  fileFilter
});

// Metadata update multer instance (for cover art only)
const metadataUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for cover art
    fieldSize: 10 * 1024 * 1024, // 10MB for metadata fields
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

// Update metadata for an existing file - USE metadataUpload instance
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

    if (metadata && ext === '.mp3') {
      const tags = {
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album,
        year: metadata.year,
        trackNumber: metadata.track,
        genre: metadata.genre,
        comment: { text: metadata.comment || '' },
        albumArtist: metadata.albumArtist,
      };

      if (coverArtFile) {
        const imageBuffer = await fs.readFile(coverArtFile.path);
        tags.image = {
          mime: coverArtFile.mimetype,
          type: { id: 3, name: 'front cover' },
          description: 'Cover',
          imageBuffer: imageBuffer
        };
        await fs.unlink(coverArtFile.path);
      } else if (metadata.coverArt) {
        tags.image = {
          mime: 'image/jpeg',
          type: { id: 3, name: 'front cover' },
          description: 'Cover',
          imageBuffer: Buffer.from(metadata.coverArt, 'base64')
        };
      }

      NodeID3.write(tags, normalizedPath);

      // Move file if artist/album/title changed
      const newArtist = sanitize(metadata.artist || 'Unknown Artist');
      const newAlbum = sanitize(metadata.album || 'Unknown Album');
      const newTitle = sanitize(metadata.title || path.parse(filePath).name);
      
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
        newPath: path.relative(config.musicLibraryPath, newPath)
      });
    } else {
      res.status(400).json({ error: 'Only MP3 files support metadata editing currently' });
    }
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

    if (parsedMetadata && ext === '.mp3') {
      try {
        const tags = {
          title: parsedMetadata.title,
          artist: parsedMetadata.artist,
          album: parsedMetadata.album,
          year: parsedMetadata.year,
          trackNumber: parsedMetadata.track,
          genre: parsedMetadata.genre,
          comment: { text: parsedMetadata.comment || '' },
          albumArtist: parsedMetadata.albumArtist,
        };

        if (coverArtFile) {
          const imageBuffer = await fs.readFile(coverArtFile.path);
          tags.image = {
            mime: coverArtFile.mimetype,
            type: { id: 3, name: 'front cover' },
            description: 'Cover',
            imageBuffer: imageBuffer
          };
        } else if (parsedMetadata.coverArt) {
          tags.image = {
            mime: 'image/jpeg',
            type: { id: 3, name: 'front cover' },
            description: 'Cover',
            imageBuffer: Buffer.from(parsedMetadata.coverArt, 'base64')
          };
        }

        NodeID3.write(tags, filePath);
      } catch (error) {
        console.error('Failed to write ID3 tags:', error);
      }
    }

    if (coverArtFile) {
      await fs.unlink(coverArtFile.path);
    }

    const finalFilename = sanitize(parsedMetadata?.title || audioFile.originalname);
    const artistFolder = sanitize(parsedMetadata?.artist || 'Unknown Artist');
    const albumFolder = sanitize(parsedMetadata?.album || 'Unknown Album');
    
    const finalDir = path.join(config.musicLibraryPath, artistFolder, albumFolder);
    await fs.mkdir(finalDir, { recursive: true });
    
    const finalPath = path.join(finalDir, `${finalFilename}${ext}`);
    await moveFile(filePath, finalPath);

    addToHistory({
      originalName: audioFile.originalname,
      path: path.relative(config.musicLibraryPath, finalPath),
      size: audioFile.size,
      artist: parsedMetadata?.artist,
      album: parsedMetadata?.album,
      title: parsedMetadata?.title
    });

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
        const trackTitle = sanitize(metadata?.title || path.parse(file.originalname).name);
        
        const finalDir = path.join(config.musicLibraryPath, artistFolder, albumFolder);
        await fs.mkdir(finalDir, { recursive: true });
        
        const finalPath = path.join(finalDir, `${trackTitle}${ext}`);
        await moveFile(file.path, finalPath);

        const fileInfo = {
          originalName: file.originalname,
          path: path.relative(config.musicLibraryPath, finalPath),
          size: file.size,
          artist: metadata?.artist,
          album: metadata?.album,
          title: metadata?.title
        };

        results.push(fileInfo);
        addToHistory(fileInfo);

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
});
