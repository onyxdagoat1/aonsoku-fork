const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const userModel = require('../models/user');
const activityModel = require('../models/activity');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Get user profile
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const profile = await userModel.getProfile(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: profile.id,
      username: profile.username,
      avatarUrl: profile.avatar_url,
      displayName: profile.display_name,
      bio: profile.bio,
      location: profile.location,
      websiteUrl: profile.website_url,
      isVerified: profile.is_verified,
      createdAt: profile.created_at
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const profile = await userModel.getProfile(req.user.id);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update current user profile
router.put('/me', authenticateToken,
  [
    body('displayName').optional().isLength({ max: 100 }).trim(),
    body('bio').optional().isLength({ max: 500 }).trim(),
    body('location').optional().isLength({ max: 100 }).trim(),
    body('websiteUrl').optional().isURL()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const updates = {};
      if (req.body.displayName !== undefined) updates.display_name = req.body.displayName;
      if (req.body.bio !== undefined) updates.bio = req.body.bio;
      if (req.body.location !== undefined) updates.location = req.body.location;
      if (req.body.websiteUrl !== undefined) updates.website_url = req.body.websiteUrl;
      if (req.body.favoriteGenres !== undefined) updates.favorite_genres = req.body.favoriteGenres;

      const profile = await userModel.updateProfile(req.user.id, updates);
      res.json({ success: true, profile });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// Get user stats
router.get('/:id/stats', async (req, res) => {
  try {
    const stats = await activityModel.getUserStats(req.params.id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get user's top songs
router.get('/:id/top-songs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const topSongs = await activityModel.getTopSongs(req.params.id, limit);
    res.json(topSongs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch top songs' });
  }
});

module.exports = router;