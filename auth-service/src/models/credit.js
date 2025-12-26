const db = require('../config/database');
const DB_TYPE = process.env.DB_TYPE || 'sqlite';

class CreditModel {
  // Create editor credit
  async create({ userId, songId, role, creditText }) {
    if (DB_TYPE === 'sqlite') {
      const stmt = db.prepare(`
        INSERT INTO editor_credits (user_id, song_id, role, credit_text)
        VALUES (?, ?, ?, ?)
      `);
      const result = stmt.run(userId, songId, role, creditText || null);
      return this.findById(result.lastInsertRowid);
    } else {
      const result = await db.query(
        'INSERT INTO editor_credits (user_id, song_id, role, credit_text) VALUES ($1, $2, $3, $4) RETURNING id',
        [userId, songId, role, creditText || null]
      );
      return this.findById(result.rows[0].id);
    }
  }

  // Find credit by ID
  async findById(id) {
    if (DB_TYPE === 'sqlite') {
      return db.prepare(`
        SELECT ec.*, u.username, u.avatar_url, p.display_name
        FROM editor_credits ec
        JOIN users u ON ec.user_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE ec.id = ?
      `).get(id);
    } else {
      const result = await db.query(`
        SELECT ec.*, u.username, u.avatar_url, p.display_name
        FROM editor_credits ec
        JOIN users u ON ec.user_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE ec.id = $1
      `, [id]);
      return result.rows[0];
    }
  }

  // Get credits for song
  async getBySongId(songId) {
    if (DB_TYPE === 'sqlite') {
      return db.prepare(`
        SELECT ec.*, u.username, u.avatar_url, p.display_name
        FROM editor_credits ec
        JOIN users u ON ec.user_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE ec.song_id = ?
        ORDER BY ec.created_at DESC
      `).all(songId);
    } else {
      const result = await db.query(`
        SELECT ec.*, u.username, u.avatar_url, p.display_name
        FROM editor_credits ec
        JOIN users u ON ec.user_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE ec.song_id = $1
        ORDER BY ec.created_at DESC
      `, [songId]);
      return result.rows;
    }
  }

  // Get credits by user
  async getByUserId(userId, limit = 50, offset = 0) {
    if (DB_TYPE === 'sqlite') {
      return db.prepare(`
        SELECT ec.*, u.username, u.avatar_url, p.display_name
        FROM editor_credits ec
        JOIN users u ON ec.user_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE ec.user_id = ?
        ORDER BY ec.created_at DESC
        LIMIT ? OFFSET ?
      `).all(userId, limit, offset);
    } else {
      const result = await db.query(`
        SELECT ec.*, u.username, u.avatar_url, p.display_name
        FROM editor_credits ec
        JOIN users u ON ec.user_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE ec.user_id = $1
        ORDER BY ec.created_at DESC
        LIMIT $2 OFFSET $3
      `, [userId, limit, offset]);
      return result.rows;
    }
  }

  // Delete credit
  async delete(creditId, userId) {
    if (DB_TYPE === 'sqlite') {
      const result = db.prepare('DELETE FROM editor_credits WHERE id = ? AND user_id = ?').run(creditId, userId);
      return result.changes > 0;
    } else {
      const result = await db.query('DELETE FROM editor_credits WHERE id = $1 AND user_id = $2', [creditId, userId]);
      return result.rowCount > 0;
    }
  }

  // Verify credit (admin only)
  async verify(creditId, verifiedBy) {
    if (DB_TYPE === 'sqlite') {
      db.prepare('UPDATE editor_credits SET is_verified = 1, verified_by = ? WHERE id = ?').run(verifiedBy, creditId);
    } else {
      await db.query('UPDATE editor_credits SET is_verified = true, verified_by = $1 WHERE id = $2', [verifiedBy, creditId]);
    }
    return this.findById(creditId);
  }
}

module.exports = new CreditModel();