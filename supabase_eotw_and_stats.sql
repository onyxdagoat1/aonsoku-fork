-- Social Hub, Charts, and EOTW Database Migrations
-- Run this in Supabase SQL Editor

-- ============================================
-- PLAY COUNT TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS play_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('track', 'album')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  played_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_play_counts_content ON play_counts(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_play_counts_user ON play_counts(user_id);

-- ============================================
-- ARTIST FOLLOWS
-- ============================================
CREATE TABLE IF NOT EXISTS artist_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, artist_id)
);

CREATE INDEX IF NOT EXISTS idx_artist_follows_artist ON artist_follows(artist_id);

-- ============================================
-- EDIT OF THE WEEK (EOTW) SYSTEM
-- ============================================

-- Weekly competitions
CREATE TABLE IF NOT EXISTS eotw_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  voting_ends_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'nominations' CHECK (status IN ('nominations', 'voting', 'completed')),
  winner_content_id TEXT,
  winner_content_type TEXT,
  description TEXT,
  credits TEXT,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Remove old UNIQUE constraint if it exists and add new columns
ALTER TABLE eotw_weeks DROP CONSTRAINT IF EXISTS eotw_weeks_week_start_key;
ALTER TABLE eotw_weeks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE eotw_weeks ADD COLUMN IF NOT EXISTS credits TEXT;
ALTER TABLE eotw_weeks ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE eotw_weeks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Nominees for each week
CREATE TABLE IF NOT EXISTS eotw_nominees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID REFERENCES eotw_weeks(id) ON DELETE CASCADE,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('single', 'album', 'compilation')),
  content_name TEXT,
  content_artist TEXT,
  content_cover TEXT,
  description TEXT,
  credits TEXT,
  nominated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(week_id, content_id, content_type)
);

-- Add new columns to existing nominees table
ALTER TABLE eotw_nominees ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE eotw_nominees ADD COLUMN IF NOT EXISTS credits TEXT;

CREATE INDEX IF NOT EXISTS idx_eotw_nominees_week ON eotw_nominees(week_id);

-- Votes on nominees
CREATE TABLE IF NOT EXISTS eotw_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nominee_id UUID REFERENCES eotw_nominees(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, nominee_id)
);

CREATE INDEX IF NOT EXISTS idx_eotw_votes_nominee ON eotw_votes(nominee_id);

-- View for vote counts
CREATE OR REPLACE VIEW eotw_nominee_votes AS
SELECT 
  n.id as nominee_id,
  n.week_id,
  n.content_id,
  n.content_type,
  n.content_name,
  n.content_artist,
  n.content_cover,
  COUNT(v.id) as vote_count
FROM eotw_nominees n
LEFT JOIN eotw_votes v ON v.nominee_id = n.id
GROUP BY n.id, n.week_id, n.content_id, n.content_type, n.content_name, n.content_artist, n.content_cover;

-- ============================================
-- POSTS TABLE ENHANCEMENTS
-- ============================================
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS attached_track_name TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS attached_track_artist TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS attached_cover_art TEXT;

ALTER TABLE post_replies ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE post_replies ADD COLUMN IF NOT EXISTS attached_track_name TEXT;
ALTER TABLE post_replies ADD COLUMN IF NOT EXISTS attached_track_artist TEXT;
ALTER TABLE post_replies ADD COLUMN IF NOT EXISTS attached_cover_art TEXT;
ALTER TABLE post_replies ADD COLUMN IF NOT EXISTS attached_content_id TEXT;
ALTER TABLE post_replies ADD COLUMN IF NOT EXISTS attached_content_type TEXT;

-- Update post type constraints to be more flexible
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_post_type_check;
ALTER TABLE posts ADD CONSTRAINT posts_post_type_check CHECK (post_type IN ('text', 'image', 'track_share', 'album_share', 'playlist_share', 'media'));

-- NOTE: Ensure you have a public storage bucket named 'uploads' in Supabase
-- for image attachments to work. You can create it in the Supabase Dashboard.

-- ============================================
-- RLS POLICIES
-- ============================================

-- Play counts: users can only insert their own
ALTER TABLE play_counts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert own play counts" ON play_counts;
CREATE POLICY "Users can insert own play counts" ON play_counts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Anyone can view play counts" ON play_counts;
CREATE POLICY "Anyone can view play counts" ON play_counts FOR SELECT USING (true);

-- Artist follows: users manage their own
ALTER TABLE artist_follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own follows" ON artist_follows;
CREATE POLICY "Users can manage own follows" ON artist_follows FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Anyone can view follows" ON artist_follows;
CREATE POLICY "Anyone can view follows" ON artist_follows FOR SELECT USING (true);

-- Enable realtime for posts and conversations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'conversations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'posts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
  END IF;
END;
$$;

-- EOTW weeks: anyone can read, admins can write
ALTER TABLE eotw_weeks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view weeks" ON eotw_weeks;
CREATE POLICY "Anyone can view weeks" ON eotw_weeks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage weeks" ON eotw_weeks;
CREATE POLICY "Admins can manage weeks" ON eotw_weeks FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- EOTW nominees: anyone can read, admins can write
ALTER TABLE eotw_nominees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view nominees" ON eotw_nominees;
CREATE POLICY "Anyone can view nominees" ON eotw_nominees FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage nominees" ON eotw_nominees;
CREATE POLICY "Admins can manage nominees" ON eotw_nominees FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- EOTW votes: users can vote once per nominee during voting period
ALTER TABLE eotw_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can vote" ON eotw_votes;
CREATE POLICY "Users can vote" ON eotw_votes FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM eotw_nominees n 
    JOIN eotw_weeks w ON w.id = n.week_id 
    WHERE n.id = nominee_id AND w.status = 'voting'
  )
);
DROP POLICY IF EXISTS "Users can see own votes" ON eotw_votes;
CREATE POLICY "Users can see own votes" ON eotw_votes FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Anyone can count votes" ON eotw_votes;
CREATE POLICY "Anyone can count votes" ON eotw_votes FOR SELECT USING (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get artist follow count
CREATE OR REPLACE FUNCTION get_artist_follow_count(p_artist_id TEXT)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM artist_follows WHERE artist_id = p_artist_id;
$$ LANGUAGE SQL STABLE;

-- Get track play count
CREATE OR REPLACE FUNCTION get_track_play_count(p_content_id TEXT)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM play_counts WHERE content_id = p_content_id AND content_type = 'track';
$$ LANGUAGE SQL STABLE;
