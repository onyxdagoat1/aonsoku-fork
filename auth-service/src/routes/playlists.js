const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const playlistModel = require('../models/playlist');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Share playlist
router.post('/share', authenticateToken,
  [
    body('navidromePlaylistId').notEmpty().isString(),
    body('name').notEmpty().isLength({ max: 255 }).trim(),
    body('description').optional().isLength({ max: 1000 }).trim(),
    body('isPublic').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { navidromePlaylistId, name, description, isPublic } = req.body;

      const playlist = await playlistModel.create({
        userId: req.user.id,
        navidromePlaylistId,
        name,
        description,
        isPublic: isPublic !== false
      });

      res.status(201).json({
        success: true,
        playlist,
        shareUrl: `${process.env.FRONTEND_URL}/shared/playlist/${playlist.share_token}`
      });
    } catch (error) {
      console.error('Share playlist error:', error);
      res.status(500).json({ error: 'Failed to share playlist' });
    }
  }
);

// Get shared playlist by token
router.get('/shared/:token', optionalAuth, async (req, res) => {
  try {
    const playlist = await playlistModel.findByToken(req.params.token);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Check if playlist is public or user is owner
    if (!playlist.is_public && (!req.user || req.user.id !== playlist.user_id)) {
      return res.status(403).json({ error: 'This playlist is private' });
    }

    // Increment view count
    await playlistModel.incrementViews(playlist.id);

    res.json(playlist);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
});

// Get user's shared playlists
router.get('/user/:userId', async (req, res) => {
  try {
    const playlists = await playlistModel.getByUserId(req.params.userId);
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

// Get current user's playlists
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const playlists = await playlistModel.getByUserId(req.user.id);
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your playlists' });
  }
});

// Get all public playlists
router.get('/public', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const playlists = await playlistModel.getPublic(limit, offset);
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch public playlists' });
  }
});

// Update playlist
router.put('/:id', authenticateToken,
  [
    body('name').optional().isLength({ max: 255 }).trim(),
    body('description').optional().isLength({ max: 1000 }).trim(),
    body('isPublic').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const updates = {};
      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.description !== undefined) updates.description = req.body.description;
      if (req.body.isPublic !== undefined) updates.is_public = req.body.isPublic;

      const playlist = await playlistModel.update(req.params.id, req.user.id, updates);
      if (!playlist) {
        return res.status(404).json({ error: 'Playlist not found or not authorized' });
      }

      res.json({ success: true, playlist });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update playlist' });
    }
  }
);

// Delete playlist
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const success = await playlistModel.delete(req.params.id, req.user.id);
    if (!success) {
      return res.status(404).json({ error: 'Playlist not found or not authorized' });
    }

    res.json({ success: true, message: 'Playlist deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
});

module.exports = router;