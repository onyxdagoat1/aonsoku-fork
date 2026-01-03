-- Profile Enhancements Migration
-- Run this in Supabase SQL Editor
-- Safe to re-run (uses IF NOT EXISTS / ALTER TABLE ... ADD COLUMN IF NOT EXISTS)

-- =============================================================================
-- 1. EXTEND PROFILES TABLE
-- =============================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pronouns TEXT,
  ADD COLUMN IF NOT EXISTS spotlight_content_id TEXT,
  ADD COLUMN IF NOT EXISTS spotlight_content_type TEXT CHECK (spotlight_content_type IN ('song', 'album', 'single', 'compilation')),
  ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- =============================================================================
-- 2. PROFILE COMMENTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profile_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_comments_profile ON public.profile_comments(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_comments_author ON public.profile_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_profile_comments_created ON public.profile_comments(created_at DESC);

ALTER TABLE public.profile_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view comments
DO $$ BEGIN
  CREATE POLICY "profile_comments_select" ON public.profile_comments
    FOR SELECT TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Authenticated users can insert comments (not their own profile)
DO $$ BEGIN
  CREATE POLICY "profile_comments_insert" ON public.profile_comments
    FOR INSERT TO authenticated
    WITH CHECK (author_id = auth.uid() AND profile_id != auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Authors can update their own comments
DO $$ BEGIN
  CREATE POLICY "profile_comments_update_own" ON public.profile_comments
    FOR UPDATE TO authenticated
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Authors can delete their own comments; profile owner can delete any comment
DO $$ BEGIN
  CREATE POLICY "profile_comments_delete" ON public.profile_comments
    FOR DELETE TO authenticated
    USING (author_id = auth.uid() OR profile_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- 3. PROFILE RATINGS TABLE (1-5 stars)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profile_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, rater_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_ratings_profile ON public.profile_ratings(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_ratings_rater ON public.profile_ratings(rater_id);

ALTER TABLE public.profile_ratings ENABLE ROW LEVEL SECURITY;

-- Anyone can view ratings
DO $$ BEGIN
  CREATE POLICY "profile_ratings_select" ON public.profile_ratings
    FOR SELECT TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Authenticated users can rate (not their own profile)
DO $$ BEGIN
  CREATE POLICY "profile_ratings_insert" ON public.profile_ratings
    FOR INSERT TO authenticated
    WITH CHECK (rater_id = auth.uid() AND profile_id != auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Users can update their own rating
DO $$ BEGIN
  CREATE POLICY "profile_ratings_update_own" ON public.profile_ratings
    FOR UPDATE TO authenticated
    USING (rater_id = auth.uid())
    WITH CHECK (rater_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Users can delete their own rating
DO $$ BEGIN
  CREATE POLICY "profile_ratings_delete_own" ON public.profile_ratings
    FOR DELETE TO authenticated
    USING (rater_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- 4. PROFILE FAVORITES (for favorite edits/comps)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profile_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('song', 'album', 'single', 'compilation')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, content_id, content_type)
);

CREATE INDEX IF NOT EXISTS idx_profile_favorites_profile ON public.profile_favorites(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_favorites_content ON public.profile_favorites(content_id, content_type);

ALTER TABLE public.profile_favorites ENABLE ROW LEVEL SECURITY;

-- Anyone can view favorites
DO $$ BEGIN
  CREATE POLICY "profile_favorites_select" ON public.profile_favorites
    FOR SELECT TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Users can manage their own favorites
DO $$ BEGIN
  CREATE POLICY "profile_favorites_manage_own" ON public.profile_favorites
    FOR ALL TO authenticated
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- 5. UPDATE PROFILE_SOCIAL_LINKS TO INCLUDE DISCORD, INSTAGRAM, SOUNDCLOUD, SPOTIFY
-- =============================================================================
ALTER TABLE public.profile_social_links
  ADD COLUMN IF NOT EXISTS discord_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS soundcloud_url TEXT,
  ADD COLUMN IF NOT EXISTS spotify_url TEXT;

-- Remove old platform constraint if it exists
DO $$ BEGIN
  ALTER TABLE public.profile_social_links DROP CONSTRAINT IF EXISTS profile_social_links_platform_check;
EXCEPTION WHEN undefined_column THEN NULL; END $$;

-- Add new platform constraint
DO $$ BEGIN
  ALTER TABLE public.profile_social_links
    ADD CONSTRAINT profile_social_links_platform_check
    CHECK (platform IN ('twitter','instagram','github','linkedin','youtube','spotify','discord','soundcloud'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- 6. TRIGGERS TO UPDATE COMMENT COUNT AND AVERAGE RATING
-- =============================================================================
-- Function to update comment count
CREATE OR REPLACE FUNCTION public.update_profile_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET comment_count = comment_count + 1 WHERE id = NEW.profile_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.profile_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comment count
DO $$ BEGIN
  CREATE TRIGGER trigger_update_profile_comment_count
    AFTER INSERT OR DELETE ON public.profile_comments
    FOR EACH ROW EXECUTE FUNCTION public.update_profile_comment_count();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Function to update average rating
CREATE OR REPLACE FUNCTION public.update_profile_average_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET average_rating = (
    SELECT COALESCE(AVG(rating), 0)::DECIMAL(3,2)
    FROM public.profile_ratings
    WHERE profile_id = COALESCE(NEW.profile_id, OLD.profile_id)
  )
  WHERE id = COALESCE(NEW.profile_id, OLD.profile_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for average rating
DO $$ BEGIN
  CREATE TRIGGER trigger_update_profile_average_rating_insert
    AFTER INSERT ON public.profile_ratings
    FOR EACH ROW EXECUTE FUNCTION public.update_profile_average_rating();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trigger_update_profile_average_rating_update
    AFTER UPDATE ON public.profile_ratings
    FOR EACH ROW EXECUTE FUNCTION public.update_profile_average_rating();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trigger_update_profile_average_rating_delete
    AFTER DELETE ON public.profile_ratings
    FOR EACH ROW EXECUTE FUNCTION public.update_profile_average_rating();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
