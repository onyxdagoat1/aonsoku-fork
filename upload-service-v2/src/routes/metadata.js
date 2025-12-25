import express from 'express';
import multer from 'multer';
import { extname } from 'path';
import config from '../config.js';
import FileService from '../services/FileService.js';
import MetadataService from '../services/MetadataService.js';
import HistoryService from '../services/HistoryService.js';

const router = express.Router();

// Configure multer for cover art uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: config.uploadPath,
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

/**
 * POST /api/metadata/read
 * Read metadata from file
 */
router.post('/read', async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'filePath required' });
    }

    const metadata = await MetadataService.read(filePath);
    res.json(metadata);
  } catch (error) {
    console.error('Read metadata error:', error);
    
    if (error.code === 'FILE_NOT_FOUND') {
      return res.status(404).json({
        error: 'File not found',
        details: error.message,
        inputPath: error.inputPath,
        musicPath: error.musicPath,
        attempts: error.attempts,
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/metadata/update
 * Update metadata for file
 */
router.post('/update', upload.single('coverart'), async (req, res) => {
  try {
    const { filePath, metadata: metadataJson } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'filePath required' });
    }

    const metadata = metadataJson ? JSON.parse(metadataJson) : {};
    
    // Handle cover art
    let coverArt = null;
    if (req.file) {
      coverArt = {
        data: await FileService.readFile(req.file.path),
        format: req.file.mimetype,
      };
      await FileService.deleteFile(req.file.path);
    }

    // Get current path
    const oldPath = await FileService.resolvePath(filePath);
    const oldRelativePath = FileService.getRelativePath(oldPath);

    // Update metadata
    await MetadataService.update(oldPath, metadata, coverArt);

    // Check if file needs to be moved (artist/album/title changed)
    const ext = extname(oldPath);
    const newPath = FileService.buildMusicPath(
      metadata.artist || metadata.albumArtist,
      metadata.album,
      metadata.title,
      ext
    );

    let finalPath = oldPath;
    if (newPath !== oldPath) {
      // Move file to new location
      finalPath = await FileService.moveFile(oldPath, newPath);
      
      // Update history
      const newRelativePath = FileService.getRelativePath(finalPath);
      await HistoryService.updatePath(oldRelativePath, newRelativePath);
      
      // Clean up empty directories
      await FileService.cleanupEmptyDirs(oldPath.split('/').slice(0, -1).join('/'));
    }

    res.json({
      success: true,
      path: FileService.getRelativePath(finalPath),
    });
  } catch (error) {
    console.error('Update metadata error:', error);
    
    if (error.code === 'FILE_NOT_FOUND') {
      return res.status(404).json({
        error: 'File not found',
        details: error.message,
        inputPath: error.inputPath,
        musicPath: error.musicPath,
        attempts: error.attempts,
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

export default router;
