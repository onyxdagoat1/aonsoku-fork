const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const commentModel = require('../models/comment');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Create comment
router.post('/', authenticateToken,
  [
    body('content').isLength({ min: 1, max: 2000 }).trim(),
    body('songId').optional().isString(),
    body('albumId').optional().isString(),
    body('parentCommentId').optional().isInt()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { content, songId, albumId, parentCommentId } = req.body;

      if (!songId && !albumId) {
        return res.status(400).json({ error: 'Either songId or albumId is required' });
      }

      const comment = await commentModel.create({
        userId: req.user.id,
        songId,
        albumId,
        content,
        parentCommentId
      });

      res.status(201).json({ success: true, comment });
    } catch (error) {
      console.error('Create comment error:', error);
      res.status(500).json({ error: 'Failed to create comment' });
    }
  }
);

// Get comments for song
router.get('/song/:songId', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const comments = await commentModel.getBySongId(req.params.songId, limit, offset);

    // Get replies for each comment
    for (const comment of comments) {
      comment.replies = await commentModel.getReplies(comment.id);
      if (req.user) {
        comment.hasLiked = await commentModel.hasLiked(req.user.id, comment.id);
      }
    }

    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Get comments for album
router.get('/album/:albumId', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const comments = await commentModel.getByAlbumId(req.params.albumId, limit, offset);

    // Get replies for each comment
    for (const comment of comments) {
      comment.replies = await commentModel.getReplies(comment.id);
      if (req.user) {
        comment.hasLiked = await commentModel.hasLiked(req.user.id, comment.id);
      }
    }

    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Update comment
router.put('/:id', authenticateToken,
  [body('content').isLength({ min: 1, max: 2000 }).trim()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const comment = await commentModel.findById(req.params.id);
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      if (comment.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const updated = await commentModel.update(req.params.id, req.body.content);
      res.json({ success: true, comment: updated });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update comment' });
    }
  }
);

// Delete comment
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const comment = await commentModel.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await commentModel.delete(req.params.id);
    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Like comment
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const comment = await commentModel.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    await commentModel.like(req.user.id, req.params.id);
    res.json({ success: true, message: 'Comment liked' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to like comment' });
  }
});

// Unlike comment
router.delete('/:id/like', authenticateToken, async (req, res) => {
  try {
    await commentModel.unlike(req.user.id, req.params.id);
    res.json({ success: true, message: 'Comment unliked' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unlike comment' });
  }
});

module.exports = router;