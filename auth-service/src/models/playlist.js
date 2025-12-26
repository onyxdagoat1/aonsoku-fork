const db = require('../config/database');
const crypto = require('crypto');
const DB_TYPE = process.env.DB_TYPE || 'sqlite';

class PlaylistModel {
  // Create shared playlist
  async create({ userId, navidromePlaylistId, name, description, isPublic }) {
    const shareToken = crypto.randomBytes(16).toString('hex');

    if (DB_TYPE === 'sqlite') {
      const stmt = db.prepare(`
        INSERT INTO shared_playlists (user_id, navidrome_playlist_id, name, description, is_public, share_token)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(userId, navidromePlaylistId, name, description || null, isPublic ? 1 : 0, shareToken);
      return this.findById(result.lastInsertRowid);
    } else {
      const result = await db.query(
        'INSERT INTO shared_playlists (user_id, navidrome_playlist_id, name, description, is_public, share_token) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [userId, navidromePlaylistId, name, description || null, isPublic, shareToken]
      );
      return this.findById(result.rows[0].id);
    }
  }

  // Find playlist by ID
  async findById(id) {
    if (DB_TYPE === 'sqlite') {
      return db.prepare(`
        SELECT sp.*, u.username, u.avatar_url, p.display_name
        FROM shared_playlists sp
        JOIN users u ON sp.user_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE sp.id = ?
      `).get(id);
    } else {
      const result = await db.query(`
        SELECT sp.*, u.username, u.avatar_url, p.display_name
        FROM shared_playlists sp
        JOIN users u ON sp.user_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE sp.id = $1
      `, [id]);
      return result.rows[0];
    }
  }

  // Find playlist by share token
  async findByToken(shareToken) {
    if (DB_TYPE === 'sqlite') {
      return db.prepare(`
        SELECT sp.*, u.username, u.avatar_url, p.display_name
        FROM shared_playlists sp
        JOIN users u ON sp.user_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE sp.share_token = ?
      `).get(shareToken);
    } else {
      const result = await db.query(`
        SELECT sp.*, u.username, u.avatar_url, p.display_name
        FROM shared_playlists sp
        JOIN users u ON sp.user_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE sp.share_token = $1
      `, [shareToken]);
      return result.rows[0];
    }
  }

  // Get user's shared playlists
  async getByUserId(userId) {
    if (DB_TYPE === 'sqlite') {
      return db.prepare(`
        SELECT sp.*, u.username, u.avatar_url, p.display_name
        FROM shared_playlists sp
        JOIN users u ON sp.user_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE sp.user_id = ?
        ORDER BY sp.created_at DESC
      `).all(userId);
    } else {
      const result = await db.query(`
        SELECT sp.*, u.username, u.avatar_url, p.display_name
        FROM shared_playlists sp
        JOIN users u ON sp.user_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE sp.user_id = $1
        ORDER BY sp.created_at DESC
      `, [userId]);
      return result.rows;
    }
  }

  // Get all public playlists
  async getPublic(limit = 50, offset = 0) {
    if (DB_TYPE === 'sqlite') {
      return db.prepare(`
        SELECT sp.*, u.username, u.avatar_url, p.display_name
        FROM shared_playlists sp
        JOIN users u ON sp.user_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE sp.is_public = 1
        ORDER BY sp.created_at DESC
        LIMIT ? OFFSET ?
      `).all(limit, offset);
    } else {
      const result = await db.query(`
        SELECT sp.*, u.username, u.avatar_url, p.display_name
        FROM shared_playlists sp
        JOIN users u ON sp.user_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE sp.is_public = true
        ORDER BY sp.created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
      return result.rows;
    }
  }

  // Increment view count
  async incrementViews(playlistId) {
    if (DB_TYPE === 'sqlite') {
      db.prepare('UPDATE shared_playlists SET view_count = view_count + 1 WHERE id = ?').run(playlistId);
    } else {
      await db.query('UPDATE shared_playlists SET view_count = view_count + 1 WHERE id = $1', [playlistId]);
    }
  }

  // Update playlist
  async update(playlistId, userId, updates) {
    const allowedFields = ['name', 'description', 'is_public'];
    const fields = Object.keys(updates).filter(k => allowedFields.includes(k));
    
    if (fields.length === 0) return this.findById(playlistId);

    if (DB_TYPE === 'sqlite') {
      const setClause = fields.map(f => `${f} = ?`).join(', ');
      const values = fields.map(f => updates[f]);
      db.prepare(`UPDATE shared_playlists SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`).run(...values, playlistId, userId);
    } else {
      const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
      const values = fields.map(f => updates[f]);
      await db.query(`UPDATE shared_playlists SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${fields.length + 1} AND user_id = $${fields.length + 2}`, [...values, playlistId, userId]);
    }

    return this.findById(playlistId);
  }

  // Delete playlist
  async delete(playlistId, userId) {
    if (DB_TYPE === 'sqlite') {
      const result = db.prepare('DELETE FROM shared_playlists WHERE id = ? AND user_id = ?').run(playlistId, userId);
      return result.changes > 0;
    } else {
      const result = await db.query('DELETE FROM shared_playlists WHERE id = $1 AND user_id = $2', [playlistId, userId]);
      return result.rowCount > 0;
    }
  }
}

module.exports = new PlaylistModel();