const express = require('express');
const { findUserById, updateUserProfile } = require('../models/user');
const { requireAuth, requireOwnership } = require('../middleware/auth');
const { validate, profileValidation } = require('../utils/validators');
const { writeLimiter } = require('../middleware/rateLimit');

function createUserRoutes(db) {
  const router = express.Router();

  /**
   * Get user profile by ID
   */
  router.get('/:id', async (req, res) => {
    try {
      const user = await findUserById(db, req.params.id);
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'The requested user does not exist'
        });
      }

      // Remove sensitive data
      delete user.password_hash;
      delete user.navidrome_user_id;

      res.json({
        success: true,
        user
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        error: 'Failed to get user',
        message: error.message
      });
    }
  });

  /**
   * Update user profile
   */
  router.put(
    '/profile',
    requireAuth(db),
    writeLimiter,
    validate(profileValidation),
    async (req, res) => {
      try {
        const updates = req.body;
        const user = await updateUserProfile(db, req.user.id, updates);

        delete user.password_hash;

        res.json({
          success: true,
          message: 'Profile updated successfully',
          user
        });
      } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
          error: 'Failed to update profile',
          message: error.message
        });
      }
    }
  );

  /**
   * Get user statistics
   */
  router.get('/:id/stats', async (req, res) => {
    try {
      const userId = req.params.id;

      let stats;
      if (db.type === 'sqlite') {
        const totalPlays = db.get(
          'SELECT SUM(play_count) as total FROM user_activity WHERE user_id = ?',
          [userId]
        );
        
        const totalTime = db.get(
          'SELECT SUM(listening_time_seconds) as total FROM user_activity WHERE user_id = ?',
          [userId]
        );
        
        const uniqueSongs = db.get(
          'SELECT COUNT(DISTINCT song_id) as count FROM user_activity WHERE user_id = ?',
          [userId]
        );
        
        const topSongs = db.all(
          `SELECT song_id, play_count, last_played
           FROM user_activity
           WHERE user_id = ?
           ORDER BY play_count DESC
           LIMIT 10`,
          [userId]
        );

        stats = {
          total_plays: totalPlays?.total || 0,
          total_listening_time_seconds: totalTime?.total || 0,
          unique_songs: uniqueSongs?.count || 0,
          top_songs: topSongs
        };
      } else {
        const totalPlays = await db.query(
          'SELECT SUM(play_count) as total FROM user_activity WHERE user_id = $1',
          [userId]
        );
        
        const totalTime = await db.query(
          'SELECT SUM(listening_time_seconds) as total FROM user_activity WHERE user_id = $1',
          [userId]
        );
        
        const uniqueSongs = await db.query(
          'SELECT COUNT(DISTINCT song_id) as count FROM user_activity WHERE user_id = $1',
          [userId]
        );
        
        const topSongs = await db.query(
          `SELECT song_id, play_count, last_played
           FROM user_activity
           WHERE user_id = $1
           ORDER BY play_count DESC
           LIMIT 10`,
          [userId]
        );

        stats = {
          total_plays: parseInt(totalPlays.rows[0]?.total) || 0,
          total_listening_time_seconds: parseInt(totalTime.rows[0]?.total) || 0,
          unique_songs: parseInt(uniqueSongs.rows[0]?.count) || 0,
          top_songs: topSongs.rows
        };
      }

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        error: 'Failed to get statistics',
        message: error.message
      });
    }
  });

  return router;
}

module.exports = { createUserRoutes };
