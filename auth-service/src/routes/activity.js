const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const activityModel = require('../models/activity');
const { authenticateToken } = require('../middleware/auth');

// Record song play
router.post('/play', authenticateToken,
  [
    body('songId').notEmpty().isString(),
    body('albumId').optional().isString(),
    body('artistId').optional().isString(),
    body('durationSeconds').optional().isInt({ min: 0 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { songId, albumId, artistId, durationSeconds } = req.body;

      await activityModel.recordPlay({
        userId: req.user.id,
        songId,
        albumId,
        artistId,
        durationSeconds
      });

      res.json({ success: true, message: 'Play recorded' });
    } catch (error) {
      console.error('Record play error:', error);
      res.status(500).json({ error: 'Failed to record play' });
    }
  }
);

// Get user stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await activityModel.getUserStats(req.user.id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get user's top songs
router.get('/top-songs', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const topSongs = await activityModel.getTopSongs(req.user.id, limit);
    res.json(topSongs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch top songs' });
  }
});

// Get recent plays
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const recentPlays = await activityModel.getRecentPlays(req.user.id, limit);
    res.json(recentPlays);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent plays' });
  }
});

// Get wrapped for a year
router.get('/wrapped/:year', authenticateToken, async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    if (isNaN(year) || year < 2000 || year > new Date().getFullYear()) {
      return res.status(400).json({ error: 'Invalid year' });
    }

    const wrapped = await activityModel.getWrapped(req.user.id, year);
    res.json(wrapped);
  } catch (error) {
    console.error('Get wrapped error:', error);
    res.status(500).json({ error: 'Failed to generate wrapped' });
  }
});

// Get current year wrapped
router.get('/wrapped', authenticateToken, async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const wrapped = await activityModel.getWrapped(req.user.id, currentYear);
    res.json(wrapped);
  } catch (error) {
    console.error('Get wrapped error:', error);
    res.status(500).json({ error: 'Failed to generate wrapped' });
  }
});

module.exports = router;