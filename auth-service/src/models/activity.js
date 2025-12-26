const db = require('../config/database');
const DB_TYPE = process.env.DB_TYPE || 'sqlite';

class ActivityModel {
  // Record song play
  async recordPlay({ userId, songId, albumId, artistId, durationSeconds }) {
    if (DB_TYPE === 'sqlite') {
      // Check if entry exists
      const existing = db.prepare('SELECT id, play_count FROM user_activity WHERE user_id = ? AND song_id = ?').get(userId, songId);
      
      if (existing) {
        db.prepare(`
          UPDATE user_activity 
          SET play_count = play_count + 1, 
              listening_time_seconds = listening_time_seconds + ?,
              last_played = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(durationSeconds || 0, existing.id);
      } else {
        db.prepare(`
          INSERT INTO user_activity (user_id, song_id, album_id, artist_id, listening_time_seconds)
          VALUES (?, ?, ?, ?, ?)
        `).run(userId, songId, albumId || null, artistId || null, durationSeconds || 0);
      }
    } else {
      await db.query(`
        INSERT INTO user_activity (user_id, song_id, album_id, artist_id, listening_time_seconds)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, song_id) 
        DO UPDATE SET 
          play_count = user_activity.play_count + 1,
          listening_time_seconds = user_activity.listening_time_seconds + $5,
          last_played = CURRENT_TIMESTAMP
      `, [userId, songId, albumId || null, artistId || null, durationSeconds || 0]);
    }
    return true;
  }

  // Get user stats
  async getUserStats(userId) {
    if (DB_TYPE === 'sqlite') {
      const stats = db.prepare(`
        SELECT 
          COUNT(DISTINCT song_id) as unique_songs,
          COUNT(DISTINCT album_id) as unique_albums,
          COUNT(DISTINCT artist_id) as unique_artists,
          SUM(play_count) as total_plays,
          SUM(listening_time_seconds) as total_listening_time
        FROM user_activity
        WHERE user_id = ?
      `).get(userId);

      return stats;
    } else {
      const result = await db.query(`
        SELECT 
          COUNT(DISTINCT song_id) as unique_songs,
          COUNT(DISTINCT album_id) as unique_albums,
          COUNT(DISTINCT artist_id) as unique_artists,
          SUM(play_count) as total_plays,
          SUM(listening_time_seconds) as total_listening_time
        FROM user_activity
        WHERE user_id = $1
      `, [userId]);
      
      return result.rows[0];
    }
  }

  // Get top songs
  async getTopSongs(userId, limit = 10) {
    if (DB_TYPE === 'sqlite') {
      return db.prepare(`
        SELECT song_id, play_count, listening_time_seconds, last_played
        FROM user_activity
        WHERE user_id = ?
        ORDER BY play_count DESC
        LIMIT ?
      `).all(userId, limit);
    } else {
      const result = await db.query(`
        SELECT song_id, play_count, listening_time_seconds, last_played
        FROM user_activity
        WHERE user_id = $1
        ORDER BY play_count DESC
        LIMIT $2
      `, [userId, limit]);
      return result.rows;
    }
  }

  // Get recent plays
  async getRecentPlays(userId, limit = 20) {
    if (DB_TYPE === 'sqlite') {
      return db.prepare(`
        SELECT song_id, album_id, artist_id, play_count, last_played
        FROM user_activity
        WHERE user_id = ?
        ORDER BY last_played DESC
        LIMIT ?
      `).all(userId, limit);
    } else {
      const result = await db.query(`
        SELECT song_id, album_id, artist_id, play_count, last_played
        FROM user_activity
        WHERE user_id = $1
        ORDER BY last_played DESC
        LIMIT $2
      `, [userId, limit]);
      return result.rows;
    }
  }

  // Get wrapped data for a year
  async getWrapped(userId, year) {
    // Check if cached
    let cached;
    if (DB_TYPE === 'sqlite') {
      cached = db.prepare('SELECT * FROM user_stats_cache WHERE user_id = ? AND year = ?').get(userId, year);
    } else {
      const result = await db.query('SELECT * FROM user_stats_cache WHERE user_id = $1 AND year = $2', [userId, year]);
      cached = result.rows[0];
    }

    if (cached) {
      return {
        ...cached,
        top_songs: JSON.parse(cached.top_songs || '[]'),
        top_artists: JSON.parse(cached.top_artists || '[]'),
        top_albums: JSON.parse(cached.top_albums || '[]'),
        top_genres: JSON.parse(cached.top_genres || '[]')
      };
    }

    // Calculate stats (simplified - in real impl, would query with date filters)
    const stats = await this.getUserStats(userId);
    const topSongs = await this.getTopSongs(userId, 50);

    // Cache the results
    if (DB_TYPE === 'sqlite') {
      db.prepare(`
        INSERT OR REPLACE INTO user_stats_cache 
        (user_id, year, total_plays, total_listening_time, unique_songs, unique_artists, unique_albums, top_songs)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId, year,
        stats.total_plays, stats.total_listening_time,
        stats.unique_songs, stats.unique_artists, stats.unique_albums,
        JSON.stringify(topSongs)
      );
    } else {
      await db.query(`
        INSERT INTO user_stats_cache 
        (user_id, year, total_plays, total_listening_time, unique_songs, unique_artists, unique_albums, top_songs)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (user_id, year) DO UPDATE SET
          total_plays = $3,
          total_listening_time = $4,
          unique_songs = $5,
          unique_artists = $6,
          unique_albums = $7,
          top_songs = $8,
          calculated_at = CURRENT_TIMESTAMP
      `, [userId, year, stats.total_plays, stats.total_listening_time,
          stats.unique_songs, stats.unique_artists, stats.unique_albums,
          JSON.stringify(topSongs)]);
    }

    return {
      ...stats,
      top_songs: topSongs,
      year
    };
  }
}

module.exports = new ActivityModel();