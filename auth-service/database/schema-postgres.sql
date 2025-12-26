-- PostgreSQL version of schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  google_id VARCHAR(255) UNIQUE,
  discord_id VARCHAR(255) UNIQUE,
  avatar_url TEXT,
  navidrome_user_id VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_discord_id ON users(discord_id);

-- User profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(100),
  bio TEXT,
  location VARCHAR(100),
  website_url TEXT,
  favorite_genres JSONB,
  custom_fields JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  song_id VARCHAR(255),
  album_id VARCHAR(255),
  content TEXT NOT NULL,
  parent_comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK ((song_id IS NOT NULL OR album_id IS NOT NULL))
);

CREATE INDEX idx_comments_song_id ON comments(song_id);
CREATE INDEX idx_comments_album_id ON comments(album_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);

-- Comment likes
CREATE TABLE IF NOT EXISTS comment_likes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, comment_id)
);

CREATE INDEX idx_comment_likes_user ON comment_likes(user_id);
CREATE INDEX idx_comment_likes_comment ON comment_likes(comment_id);

-- Editor credits
CREATE TABLE IF NOT EXISTS editor_credits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  song_id VARCHAR(255) NOT NULL,
  role VARCHAR(100) NOT NULL,
  credit_text TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_editor_credits_song ON editor_credits(song_id);
CREATE INDEX idx_editor_credits_user ON editor_credits(user_id);
CREATE INDEX idx_editor_credits_role ON editor_credits(role);

-- Shared playlists
CREATE TABLE IF NOT EXISTS shared_playlists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  navidrome_playlist_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  share_token VARCHAR(100) UNIQUE NOT NULL,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shared_playlists_user ON shared_playlists(user_id);
CREATE INDEX idx_shared_playlists_token ON shared_playlists(share_token);

-- User activity tracking
CREATE TABLE IF NOT EXISTS user_activity (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  song_id VARCHAR(255) NOT NULL,
  album_id VARCHAR(255),
  artist_id VARCHAR(255),
  play_count INTEGER DEFAULT 1,
  listening_time_seconds INTEGER DEFAULT 0,
  last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  first_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, song_id)
);

CREATE INDEX idx_activity_user ON user_activity(user_id);
CREATE INDEX idx_activity_song ON user_activity(song_id);
CREATE INDEX idx_activity_last_played ON user_activity(last_played);

-- User follows
CREATE TABLE IF NOT EXISTS user_follows (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_follows_following ON user_follows(following_id);

-- User stats cache
CREATE TABLE IF NOT EXISTS user_stats_cache (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  total_plays INTEGER DEFAULT 0,
  total_listening_time INTEGER DEFAULT 0,
  unique_songs INTEGER DEFAULT 0,
  unique_artists INTEGER DEFAULT 0,
  unique_albums INTEGER DEFAULT 0,
  top_songs JSONB,
  top_artists JSONB,
  top_albums JSONB,
  top_genres JSONB,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, year)
);

CREATE INDEX idx_stats_user_year ON user_stats_cache(user_id, year);