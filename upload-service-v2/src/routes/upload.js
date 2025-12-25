import express from 'express';
import multer from 'multer';
import { extname } from 'path';
import config from '../config.js';
import FileService from '../services/FileService.js';
import MetadataService from '../services/MetadataService.js';
import HistoryService from '../services/HistoryService.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await FileService.ensureDir(config.uploadPath);
    cb(null, config.uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    cb(null, `${timestamp}-${random}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSize },
  fileFilter: (req, file, cb) => {
    const allowed = ['.mp3', '.flac', '.m4a', '.ogg', '.opus', '.wav'];
    const ext = extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not supported`));
    }
  },
});

const coverUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed for cover art'));
    }
  },
});

/**
 * POST /api/upload
 * Upload single audio file with metadata
 */
router.post('/', upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files?.audio?.[0]) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const audioFile = req.files.audio[0];
    const coverFile = req.files.cover?.[0];
    const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};

    // Read cover art if provided
    let coverArt = null;
    if (coverFile) {
      coverArt = {
        data: await FileService.readFile(coverFile.path),
        format: coverFile.mimetype,
      };
      await FileService.deleteFile(coverFile.path);
    }

    // Build destination path
    const ext = extname(audioFile.originalname);
    const destPath = FileService.buildMusicPath(
      metadata.artist || 'Unknown Artist',
      metadata.album || 'Unknown Album',
      metadata.title || audioFile.originalname.replace(ext, ''),
      ext
    );

    // Ensure directory exists
    await FileService.ensureDir(destPath.split('/').slice(0, -1).join('/'));

    // Move file to music library
    await FileService.moveFile(audioFile.path, destPath);

    // Write metadata
    if (Object.keys(metadata).length > 0) {
      await MetadataService.write(destPath, metadata, coverArt);
    }

    // Add to history
    const relativePath = FileService.getRelativePath(destPath);
    await HistoryService.add({
      originalName: audioFile.originalname,
      path: relativePath,
      size: audioFile.size,
      metadata,
    });

    res.json({
      success: true,
      file: {
        path: relativePath,
        size: audioFile.size,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/upload/batch
 * Upload multiple audio files
 */
router.post('/batch', upload.array('files', config.maxFiles), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files provided' });
  }

  const results = [];
  const errors = [];

  for (const file of req.files) {
    try {
      // Read existing metadata
      const metadata = await MetadataService.read(file.path);
      
      // Build destination path from existing metadata
      const ext = extname(file.originalname);
      const destPath = FileService.buildMusicPath(
        metadata.tags.artist || 'Unknown Artist',
        metadata.tags.album || 'Unknown Album',
        metadata.tags.title || file.originalname.replace(ext, ''),
        ext
      );

      // Move file
      await FileService.moveFile(file.path, destPath);

      const relativePath = FileService.getRelativePath(destPath);
      
      // Add to history
      await HistoryService.add({
        originalName: file.originalname,
        path: relativePath,
        size: file.size,
        metadata: metadata.tags,
      });

      results.push({
        originalName: file.originalname,
        path: relativePath,
        size: file.size,
      });
    } catch (error) {
      errors.push({
        file: file.originalname,
        error: error.message,
      });

      // Clean up failed file
      try {
        await FileService.deleteFile(file.path);
      } catch {}
    }
  }

  res.json({
    success: true,
    uploaded: results.length,
    failed: errors.length,
    results,
    errors,
  });
});

/**
 * GET /api/upload/history
 * Get upload history
 */
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const history = await HistoryService.getAll(limit);
    res.json({ uploads: history });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
