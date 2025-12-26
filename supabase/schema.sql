-- ============================================
-- YEDITS.NET SUPABASE DATABASE SCHEMA
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- This creates all tables needed for social features

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
-- Stores user profile information
-- Linked to Supabase Auth via user_id

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL CHECK (length(username) >= 3 AND length(username) <= 30),
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT CHECK (length(bio) <= 500),
  
  -- Navidrome integration (encrypted credentials)
  navidrome_username TEXT,
  navidrome_credentials_encrypted TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to create profile automatically on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- COMMENTS TABLE
-- ============================================
-- Store user comments on songs
-- Supports nested replies via parent_id

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  song_id TEXT NOT NULL, -- Navidrome song ID
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 2000),
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX comments_song_id_idx ON public.comments(song_id);
CREATE INDEX comments_user_id_idx ON public.comments(user_id);
CREATE INDEX comments_parent_id_idx ON public.comments(parent_id);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Policies for comments
CREATE POLICY "Comments are viewable by everyone" 
  ON public.comments FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create comments" 
  ON public.comments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
  ON public.comments FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
  ON public.comments FOR DELETE 
  USING (auth.uid() = user_id);

CREATE TRIGGER set_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- PLAYLISTS TABLE
-- ============================================
-- User-created playlists with sharing capabilities

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

CREATE INDEX playlists_user_id_idx ON public.playlists(user_id);
CREATE INDEX playlists_is_public_idx ON public.playlists(is_public);

ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public playlists are viewable by everyone" 
  ON public.playlists FOR SELECT 
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own playlists" 
  ON public.playlists FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playlists" 
  ON public.playlists FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playlists" 
  ON public.playlists FOR DELETE 
  USING (auth.uid() = user_id);

CREATE TRIGGER set_playlists_updated_at
  BEFORE UPDATE ON public.playlists
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- PLAYLIST_SONGS TABLE
-- ============================================
-- Songs in playlists with ordering

CREATE TABLE IF NOT EXISTS public.playlist_songs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE NOT NULL,
  song_id TEXT NOT NULL, -- Navidrome song ID
  position INTEGER NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(playlist_id, song_id)
);

CREATE INDEX playlist_songs_playlist_id_idx ON public.playlist_songs(playlist_id);

ALTER TABLE public.playlist_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Playlist songs visible to playlist viewers" 
  ON public.playlist_songs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists 
      WHERE id = playlist_id 
      AND (is_public = true OR user_id = auth.uid())
    )
  );

CREATE POLICY "Playlist owners can manage songs" 
  ON public.playlist_songs FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists 
      WHERE id = playlist_id AND user_id = auth.uid()
    )
  );

-- Function to update song_count
CREATE OR REPLACE FUNCTION public.update_playlist_song_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.playlists 
    SET song_count = song_count + 1 
    WHERE id = NEW.playlist_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.playlists 
    SET song_count = song_count - 1 
    WHERE id = OLD.playlist_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_song_count_on_insert
  AFTER INSERT ON public.playlist_songs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_playlist_song_count();

CREATE TRIGGER update_song_count_on_delete
  AFTER DELETE ON public.playlist_songs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_playlist_song_count();

-- ============================================
-- PLAYLIST_COLLABORATORS TABLE
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

CREATE INDEX playlist_collaborators_playlist_id_idx ON public.playlist_collaborators(playlist_id);
CREATE INDEX playlist_collaborators_user_id_idx ON public.playlist_collaborators(user_id);

ALTER TABLE public.playlist_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collaborators are viewable by playlist owner and collaborators" 
  ON public.playlist_collaborators FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.playlists WHERE id = playlist_id
      UNION
      SELECT user_id FROM public.playlist_collaborators WHERE playlist_id = playlist_id
    )
  );

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

CREATE INDEX favorites_user_id_idx ON public.favorites(user_id);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites" 
  ON public.favorites FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites" 
  ON public.favorites FOR ALL 
  USING (auth.uid() = user_id);

-- ============================================
-- LISTENING_HISTORY TABLE
-- ============================================
-- Track what users listen to

CREATE TABLE IF NOT EXISTS public.listening_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  song_id TEXT NOT NULL,
  played_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  play_duration_seconds INTEGER
);

CREATE INDEX listening_history_user_id_idx ON public.listening_history(user_id);
CREATE INDEX listening_history_played_at_idx ON public.listening_history(played_at DESC);

ALTER TABLE public.listening_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own listening history" 
  ON public.listening_history FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own listening history" 
  ON public.listening_history FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- SETUP COMPLETE
-- ============================================
-- Next steps:
-- 1. Enable Email Auth in Supabase Dashboard > Authentication > Providers
-- 2. Enable OAuth providers (Google, Discord, GitHub) in same location
-- 3. Set up redirect URLs in OAuth provider dashboards
-- 4. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file
