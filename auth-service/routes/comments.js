const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { validate, commentValidation } = require('../utils/validators');
const { writeLimiter } = require('../middleware/rateLimit');

function createCommentRoutes(db) {
  const router = express.Router();

  /**
   * Get comments for a song
   */
  router.get('/song/:songId', optionalAuth(db), async (req, res) => {
    try {
      const { songId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      let comments;
      if (db.type === 'sqlite') {
        comments = db.all(
          `SELECT c.*, u.username, u.avatar_url,
                  (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as likes_count
           FROM comments c
           JOIN users u ON c.user_id = u.id
           WHERE c.song_id = ? AND c.is_deleted = 0 AND c.parent_comment_id IS NULL
           ORDER BY c.created_at DESC
           LIMIT ? OFFSET ?`,
          [songId, parseInt(limit), parseInt(offset)]
        );
      } else {
        const result = await db.query(
          `SELECT c.*, u.username, u.avatar_url,
                  (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as likes_count
           FROM comments c
           JOIN users u ON c.user_id = u.id
           WHERE c.song_id = $1 AND c.is_deleted = false AND c.parent_comment_id IS NULL
           ORDER BY c.created_at DESC
           LIMIT $2 OFFSET $3`,
          [songId, parseInt(limit), parseInt(offset)]
        );
        comments = result.rows;
      }

      res.json({
        success: true,
        comments
      });
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({
        error: 'Failed to get comments',
        message: error.message
      });
    }
  });

  /**
   * Get comments for an album
   */
  router.get('/album/:albumId', optionalAuth(db), async (req, res) => {
    try {
      const { albumId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      let comments;
      if (db.type === 'sqlite') {
        comments = db.all(
          `SELECT c.*, u.username, u.avatar_url,
                  (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as likes_count
           FROM comments c
           JOIN users u ON c.user_id = u.id
           WHERE c.album_id = ? AND c.is_deleted = 0 AND c.parent_comment_id IS NULL
           ORDER BY c.created_at DESC
           LIMIT ? OFFSET ?`,
          [albumId, parseInt(limit), parseInt(offset)]
        );
      } else {
        const result = await db.query(
          `SELECT c.*, u.username, u.avatar_url,
                  (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as likes_count
           FROM comments c
           JOIN users u ON c.user_id = u.id
           WHERE c.album_id = $1 AND c.is_deleted = false AND c.parent_comment_id IS NULL
           ORDER BY c.created_at DESC
           LIMIT $2 OFFSET $3`,
          [albumId, parseInt(limit), parseInt(offset)]
        );
        comments = result.rows;
      }

      res.json({
        success: true,
        comments
      });
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({
        error: 'Failed to get comments',
        message: error.message
      });
    }
  });

  /**
   * Create a comment
   */
  router.post(
    '/',
    requireAuth(db),
    writeLimiter,
    validate(commentValidation),
    async (req, res) => {
      try {
        const { content, song_id, album_id, artist_id, playlist_id, parent_comment_id } = req.body;
        const userId = req.user.id;

        if (!song_id && !album_id && !artist_id && !playlist_id) {
          return res.status(400).json({
            error: 'Invalid request',
            message: 'Must specify at least one of: song_id, album_id, artist_id, playlist_id'
          });
        }

        const id = uuidv4();
        const now = new Date().toISOString();

        if (db.type === 'sqlite') {
          db.run(
            `INSERT INTO comments (id, user_id, song_id, album_id, artist_id, playlist_id, content, parent_comment_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, userId, song_id, album_id, artist_id, playlist_id, content, parent_comment_id, now, now]
          );
        } else {
          await db.query(
            `INSERT INTO comments (id, user_id, song_id, album_id, artist_id, playlist_id, content, parent_comment_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [id, userId, song_id, album_id, artist_id, playlist_id, content, parent_comment_id]
          );
        }

        // Get created comment with user info
        let comment;
        if (db.type === 'sqlite') {
          comment = db.get(
            `SELECT c.*, u.username, u.avatar_url FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.id = ?`,
            [id]
          );
        } else {
          const result = await db.query(
            `SELECT c.*, u.username, u.avatar_url FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.id = $1`,
            [id]
          );
          comment = result.rows[0];
        }

        res.status(201).json({
          success: true,
          message: 'Comment created successfully',
          comment
        });
      } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({
          error: 'Failed to create comment',
          message: error.message
        });
      }
    }
  );

  /**
   * Delete a comment
   */
  router.delete('/:id', requireAuth(db), async (req, res) => {
    try {
      const commentId = req.params.id;
      const userId = req.user.id;

      // Get comment
      let comment;
      if (db.type === 'sqlite') {
        comment = db.get('SELECT * FROM comments WHERE id = ?', [commentId]);
      } else {
        const result = await db.query('SELECT * FROM comments WHERE id = $1', [commentId]);
        comment = result.rows[0];
      }

      if (!comment) {
        return res.status(404).json({
          error: 'Comment not found',
          message: 'The requested comment does not exist'
        });
      }

      if (comment.user_id !== userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only delete your own comments'
        });
      }

      // Soft delete
      if (db.type === 'sqlite') {
        db.run(
          'UPDATE comments SET is_deleted = 1, content = "[deleted]" WHERE id = ?',
          [commentId]
        );
      } else {
        await db.query(
          'UPDATE comments SET is_deleted = true, content = $1 WHERE id = $2',
          ['[deleted]', commentId]
        );
      }

      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({
        error: 'Failed to delete comment',
        message: error.message
      });
    }
  });

  return router;
}

module.exports = { createCommentRoutes };
