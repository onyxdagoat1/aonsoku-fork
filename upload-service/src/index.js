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
app.use(express.json());

// Ensure upload directory exists
await fs.mkdir(config.uploadDir, { recursive: true });

// Helper function to move files across filesystems
async function moveFile(source, destination) {
  try {
    // Try rename first (faster if same filesystem)
    await fs.rename(source, destination);
  } catch (error) {
    if (error.code === 'EXDEV') {
      // Cross-device link error - copy then delete
      await fs.copyFile(source, destination);
      await fs.unlink(source);
    } else {
      throw error;
    }
  }
}

// Configure multer for file uploads
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

const upload = multer({
  storage,
  limits: {
    fileSize: config.maxFileSize, // 100MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.mp3', '.flac', '.m4a', '.ogg', '.opus', '.wav', '.aac', '.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`));
    }
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'aonsoku-upload' });
});

// Get metadata from uploaded file
app.post('/api/upload/metadata', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const metadata = await parseFile(filePath);

    // Clean up the temp file after reading metadata
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
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { metadata } = req.body;
    let parsedMetadata = null;

    if (metadata) {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch (e) {
        console.warn('Failed to parse metadata JSON:', e);
      }
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();

    // Write ID3 tags if metadata provided and file is MP3
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

        // Add album art if provided
        if (parsedMetadata.coverArt) {
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

    // Move file to final destination
    const finalFilename = sanitize(parsedMetadata?.title || req.file.originalname);
    const artistFolder = sanitize(parsedMetadata?.artist || 'Unknown Artist');
    const albumFolder = sanitize(parsedMetadata?.album || 'Unknown Album');
    
    const finalDir = path.join(config.musicLibraryPath, artistFolder, albumFolder);
    await fs.mkdir(finalDir, { recursive: true });
    
    const finalPath = path.join(finalDir, `${finalFilename}${ext}`);
    await moveFile(filePath, finalPath);

    // Trigger Navidrome scan
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
        originalName: req.file.originalname,
        path: finalPath,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up file on error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        console.error('Failed to clean up file:', e);
      }
    }
    
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// Trigger Navidrome library scan
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

// Batch upload endpoint - NOW WITH METADATA EXTRACTION
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
        
        // Handle image files (cover art)
        if (isImage) {
          // For now, skip images in batch mode
          // TODO: Associate with albums
          await fs.unlink(file.path);
          continue;
        }

        // Extract metadata from audio file
        let metadata = null;
        try {
          const fileMetadata = await parseFile(file.path);
          metadata = fileMetadata.common;
        } catch (error) {
          console.warn(`Could not extract metadata from ${file.originalname}:`, error.message);
        }

        // Use metadata for folder structure
        const artistFolder = sanitize(metadata?.artist || metadata?.albumArtist || 'Unknown Artist');
        const albumFolder = sanitize(metadata?.album || 'Unknown Album');
        const trackTitle = sanitize(metadata?.title || path.parse(file.originalname).name);
        
        const finalDir = path.join(config.musicLibraryPath, artistFolder, albumFolder);
        await fs.mkdir(finalDir, { recursive: true });
        
        const finalPath = path.join(finalDir, `${trackTitle}${ext}`);
        await moveFile(file.path, finalPath);

        results.push({
          originalName: file.originalname,
          path: finalPath,
          size: file.size,
          artist: metadata?.artist,
          album: metadata?.album,
          title: metadata?.title
        });

        console.log(`Uploaded: ${artistFolder}/${albumFolder}/${trackTitle}${ext}`);
      } catch (error) {
        console.error(`Error uploading ${file.originalname}:`, error);
        errors.push({
          file: file.originalname,
          error: error.message
        });
        
        // Clean up on error
        try {
          await fs.unlink(file.path);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }

    // Trigger scan after batch upload
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

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error', 
    details: error.message 
  });
});

// Start server
app.listen(config.port, () => {
  console.log(`Upload service running on port ${config.port}`);
  console.log(`Upload directory: ${config.uploadDir}`);
  console.log(`Music library: ${config.musicLibraryPath}`);
});
