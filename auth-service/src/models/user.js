const db = require('../config/database');
const bcrypt = require('bcryptjs');
const DB_TYPE = process.env.DB_TYPE || 'sqlite';

class UserModel {
  // Find user by ID
  async findById(id) {
    if (DB_TYPE === 'sqlite') {
      return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    } else {
      const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows[0];
    }
  }

  // Find user by email
  async findByEmail(email) {
    if (DB_TYPE === 'sqlite') {
      return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    } else {
      const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows[0];
    }
  }

  // Find user by username
  async findByUsername(username) {
    if (DB_TYPE === 'sqlite') {
      return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    } else {
      const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
      return result.rows[0];
    }
  }

  // Find user by Google ID
  async findByGoogleId(googleId) {
    if (DB_TYPE === 'sqlite') {
      return db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);
    } else {
      const result = await db.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
      return result.rows[0];
    }
  }

  // Find user by Discord ID
  async findByDiscordId(discordId) {
    if (DB_TYPE === 'sqlite') {
      return db.prepare('SELECT * FROM users WHERE discord_id = ?').get(discordId);
    } else {
      const result = await db.query('SELECT * FROM users WHERE discord_id = $1', [discordId]);
      return result.rows[0];
    }
  }

  // Create new user with password
  async create({ email, username, password }) {
    const passwordHash = await bcrypt.hash(password, 10);

    if (DB_TYPE === 'sqlite') {
      const stmt = db.prepare(`
        INSERT INTO users (email, username, password_hash, is_verified, is_active)
        VALUES (?, ?, ?, 0, 1)
      `);
      const result = stmt.run(email, username, passwordHash);
      
      // Create profile
      db.prepare('INSERT INTO user_profiles (user_id) VALUES (?)').run(result.lastInsertRowid);
      
      return this.findById(result.lastInsertRowid);
    } else {
      const result = await db.query(
        'INSERT INTO users (email, username, password_hash, is_verified, is_active) VALUES ($1, $2, $3, false, true) RETURNING id',
        [email, username, passwordHash]
      );
      
      await db.query('INSERT INTO user_profiles (user_id) VALUES ($1)', [result.rows[0].id]);
      
      return this.findById(result.rows[0].id);
    }
  }

  // Create user from OAuth
  async createFromOAuth({ email, username, googleId, discordId, avatarUrl, displayName }) {
    if (DB_TYPE === 'sqlite') {
      const stmt = db.prepare(`
        INSERT INTO users (email, username, google_id, discord_id, avatar_url, is_verified, is_active)
        VALUES (?, ?, ?, ?, ?, 1, 1)
      `);
      const result = stmt.run(email, username, googleId || null, discordId || null, avatarUrl || null);
      
      // Create profile
      db.prepare('INSERT INTO user_profiles (user_id, display_name) VALUES (?, ?)').run(
        result.lastInsertRowid,
        displayName
      );
      
      return this.findById(result.lastInsertRowid);
    } else {
      const result = await db.query(
        'INSERT INTO users (email, username, google_id, discord_id, avatar_url, is_verified, is_active) VALUES ($1, $2, $3, $4, $5, true, true) RETURNING id',
        [email, username, googleId || null, discordId || null, avatarUrl || null]
      );
      
      await db.query('INSERT INTO user_profiles (user_id, display_name) VALUES ($1, $2)', [
        result.rows[0].id,
        displayName
      ]);
      
      return this.findById(result.rows[0].id);
    }
  }

  // Link Google account to existing user
  async linkGoogleAccount(userId, googleId, avatarUrl) {
    if (DB_TYPE === 'sqlite') {
      db.prepare('UPDATE users SET google_id = ?, avatar_url = ? WHERE id = ?').run(googleId, avatarUrl, userId);
    } else {
      await db.query('UPDATE users SET google_id = $1, avatar_url = $2 WHERE id = $3', [googleId, avatarUrl, userId]);
    }
    return this.findById(userId);
  }

  // Link Discord account to existing user
  async linkDiscordAccount(userId, discordId, avatarUrl) {
    if (DB_TYPE === 'sqlite') {
      db.prepare('UPDATE users SET discord_id = ?, avatar_url = ? WHERE id = ?').run(discordId, avatarUrl, userId);
    } else {
      await db.query('UPDATE users SET discord_id = $1, avatar_url = $2 WHERE id = $3', [discordId, avatarUrl, userId]);
    }
    return this.findById(userId);
  }

  // Verify password
  async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password_hash);
  }

  // Update user
  async update(userId, updates) {
    const allowedFields = ['username', 'avatar_url'];
    const fields = Object.keys(updates).filter(k => allowedFields.includes(k));
    
    if (fields.length === 0) return this.findById(userId);

    if (DB_TYPE === 'sqlite') {
      const setClause = fields.map(f => `${f} = ?`).join(', ');
      const values = fields.map(f => updates[f]);
      db.prepare(`UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values, userId);
    } else {
      const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
      const values = fields.map(f => updates[f]);
      await db.query(`UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${fields.length + 1}`, [...values, userId]);
    }

    return this.findById(userId);
  }

  // Get user profile
  async getProfile(userId) {
    if (DB_TYPE === 'sqlite') {
      return db.prepare(`
        SELECT u.*, p.display_name, p.bio, p.location, p.website_url, p.favorite_genres, p.custom_fields
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE u.id = ?
      `).get(userId);
    } else {
      const result = await db.query(`
        SELECT u.*, p.display_name, p.bio, p.location, p.website_url, p.favorite_genres, p.custom_fields
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE u.id = $1
      `, [userId]);
      return result.rows[0];
    }
  }

  // Update profile
  async updateProfile(userId, updates) {
    const allowedFields = ['display_name', 'bio', 'location', 'website_url', 'favorite_genres', 'custom_fields'];
    const fields = Object.keys(updates).filter(k => allowedFields.includes(k));
    
    if (fields.length === 0) return this.getProfile(userId);

    if (DB_TYPE === 'sqlite') {
      const setClause = fields.map(f => `${f} = ?`).join(', ');
      const values = fields.map(f => {
        if (['favorite_genres', 'custom_fields'].includes(f)) {
          return JSON.stringify(updates[f]);
        }
        return updates[f];
      });
      db.prepare(`UPDATE user_profiles SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`).run(...values, userId);
    } else {
      const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
      const values = fields.map(f => updates[f]);
      await db.query(`UPDATE user_profiles SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE user_id = $${fields.length + 1}`, [...values, userId]);
    }

    return this.getProfile(userId);
  }
}

module.exports = new UserModel();