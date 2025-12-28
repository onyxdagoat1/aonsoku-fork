-- Social Features Migration for Aonsoku
-- Run this in your Supabase SQL Editor
-- This adds all social features: ratings, followers, activity feed, etc.

-- ============================================
-- RATINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    entity_type TEXT NOT NULL CHECK(entity_type IN ('track', 'album', 'compilation', 'single', 'artwork', 'edit')),
    entity_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_entity ON public.ratings(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON public.ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created ON public.ratings(created_at DESC);

-- ============================================
-- FOLLOWERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK(follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

-- ============================================
-- ACTIVITY FEED TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.activity_feed (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    activity_type TEXT NOT NULL CHECK(activity_type IN (
        'favorite', 'rating', 'comment', 'follow', 'upload', 'edit_created', 'playlist_created'
    )),
    entity_type TEXT,
    entity_id TEXT,
    entity_name TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON public.activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON public.activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_type ON public.activity_feed(activity_type);

-- ============================================
-- FAVORITES/BOOKMARKS TABLE (Enhanced)
-- ============================================
-- Note: favorites table may already exist, so we'll add columns if needed
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'favorites' 
        AND column_name = 'entity_type'
    ) THEN
        ALTER TABLE public.favorites ADD COLUMN entity_type TEXT DEFAULT 'song';
        ALTER TABLE public.favorites ADD COLUMN notes TEXT;
        ALTER TABLE public.favorites ADD COLUMN tags TEXT[];
    END IF;
END $$;

-- ============================================
-- YEDITOR COMPILATIONS/EDITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.yeditor_works (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    work_type TEXT NOT NULL CHECK(work_type IN ('compilation', 'edit', 'remix', 'mashup')),
    cover_art_url TEXT,
    track_ids TEXT[],
    tags TEXT[],
    is_featured BOOLEAN DEFAULT false,
    is_definitive BOOLEAN DEFAULT false,
    featured_at TIMESTAMPTZ,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_yeditor_works_user ON public.yeditor_works(user_id);
CREATE INDEX IF NOT EXISTS idx_yeditor_works_type ON public.yeditor_works(work_type);
CREATE INDEX IF NOT EXISTS idx_yeditor_works_featured ON public.yeditor_works(is_featured, featured_at DESC);
CREATE INDEX IF NOT EXISTS idx_yeditor_works_definitive ON public.yeditor_works(is_definitive);

-- ============================================
-- EDIT CREDITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.edit_credits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    work_id UUID REFERENCES public.yeditor_works(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    credit_type TEXT NOT NULL CHECK(credit_type IN ('editor', 'remixer', 'contributor', 'producer')),
    role_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edit_credits_work ON public.edit_credits(work_id);
CREATE INDEX IF NOT EXISTS idx_edit_credits_user ON public.edit_credits(user_id);

-- ============================================
-- HIGHLIGHTS TABLE (Featured Content)
-- ============================================
CREATE TABLE IF NOT EXISTS public.highlights (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    entity_type TEXT NOT NULL CHECK(entity_type IN ('work', 'track', 'album', 'artwork')),
    entity_id TEXT NOT NULL,
    highlight_type TEXT NOT NULL CHECK(highlight_type IN ('edit_of_week', 'definitive', 'featured', 'trending')),
    title TEXT,
    description TEXT,
    featured_image_url TEXT,
    featured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id),
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_highlights_type ON public.highlights(highlight_type, featured_at DESC);
CREATE INDEX IF NOT EXISTS idx_highlights_active ON public.highlights(is_active, featured_at DESC);

-- ============================================
-- COLLECTIONS TABLE (User-created collections)
-- ============================================
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    cover_art_url TEXT,
    is_public BOOLEAN DEFAULT false,
    item_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.collection_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collections_user ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_public ON public.collections(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON public.collection_items(collection_id);

-- ============================================
-- QUEUE HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.queue_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    song_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queue_history_user ON public.queue_history(user_id, queued_at DESC);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Ratings
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ratings are viewable by everyone" ON public.ratings;
DROP POLICY IF EXISTS "Users can create their own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Users can delete their own ratings" ON public.ratings;

CREATE POLICY "Ratings are viewable by everyone" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Users can create their own ratings" ON public.ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ratings" ON public.ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ratings" ON public.ratings FOR DELETE USING (auth.uid() = user_id);

-- Follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
DROP POLICY IF EXISTS "Users can create their own follows" ON public.follows;
DROP POLICY IF EXISTS "Users can delete their own follows" ON public.follows;

CREATE POLICY "Follows are viewable by everyone" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can create their own follows" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can delete their own follows" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Activity Feed
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Activity feed is viewable by everyone" ON public.activity_feed;
DROP POLICY IF EXISTS "Users can create their own activity" ON public.activity_feed;

CREATE POLICY "Activity feed is viewable by everyone" ON public.activity_feed FOR SELECT USING (true);
CREATE POLICY "Users can create their own activity" ON public.activity_feed FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Yeditor Works
ALTER TABLE public.yeditor_works ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Works are viewable by everyone" ON public.yeditor_works;
DROP POLICY IF EXISTS "Users can create their own works" ON public.yeditor_works;
DROP POLICY IF EXISTS "Users can update their own works" ON public.yeditor_works;
DROP POLICY IF EXISTS "Admins can update any work" ON public.yeditor_works;

CREATE POLICY "Works are viewable by everyone" ON public.yeditor_works FOR SELECT USING (true);
CREATE POLICY "Users can create their own works" ON public.yeditor_works FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own works" ON public.yeditor_works FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update any work" ON public.yeditor_works FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Highlights
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Highlights are viewable by everyone" ON public.highlights;
DROP POLICY IF EXISTS "Admins can manage highlights" ON public.highlights;

CREATE POLICY "Highlights are viewable by everyone" ON public.highlights FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage highlights" ON public.highlights FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Collections
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public collections are viewable" ON public.collections;
DROP POLICY IF EXISTS "Users can view their own collections" ON public.collections;
DROP POLICY IF EXISTS "Users can create their own collections" ON public.collections;
DROP POLICY IF EXISTS "Users can update their own collections" ON public.collections;

CREATE POLICY "Public collections are viewable" ON public.collections FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can view their own collections" ON public.collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own collections" ON public.collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own collections" ON public.collections FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update activity feed
CREATE OR REPLACE FUNCTION public.log_activity(
    p_user_id UUID,
    p_activity_type TEXT,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id TEXT DEFAULT NULL,
    p_entity_name TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO public.activity_feed (
        user_id, activity_type, entity_type, entity_id, entity_name, metadata
    ) VALUES (
        p_user_id, p_activity_type, p_entity_type, p_entity_id, p_entity_name, p_metadata
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get average rating
CREATE OR REPLACE FUNCTION public.get_average_rating(
    p_entity_type TEXT,
    p_entity_id TEXT
) RETURNS NUMERIC AS $$
DECLARE
    avg_rating NUMERIC;
BEGIN
    SELECT COALESCE(AVG(rating), 0) INTO avg_rating
    FROM public.ratings
    WHERE entity_type = p_entity_type AND entity_id = p_entity_id;
    
    RETURN ROUND(avg_rating, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to update collection item count
CREATE OR REPLACE FUNCTION public.update_collection_item_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.collections
        SET item_count = item_count + 1
        WHERE id = NEW.collection_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.collections
        SET item_count = GREATEST(0, item_count - 1)
        WHERE id = OLD.collection_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_collection_count
AFTER INSERT OR DELETE ON public.collection_items
FOR EACH ROW
EXECUTE FUNCTION public.update_collection_item_count();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT ALL ON public.ratings TO anon, authenticated;
GRANT ALL ON public.follows TO anon, authenticated;
GRANT ALL ON public.activity_feed TO anon, authenticated;
GRANT ALL ON public.yeditor_works TO anon, authenticated;
GRANT ALL ON public.edit_credits TO anon, authenticated;
GRANT ALL ON public.highlights TO anon, authenticated;
GRANT ALL ON public.collections TO anon, authenticated;
GRANT ALL ON public.collection_items TO anon, authenticated;
GRANT ALL ON public.queue_history TO anon, authenticated;

