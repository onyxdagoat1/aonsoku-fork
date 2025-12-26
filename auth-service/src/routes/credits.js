const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const creditModel = require('../models/credit');
const { authenticateToken } = require('../middleware/auth');

// Create editor credit
router.post('/', authenticateToken,
  [
    body('songId').notEmpty().isString(),
    body('role').notEmpty().isIn(['mixer', 'mastering', 'producer', 'editor', 'engineer', 'composer', 'arranger', 'other']),
    body('creditText').optional().isLength({ max: 500 }).trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { songId, role, creditText } = req.body;

      const credit = await creditModel.create({
        userId: req.user.id,
        songId,
        role,
        creditText
      });

      res.status(201).json({ success: true, credit });
    } catch (error) {
      console.error('Create credit error:', error);
      res.status(500).json({ error: 'Failed to create credit' });
    }
  }
);

// Get credits for song
router.get('/song/:songId', async (req, res) => {
  try {
    const credits = await creditModel.getBySongId(req.params.songId);
    res.json(credits);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch credits' });
  }
});

// Get credits by user
router.get('/user/:userId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const credits = await creditModel.getByUserId(req.params.userId, limit, offset);
    res.json(credits);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user credits' });
  }
});

// Get current user's credits
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const credits = await creditModel.getByUserId(req.user.id, limit, offset);
    res.json(credits);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your credits' });
  }
});

// Delete credit
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const success = await creditModel.delete(req.params.id, req.user.id);
    if (!success) {
      return res.status(404).json({ error: 'Credit not found or not authorized' });
    }

    res.json({ success: true, message: 'Credit deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete credit' });
  }
});

// Verify credit (admin only - TODO: add admin middleware)
router.post('/:id/verify', authenticateToken, async (req, res) => {
  try {
    // TODO: Check if user is admin
    const credit = await creditModel.verify(req.params.id, req.user.id);
    res.json({ success: true, credit });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify credit' });
  }
});

module.exports = router;