-- ============================================
-- YEDITS.NET - MASTER SUPABASE DATABASE SCHEMA
-- ============================================
-- Run this in your Supabase SQL Editor
-- Version: 2.0 (Consolidated)
-- Last Updated: 2025-12-28

-- ============================================
-- ENABLE EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
-- User profile information linked to Supabase Auth

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL CHECK (length(username) >= 3 AND length(username) <= 30),
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT CHECK (length(bio) <= 500),
  
  -- Navidrome integration
  navidrome_username TEXT UNIQUE,
  navidrome_user_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- ============================================
-- COMMENTS TABLE
-- ============================================
-- User comments on artists, albums, songs, compilations

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  user_avatar TEXT,
  text TEXT NOT NULL,
  parent_id UUID,
  reply_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  edited BOOLEAN DEFAULT FALSE,
  pinned BOOLEAN DEFAULT FALSE,
  deleted BOOLEAN DEFAULT FALSE,
  reported BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT valid_content_type CHECK (content_type IN ('artist', 'album', 'song', 'compilation', 'single')),
  CONSTRAINT valid_text_length CHECK (char_length(text) > 0 AND char_length(text) <= 2000),
  CONSTRAINT fk_parent_comment FOREIGN KEY (parent_id) REFERENCES public.comments(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comments_content ON public.comments(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON public.comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_deleted ON public.comments(deleted) WHERE deleted = FALSE;

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT
  USING (deleted = FALSE);

DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.comments;
CREATE POLICY "Authenticated users can insert comments"
  ON public.comments FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (true);

-- ============================================
-- COMMENT REACTIONS TABLE
-- ============================================
-- Emoji reactions to comments

CREATE TABLE IF NOT EXISTS public.comment_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_reaction_type CHECK (reaction_type IN ('like', 'love', 'fire', 'laugh', 'sad', 'angry')),
  CONSTRAINT unique_user_reaction UNIQUE(comment_id, user_id),
  CONSTRAINT fk_comment FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reactions_comment ON public.comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON public.comment_reactions(user_id);

-- Enable RLS
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Reactions are viewable by everyone" ON public.comment_reactions;
CREATE POLICY "Reactions are viewable by everyone"
  ON public.comment_reactions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can add reactions" ON public.comment_reactions;
CREATE POLICY "Authenticated users can add reactions"
  ON public.comment_reactions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete own reactions" ON public.comment_reactions;
CREATE POLICY "Users can delete own reactions"
  ON public.comment_reactions FOR DELETE
  USING (true);

-- ============================================
-- PLAYLISTS TABLE
-- ============================================
-- User-created playlists with sharing

CREATE TABLE IF NOT EXISTS public.playlists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
  description TEXT CHECK (length(description) <= 500),
  is_public BOOLEAN DEFAULT false NOT NULL,
  cover_art_url TEXT,
  song_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON public.playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_is_public ON public.playlists(is_public);

-- Enable RLS
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public playlists are viewable by everyone" ON public.playlists;
CREATE POLICY "Public playlists are viewable by everyone" 
  ON public.playlists FOR SELECT 
  USING (is_public = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own playlists" ON public.playlists;
CREATE POLICY "Users can create their own playlists" 
  ON public.playlists FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own playlists" ON public.playlists;
CREATE POLICY "Users can update their own playlists" 
  ON public.playlists FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own playlists" ON public.playlists;
CREATE POLICY "Users can delete their own playlists" 
  ON public.playlists FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- PLAYLIST SONGS TABLE
-- ============================================
-- Songs in playlists with ordering

CREATE TABLE IF NOT EXISTS public.playlist_songs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE NOT NULL,
  song_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(playlist_id, song_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_playlist_songs_playlist_id ON public.playlist_songs(playlist_id);

-- Enable RLS
ALTER TABLE public.playlist_songs ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Playlist songs visible to playlist viewers" ON public.playlist_songs;
CREATE POLICY "Playlist songs visible to playlist viewers" 
  ON public.playlist_songs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists 
      WHERE id = playlist_id 
      AND (is_public = true OR user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Playlist owners can manage songs" ON public.playlist_songs;
CREATE POLICY "Playlist owners can manage songs" 
  ON public.playlist_songs FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists 
      WHERE id = playlist_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- PLAYLIST COLLABORATORS TABLE
-- ============================================
-- Share playlists with other users

CREATE TABLE IF NOT EXISTS public.playlist_collaborators (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  can_edit BOOLEAN DEFAULT false NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(playlist_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_playlist_collaborators_playlist_id ON public.playlist_collaborators(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_collaborators_user_id ON public.playlist_collaborators(user_id);

-- Enable RLS
ALTER TABLE public.playlist_collaborators ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Collaborators viewable by playlist participants" ON public.playlist_collaborators;
CREATE POLICY "Collaborators viewable by playlist participants" 
  ON public.playlist_collaborators FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.playlists WHERE id = playlist_id
      UNION
      SELECT user_id FROM public.playlist_collaborators WHERE playlist_id = playlist_id
    )
  );

DROP POLICY IF EXISTS "Playlist owners can manage collaborators" ON public.playlist_collaborators;
CREATE POLICY "Playlist owners can manage collaborators" 
  ON public.playlist_collaborators FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists 
      WHERE id = playlist_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- FAVORITES TABLE
-- ============================================
-- User favorite songs

CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  song_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, song_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_song_id ON public.favorites(song_id);

-- Enable RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
CREATE POLICY "Users can view their own favorites" 
  ON public.favorites FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own favorites" ON public.favorites;
CREATE POLICY "Users can manage their own favorites" 
  ON public.favorites FOR ALL 
  USING (auth.uid() = user_id);

-- ============================================
-- LISTENING HISTORY TABLE
-- ============================================
-- Track user listening activity

CREATE TABLE IF NOT EXISTS public.listening_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  song_id TEXT NOT NULL,
  played_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  play_duration_seconds INTEGER
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_listening_history_user_id ON public.listening_history(user_id);
CREATE INDEX IF NOT EXISTS idx_listening_history_played_at ON public.listening_history(played_at DESC);

-- Enable RLS
ALTER TABLE public.listening_history ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own listening history" ON public.listening_history;
CREATE POLICY "Users can view their own listening history" 
  ON public.listening_history FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add to their own listening history" ON public.listening_history;
CREATE POLICY "Users can add to their own listening history" 
  ON public.listening_history FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Update reply count for comments
CREATE OR REPLACE FUNCTION public.update_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE public.comments
    SET reply_count = reply_count + 1
    WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE public.comments
    SET reply_count = GREATEST(reply_count - 1, 0)
    WHERE id = OLD.parent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Update comment edited status
CREATE OR REPLACE FUNCTION public.update_comment_edited()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.edited = TRUE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Update playlist song count
CREATE OR REPLACE FUNCTION public.update_playlist_song_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.playlists 
    SET song_count = song_count + 1 
    WHERE id = NEW.playlist_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.playlists 
    SET song_count = GREATEST(song_count - 1, 0)
    WHERE id = OLD.playlist_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Extract username from email
  IF NEW.email IS NOT NULL THEN
    base_username := split_part(NEW.email, '@', 1);
  ELSE
    base_username := 'user';
  END IF;
  
  -- Clean username
  base_username := lower(regexp_replace(base_username, '[^a-zA-Z0-9]', '', 'g'));
  
  -- Ensure minimum length
  IF length(base_username) < 3 THEN
    base_username := 'user' || substring(NEW.id::text, 1, 6);
  END IF;
  
  final_username := base_username;
  
  -- Find available username
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::text;
  END LOOP;
  
  -- Insert profile
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', final_username),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Update profiles.updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: Update playlists.updated_at
DROP TRIGGER IF EXISTS set_playlists_updated_at ON public.playlists;
CREATE TRIGGER set_playlists_updated_at
  BEFORE UPDATE ON public.playlists
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: Auto-create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Update comment reply count
DROP TRIGGER IF EXISTS trigger_update_reply_count ON public.comments;
CREATE TRIGGER trigger_update_reply_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reply_count();

-- Trigger: Mark comment as edited
DROP TRIGGER IF EXISTS trigger_update_comment_edited ON public.comments;
CREATE TRIGGER trigger_update_comment_edited
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  WHEN (OLD.text IS DISTINCT FROM NEW.text)
  EXECUTE FUNCTION public.update_comment_edited();

-- Trigger: Update playlist song count on insert
DROP TRIGGER IF EXISTS update_song_count_on_insert ON public.playlist_songs;
CREATE TRIGGER update_song_count_on_insert
  AFTER INSERT ON public.playlist_songs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_playlist_song_count();

-- Trigger: Update playlist song count on delete
DROP TRIGGER IF EXISTS update_song_count_on_delete ON public.playlist_songs;
CREATE TRIGGER update_song_count_on_delete
  AFTER DELETE ON public.playlist_songs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_playlist_song_count();

-- ============================================
-- VIEWS
-- ============================================

-- View: Comments with aggregated reactions
DROP VIEW IF EXISTS public.comments_with_reactions CASCADE;
CREATE VIEW public.comments_with_reactions AS
SELECT 
  c.id,
  c.content_type,
  c.content_id,
  c.user_id,
  c.username,
  c.user_avatar,
  c.text,
  c.parent_id,
  c.reply_count,
  c.created_at,
  c.updated_at,
  c.edited,
  c.pinned,
  c.deleted,
  c.reported,
  COALESCE(r.reaction_counts, '{}') as reaction_counts,
  COALESCE(r.total_reactions, 0) as total_reactions
FROM public.comments c
LEFT JOIN (
  SELECT 
    comment_id,
    json_object_agg(reaction_type, reaction_count) as reaction_counts,
    SUM(reaction_count) as total_reactions
  FROM (
    SELECT 
      comment_id,
      reaction_type,
      COUNT(*) as reaction_count
    FROM public.comment_reactions
    GROUP BY comment_id, reaction_type
  ) reaction_summary
  GROUP BY comment_id
) r ON c.id = r.comment_id
WHERE c.deleted = FALSE;

-- ============================================
-- GRANTS
-- ============================================

GRANT ALL ON public.profiles TO authenticated, anon;
GRANT ALL ON public.comments TO authenticated, anon;
GRANT ALL ON public.comment_reactions TO authenticated, anon;
GRANT ALL ON public.playlists TO authenticated, anon;
GRANT ALL ON public.playlist_songs TO authenticated, anon;
GRANT ALL ON public.playlist_collaborators TO authenticated, anon;
GRANT ALL ON public.favorites TO authenticated, anon;
GRANT ALL ON public.listening_history TO authenticated, anon;
GRANT SELECT ON public.comments_with_reactions TO authenticated, anon;

-- ============================================
-- SETUP COMPLETE
-- ============================================
-- Next steps:
-- 1. Enable Email Auth in Supabase Dashboard > Authentication > Providers
-- 2. Enable OAuth providers (Google, Discord, GitHub) if needed
-- 3. Set up redirect URLs in OAuth provider dashboards
-- 4. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file
-- 5. Test user registration and authentication
