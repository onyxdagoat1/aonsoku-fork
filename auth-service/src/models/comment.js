const db = require('../config/database');
const DB_TYPE = process.env.DB_TYPE || 'sqlite';

class CommentModel {
  // Create comment
  async create({ userId, songId, albumId, content, parentCommentId }) {
    if (DB_TYPE === 'sqlite') {
      const stmt = db.prepare(`
        INSERT INTO comments (user_id, song_id, album_id, content, parent_comment_id)
        VALUES (?, ?, ?, ?, ?)
      `);
      const result = stmt.run(userId, songId || null, albumId || null, content, parentCommentId || null);
      return this.findById(result.lastInsertRowid);
    } else {
      const result = await db.query(
        'INSERT INTO comments (user_id, song_id, album_id, content, parent_comment_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [userId, songId || null, albumId || null, content, parentCommentId || null]
      );
      return this.findById(result.rows[0].id);
    }
  }

  // Find comment by ID
  async findById(id) {
    if (DB_TYPE === 'sqlite') {
      return db.prepare(`
        SELECT c.*, u.username, u.avatar_url, p.display_name
        FROM comments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE c.id = ? AND c.is_deleted = 0
      `).get(id);
    } else {
      const result = await db.query(`
        SELECT c.*, u.username, u.avatar_url, p.display_name
        FROM comments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE c.id = $1 AND c.is_deleted = false
      `, [id]);
      return result.rows[0];
    }
  }

  // Get comments for song
  async getBySongId(songId, limit = 50, offset = 0) {
    if (DB_TYPE === 'sqlite') {
      return db.prepare(`
        SELECT c.*, u.username, u.avatar_url, p.display_name
        FROM comments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE c.song_id = ? AND c.is_deleted = 0 AND c.parent_comment_id IS NULL
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `).all(songId, limit, offset);
    } else {
      const result = await db.query(`
        SELECT c.*, u.username, u.avatar_url, p.display_name
        FROM comments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE c.song_id = $1 AND c.is_deleted = false AND c.parent_comment_id IS NULL
        ORDER BY c.created_at DESC
        LIMIT $2 OFFSET $3
      `, [songId, limit, offset]);
      return result.rows;
    }
  }

  // Get comments for album
  async getByAlbumId(albumId, limit = 50, offset = 0) {
    if (DB_TYPE === 'sqlite') {
      return db.prepare(`
        SELECT c.*, u.username, u.avatar_url, p.display_name
        FROM comments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE c.album_id = ? AND c.is_deleted = 0 AND c.parent_comment_id IS NULL
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `).all(albumId, limit, offset);
    } else {
      const result = await db.query(`
        SELECT c.*, u.username, u.avatar_url, p.display_name
        FROM comments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE c.album_id = $1 AND c.is_deleted = false AND c.parent_comment_id IS NULL
        ORDER BY c.created_at DESC
        LIMIT $2 OFFSET $3
      `, [albumId, limit, offset]);
      return result.rows;
    }
  }

  // Get replies to a comment
  async getReplies(parentCommentId) {
    if (DB_TYPE === 'sqlite') {
      return db.prepare(`
        SELECT c.*, u.username, u.avatar_url, p.display_name
        FROM comments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE c.parent_comment_id = ? AND c.is_deleted = 0
        ORDER BY c.created_at ASC
      `).all(parentCommentId);
    } else {
      const result = await db.query(`
        SELECT c.*, u.username, u.avatar_url, p.display_name
        FROM comments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE c.parent_comment_id = $1 AND c.is_deleted = false
        ORDER BY c.created_at ASC
      `, [parentCommentId]);
      return result.rows;
    }
  }

  // Update comment
  async update(commentId, content) {
    if (DB_TYPE === 'sqlite') {
      db.prepare('UPDATE comments SET content = ?, is_edited = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(content, commentId);
    } else {
      await db.query('UPDATE comments SET content = $1, is_edited = true, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [content, commentId]);
    }
    return this.findById(commentId);
  }

  // Soft delete comment
  async delete(commentId) {
    if (DB_TYPE === 'sqlite') {
      db.prepare('UPDATE comments SET is_deleted = 1, content = "[deleted]", updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(commentId);
    } else {
      await db.query('UPDATE comments SET is_deleted = true, content = \'[deleted]\', updated_at = CURRENT_TIMESTAMP WHERE id = $1', [commentId]);
    }
    return true;
  }

  // Like comment
  async like(userId, commentId) {
    try {
      if (DB_TYPE === 'sqlite') {
        db.prepare('INSERT INTO comment_likes (user_id, comment_id) VALUES (?, ?)').run(userId, commentId);
        db.prepare('UPDATE comments SET likes_count = likes_count + 1 WHERE id = ?').run(commentId);
      } else {
        await db.query('INSERT INTO comment_likes (user_id, comment_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, commentId]);
        await db.query('UPDATE comments SET likes_count = likes_count + 1 WHERE id = $1', [commentId]);
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  // Unlike comment
  async unlike(userId, commentId) {
    if (DB_TYPE === 'sqlite') {
      const result = db.prepare('DELETE FROM comment_likes WHERE user_id = ? AND comment_id = ?').run(userId, commentId);
      if (result.changes > 0) {
        db.prepare('UPDATE comments SET likes_count = likes_count - 1 WHERE id = ? AND likes_count > 0').run(commentId);
      }
    } else {
      const result = await db.query('DELETE FROM comment_likes WHERE user_id = $1 AND comment_id = $2', [userId, commentId]);
      if (result.rowCount > 0) {
        await db.query('UPDATE comments SET likes_count = likes_count - 1 WHERE id = $1 AND likes_count > 0', [commentId]);
      }
    }
    return true;
  }

  // Check if user liked comment
  async hasLiked(userId, commentId) {
    if (DB_TYPE === 'sqlite') {
      const result = db.prepare('SELECT 1 FROM comment_likes WHERE user_id = ? AND comment_id = ?').get(userId, commentId);
      return !!result;
    } else {
      const result = await db.query('SELECT 1 FROM comment_likes WHERE user_id = $1 AND comment_id = $2', [userId, commentId]);
      return result.rows.length > 0;
    }
  }
}

module.exports = new CommentModel();