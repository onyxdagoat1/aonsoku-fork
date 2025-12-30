-- Yeditor System Database Migration
-- Run this migration in Supabase SQL Editor
-- Safe to re-run (uses IF NOT EXISTS and OR REPLACE)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- YEDITORS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.yeditors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  bio TEXT,
  avatar_url TEXT,
  social_links JSONB DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_yeditors_user_id ON public.yeditors(user_id);
CREATE INDEX IF NOT EXISTS idx_yeditors_name ON public.yeditors(name);

-- =============================================================================
-- CONTENT_YEDITORS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.content_yeditors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('song', 'album', 'single', 'compilation')),
  yeditor_id UUID NOT NULL REFERENCES public.yeditors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(content_id, content_type)
);

CREATE INDEX IF NOT EXISTS idx_content_yeditors_content ON public.content_yeditors(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_content_yeditors_yeditor ON public.content_yeditors(yeditor_id);

-- =============================================================================
-- USER_FOLLOWS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_type TEXT NOT NULL CHECK (following_type IN ('user', 'yeditor')),
  following_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_type, following_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_type, following_id);

-- =============================================================================
-- HIGHLIGHTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.highlights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('eotw', 'definitive', 'featured', 'upcoming', 'collection', 'playlist')),
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('song', 'album', 'single', 'compilation', 'artwork', 'playlist')),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  image_url TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  countdown_date TIMESTAMPTZ,
  external_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_highlights_type ON public.highlights(type);
CREATE INDEX IF NOT EXISTS idx_highlights_active ON public.highlights(is_active);
CREATE INDEX IF NOT EXISTS idx_highlights_dates ON public.highlights(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_highlights_content ON public.highlights(content_id, content_type);

-- =============================================================================
-- COLLECTIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT true,
  is_official BOOLEAN DEFAULT false,
  collection_type TEXT NOT NULL CHECK (collection_type IN ('playlist', 'collection', 'editorial')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collections_owner ON public.collections(owner_id);
CREATE INDEX IF NOT EXISTS idx_collections_public ON public.collections(is_public);
CREATE INDEX IF NOT EXISTS idx_collections_official ON public.collections(is_official);

-- =============================================================================
-- COLLECTION_ITEMS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.collection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('song', 'album', 'single', 'compilation')),
  display_order INTEGER DEFAULT 0,
  notes TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON public.collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_content ON public.collection_items(content_id, content_type);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE public.yeditors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_yeditors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Yeditors are viewable by everyone" ON public.yeditors;
DROP POLICY IF EXISTS "Admins can insert yeditors" ON public.yeditors;
DROP POLICY IF EXISTS "Admins can update yeditors" ON public.yeditors;
DROP POLICY IF EXISTS "Yeditors can update own profile" ON public.yeditors;
DROP POLICY IF EXISTS "Content yeditors are viewable by everyone" ON public.content_yeditors;
DROP POLICY IF EXISTS "Authenticated users can insert content_yeditors" ON public.content_yeditors;
DROP POLICY IF EXISTS "Admins can update content_yeditors" ON public.content_yeditors;
DROP POLICY IF EXISTS "Admins can delete content_yeditors" ON public.content_yeditors;
DROP POLICY IF EXISTS "Users can view follows" ON public.user_follows;
DROP POLICY IF EXISTS "Users can follow" ON public.user_follows;
DROP POLICY IF EXISTS "Users can unfollow" ON public.user_follows;
DROP POLICY IF EXISTS "Highlights are viewable by everyone" ON public.highlights;
DROP POLICY IF EXISTS "Admins can insert highlights" ON public.highlights;
DROP POLICY IF EXISTS "Admins can update highlights" ON public.highlights;
DROP POLICY IF EXISTS "Admins can delete highlights" ON public.highlights;
DROP POLICY IF EXISTS "Public collections are viewable by everyone" ON public.collections;
DROP POLICY IF EXISTS "Users can create collections" ON public.collections;
DROP POLICY IF EXISTS "Owners can update collections" ON public.collections;
DROP POLICY IF EXISTS "Owners can delete collections" ON public.collections;
DROP POLICY IF EXISTS "Admins can manage all collections" ON public.collections;
DROP POLICY IF EXISTS "Collection items viewable if collection is viewable" ON public.collection_items;
DROP POLICY IF EXISTS "Collection owners can manage items" ON public.collection_items;

-- YEDITORS policies
CREATE POLICY "Yeditors are viewable by everyone" ON public.yeditors
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert yeditors" ON public.yeditors
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update yeditors" ON public.yeditors
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Yeditors can update own profile" ON public.yeditors
  FOR UPDATE USING (user_id = auth.uid());

-- CONTENT_YEDITORS policies
CREATE POLICY "Content yeditors are viewable by everyone" ON public.content_yeditors
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert content_yeditors" ON public.content_yeditors
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update content_yeditors" ON public.content_yeditors
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete content_yeditors" ON public.content_yeditors
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- USER_FOLLOWS policies
CREATE POLICY "Users can view follows" ON public.user_follows
  FOR SELECT USING (true);

CREATE POLICY "Users can follow" ON public.user_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" ON public.user_follows
  FOR DELETE USING (auth.uid() = follower_id);

-- HIGHLIGHTS policies
CREATE POLICY "Highlights are viewable by everyone" ON public.highlights
  FOR SELECT USING (is_active = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can insert highlights" ON public.highlights
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update highlights" ON public.highlights
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete highlights" ON public.highlights
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- COLLECTIONS policies
CREATE POLICY "Public collections are viewable by everyone" ON public.collections
  FOR SELECT USING (is_public = true OR owner_id = auth.uid());

CREATE POLICY "Users can create collections" ON public.collections
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update collections" ON public.collections
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete collections" ON public.collections
  FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY "Admins can manage all collections" ON public.collections
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- COLLECTION_ITEMS policies
CREATE POLICY "Collection items viewable if collection is viewable" ON public.collection_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.collections c 
      WHERE c.id = collection_id 
      AND (c.is_public = true OR c.owner_id = auth.uid())
    )
  );

CREATE POLICY "Collection owners can manage items" ON public.collection_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.collections c 
      WHERE c.id = collection_id 
      AND c.owner_id = auth.uid()
    )
  );

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_yeditors_updated_at ON public.yeditors;
CREATE TRIGGER update_yeditors_updated_at
  BEFORE UPDATE ON public.yeditors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_highlights_updated_at ON public.highlights;
CREATE TRIGGER update_highlights_updated_at
  BEFORE UPDATE ON public.highlights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_collections_updated_at ON public.collections;
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================
-- Drop existing functions first to avoid parameter name conflicts
DROP FUNCTION IF EXISTS get_follower_count(TEXT, UUID);
DROP FUNCTION IF EXISTS get_following_count(UUID);
DROP FUNCTION IF EXISTS get_yeditor_stats(UUID);

CREATE OR REPLACE FUNCTION get_follower_count(target_type TEXT, target_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM public.user_follows 
    WHERE public.user_follows.following_type = target_type 
    AND public.user_follows.following_id = target_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_following_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM public.user_follows 
    WHERE public.user_follows.follower_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_yeditor_stats(yeditor_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_works', (SELECT COUNT(*) FROM public.content_yeditors WHERE yeditor_id = yeditor_uuid),
    'followers', (SELECT get_follower_count('yeditor', yeditor_uuid)),
    'songs', (SELECT COUNT(*) FROM public.content_yeditors WHERE yeditor_id = yeditor_uuid AND content_type = 'song'),
    'albums', (SELECT COUNT(*) FROM public.content_yeditors WHERE yeditor_id = yeditor_uuid AND content_type IN ('album', 'compilation')),
    'singles', (SELECT COUNT(*) FROM public.content_yeditors WHERE yeditor_id = yeditor_uuid AND content_type = 'single')
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- VIEWS
-- =============================================================================
DROP VIEW IF EXISTS public.active_highlights;
CREATE VIEW public.active_highlights AS
SELECT 
  h.*,
  CASE 
    WHEN h.countdown_date IS NOT NULL AND h.countdown_date > NOW() 
    THEN EXTRACT(EPOCH FROM (h.countdown_date - NOW()))::INTEGER
    ELSE NULL
  END as seconds_until_release
FROM public.highlights h
WHERE h.is_active = true
  AND (h.start_date IS NULL OR h.start_date <= NOW())
  AND (h.end_date IS NULL OR h.end_date >= NOW())
ORDER BY h.display_order, h.created_at DESC;

DROP VIEW IF EXISTS public.yeditor_leaderboard;
CREATE VIEW public.yeditor_leaderboard AS
SELECT 
  y.*,
  COUNT(cy.id)::INTEGER as work_count,
  get_follower_count('yeditor', y.id) as follower_count
FROM public.yeditors y
LEFT JOIN public.content_yeditors cy ON cy.yeditor_id = y.id
GROUP BY y.id
ORDER BY work_count DESC, follower_count DESC;

-- Table comments
COMMENT ON TABLE public.yeditors IS 'Content editors/creators who work on comps and edits';
COMMENT ON TABLE public.content_yeditors IS 'Mapping between content items and their editors';
COMMENT ON TABLE public.user_follows IS 'User following relationships for both users and yeditors';
COMMENT ON TABLE public.highlights IS 'Featured/curated content for homepage and discovery';
COMMENT ON TABLE public.collections IS 'User-created and editorial collections/playlists';
COMMENT ON TABLE public.collection_items IS 'Items within collections';
