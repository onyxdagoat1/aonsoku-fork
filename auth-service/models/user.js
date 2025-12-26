const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

/**
 * Create a new user
 */
async function createUser(db, { email, username, password, google_id, discord_id, avatar_url }) {
  const id = uuidv4();
  const password_hash = password ? await bcrypt.hash(password, BCRYPT_ROUNDS) : null;
  
  const now = new Date().toISOString();
  
  if (db.type === 'sqlite') {
    db.run(
      `INSERT INTO users (id, email, username, password_hash, google_id, discord_id, avatar_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, email, username, password_hash, google_id, discord_id, avatar_url, now, now]
    );
    
    // Create profile
    db.run(
      `INSERT INTO user_profiles (user_id, created_at, updated_at) VALUES (?, ?, ?)`,
      [id, now, now]
    );
  } else {
    await db.query(
      `INSERT INTO users (id, email, username, password_hash, google_id, discord_id, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, email, username, password_hash, google_id, discord_id, avatar_url]
    );
    
    await db.query(
      `INSERT INTO user_profiles (user_id) VALUES ($1)`,
      [id]
    );
  }
  
  return findUserById(db, id);
}

/**
 * Find user by ID
 */
function findUserById(db, id) {
  if (db.type === 'sqlite') {
    return db.get(
      `SELECT u.*, p.display_name, p.bio, p.avatar_url as profile_avatar
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.id = ? AND u.is_active = 1`,
      [id]
    );
  }
  
  return db.query(
    `SELECT u.*, p.display_name, p.bio, p.avatar_url as profile_avatar
     FROM users u
     LEFT JOIN user_profiles p ON u.id = p.user_id
     WHERE u.id = $1 AND u.is_active = true`,
    [id]
  ).then(result => result.rows[0]);
}

/**
 * Find user by email
 */
function findUserByEmail(db, email) {
  if (db.type === 'sqlite') {
    return db.get(
      `SELECT u.*, p.display_name, p.bio
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.email = ? AND u.is_active = 1`,
      [email]
    );
  }
  
  return db.query(
    `SELECT u.*, p.display_name, p.bio
     FROM users u
     LEFT JOIN user_profiles p ON u.id = p.user_id
     WHERE u.email = $1 AND u.is_active = true`,
    [email]
  ).then(result => result.rows[0]);
}

/**
 * Find user by username
 */
function findUserByUsername(db, username) {
  if (db.type === 'sqlite') {
    return db.get(
      `SELECT u.*, p.display_name, p.bio
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.username = ? AND u.is_active = 1`,
      [username]
    );
  }
  
  return db.query(
    `SELECT u.*, p.display_name, p.bio
     FROM users u
     LEFT JOIN user_profiles p ON u.id = p.user_id
     WHERE u.username = $1 AND u.is_active = true`,
    [username]
  ).then(result => result.rows[0]);
}

/**
 * Verify user password
 */
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Find or create OAuth user
 */
async function findOrCreateOAuthUser(db, provider, userData) {
  let user;
  
  // Try to find existing user by OAuth ID
  const idField = provider === 'google' ? 'google_id' : 'discord_id';
  
  if (db.type === 'sqlite') {
    user = db.get(
      `SELECT * FROM users WHERE ${idField} = ? AND is_active = 1`,
      [userData[idField]]
    );
  } else {
    const result = await db.query(
      `SELECT * FROM users WHERE ${idField} = $1 AND is_active = true`,
      [userData[idField]]
    );
    user = result.rows[0];
  }
  
  if (user) {
    return user;
  }
  
  // Try to find by email and link accounts
  user = await findUserByEmail(db, userData.email);
  
  if (user) {
    // Link OAuth account to existing user
    if (db.type === 'sqlite') {
      db.run(
        `UPDATE users SET ${idField} = ?, avatar_url = COALESCE(avatar_url, ?) WHERE id = ?`,
        [userData[idField], userData.avatar_url, user.id]
      );
    } else {
      await db.query(
        `UPDATE users SET ${idField} = $1, avatar_url = COALESCE(avatar_url, $2) WHERE id = $3`,
        [userData[idField], userData.avatar_url, user.id]
      );
    }
    
    return findUserById(db, user.id);
  }
  
  // Create new user
  let username = userData.username;
  let counter = 1;
  
  // Ensure unique username
  while (await findUserByUsername(db, username)) {
    username = `${userData.username}${counter}`;
    counter++;
  }
  
  return createUser(db, {
    email: userData.email,
    username,
    [idField]: userData[idField],
    avatar_url: userData.avatar_url
  });
}

/**
 * Update user profile
 */
async function updateUserProfile(db, userId, profileData) {
  const { display_name, bio, location, website, favorite_genres, banner_url, theme_preference } = profileData;
  
  const now = new Date().toISOString();
  
  if (db.type === 'sqlite') {
    const updates = [];
    const values = [];
    
    if (display_name !== undefined) {
      updates.push('display_name = ?');
      values.push(display_name);
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      values.push(bio);
    }
    if (location !== undefined) {
      updates.push('location = ?');
      values.push(location);
    }
    if (website !== undefined) {
      updates.push('website = ?');
      values.push(website);
    }
    if (favorite_genres !== undefined) {
      updates.push('favorite_genres = ?');
      values.push(favorite_genres);
    }
    if (banner_url !== undefined) {
      updates.push('banner_url = ?');
      values.push(banner_url);
    }
    if (theme_preference !== undefined) {
      updates.push('theme_preference = ?');
      values.push(theme_preference);
    }
    
    updates.push('updated_at = ?');
    values.push(now);
    values.push(userId);
    
    db.run(
      `UPDATE user_profiles SET ${updates.join(', ')} WHERE user_id = ?`,
      values
    );
  } else {
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (display_name !== undefined) {
      updates.push(`display_name = $${paramIndex++}`);
      values.push(display_name);
    }
    if (bio !== undefined) {
      updates.push(`bio = $${paramIndex++}`);
      values.push(bio);
    }
    if (location !== undefined) {
      updates.push(`location = $${paramIndex++}`);
      values.push(location);
    }
    if (website !== undefined) {
      updates.push(`website = $${paramIndex++}`);
      values.push(website);
    }
    if (favorite_genres !== undefined) {
      updates.push(`favorite_genres = $${paramIndex++}`);
      values.push(favorite_genres);
    }
    if (banner_url !== undefined) {
      updates.push(`banner_url = $${paramIndex++}`);
      values.push(banner_url);
    }
    if (theme_preference !== undefined) {
      updates.push(`theme_preference = $${paramIndex++}`);
      values.push(theme_preference);
    }
    
    values.push(userId);
    
    await db.query(
      `UPDATE user_profiles SET ${updates.join(', ')} WHERE user_id = $${paramIndex}`,
      values
    );
  }
  
  return findUserById(db, userId);
}

module.exports = {
  createUser,
  findUserById,
  findUserByEmail,
  findUserByUsername,
  verifyPassword,
  findOrCreateOAuthUser,
  updateUserProfile
};
