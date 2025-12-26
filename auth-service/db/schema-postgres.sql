-- PostgreSQL Schema for Aonsoku Auth Service

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  google_id VARCHAR(255) UNIQUE,
  discord_id VARCHAR(255) UNIQUE,
  avatar_url TEXT,
  navidrome_user_id VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX idx_users_discord_id ON users(discord_id) WHERE discord_id IS NOT NULL;

-- User profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(255),
  bio TEXT,
  location VARCHAR(255),
  website VARCHAR(500),
  favorite_genres TEXT[],
  banner_url TEXT,
  theme_preference VARCHAR(50) DEFAULT 'dark',
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  song_id VARCHAR(255),
  album_id VARCHAR(255),
  artist_id VARCHAR(255),
  playlist_id VARCHAR(255),
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_song ON comments(song_id) WHERE song_id IS NOT NULL;
CREATE INDEX idx_comments_album ON comments(album_id) WHERE album_id IS NOT NULL;
CREATE INDEX idx_comments_artist ON comments(artist_id) WHERE artist_id IS NOT NULL;
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX idx_comments_created ON comments(created_at DESC);

-- Comment likes
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(comment_id, user_id)
);

CREATE INDEX idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user ON comment_likes(user_id);

-- Shared playlists
CREATE TABLE IF NOT EXISTS shared_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  navidrome_playlist_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cover_url TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  share_token VARCHAR(255) UNIQUE NOT NULL,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shared_playlists_user ON shared_playlists(user_id);
CREATE INDEX idx_shared_playlists_token ON shared_playlists(share_token);
CREATE INDEX idx_shared_playlists_public ON shared_playlists(is_public) WHERE is_public = TRUE;

-- User activity / listening history
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  song_id VARCHAR(255) NOT NULL,
  album_id VARCHAR(255),
  artist_id VARCHAR(255),
  play_count INTEGER DEFAULT 1,
  listening_time_seconds INTEGER DEFAULT 0,
  last_played TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  first_played TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, song_id)
);

CREATE INDEX idx_activity_user ON user_activity(user_id);
CREATE INDEX idx_activity_song ON user_activity(song_id);
CREATE INDEX idx_activity_last_played ON user_activity(last_played DESC);

-- Editor credits
CREATE TABLE IF NOT EXISTS editor_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  song_id VARCHAR(255),
  album_id VARCHAR(255),
  role VARCHAR(100) NOT NULL,
  credit_text TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_credits_user ON editor_credits(user_id);
CREATE INDEX idx_credits_song ON editor_credits(song_id) WHERE song_id IS NOT NULL;
CREATE INDEX idx_credits_album ON editor_credits(album_id) WHERE album_id IS NOT NULL;
CREATE INDEX idx_credits_verified ON editor_credits(is_verified) WHERE is_verified = TRUE;

-- User follows
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_follows_following ON user_follows(following_id);

-- Refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- User sessions (for OAuth)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_data JSONB,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shared_playlists_updated_at BEFORE UPDATE ON shared_playlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_activity_updated_at BEFORE UPDATE ON user_activity FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_editor_credits_updated_at BEFORE UPDATE ON editor_credits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
