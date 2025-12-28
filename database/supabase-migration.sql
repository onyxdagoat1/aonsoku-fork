-- Supabase Migration for Comment System
-- Run this in your Supabase SQL Editor
-- https://supabase.com/dashboard/project/YOUR_PROJECT/editor

-- ============================================
-- Table: comments
-- Stores all user comments on various entities
-- ============================================
CREATE TABLE IF NOT EXISTS public.comments (
    id BIGSERIAL PRIMARY KEY,
    entity_type TEXT NOT NULL CHECK(entity_type IN ('artist', 'album', 'compilation', 'single')),
    entity_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    content TEXT NOT NULL CHECK(length(content) > 0 AND length(content) <= 1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NULL,
    likes INTEGER NOT NULL DEFAULT 0
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_comments_entity ON public.comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON public.comments(created_at DESC);

-- ============================================
-- Table: comment_likes
-- Tracks which users liked which comments
-- ============================================
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id BIGSERIAL PRIMARY KEY,
    comment_id BIGINT NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure a user can only like a comment once
    UNIQUE(comment_id, user_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON public.comment_likes(user_id);

-- ============================================
-- Function: Update like count automatically
-- ============================================
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.comments
        SET likes = likes + 1
        WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.comments
        SET likes = GREATEST(0, likes - 1)
        WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Triggers: Auto-update like counts
-- ============================================
DROP TRIGGER IF EXISTS trigger_increment_comment_likes ON public.comment_likes;
CREATE TRIGGER trigger_increment_comment_likes
AFTER INSERT ON public.comment_likes
FOR EACH ROW
EXECUTE FUNCTION update_comment_likes_count();

DROP TRIGGER IF EXISTS trigger_decrement_comment_likes ON public.comment_likes;
CREATE TRIGGER trigger_decrement_comment_likes
AFTER DELETE ON public.comment_likes
FOR EACH ROW
EXECUTE FUNCTION update_comment_likes_count();

-- ============================================
-- Function: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comment_timestamp ON public.comments;
CREATE TRIGGER trigger_update_comment_timestamp
BEFORE UPDATE ON public.comments
FOR EACH ROW
WHEN (OLD.content IS DISTINCT FROM NEW.content)
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) Policies
-- Enable RLS for security
-- ============================================
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments
CREATE POLICY "Comments are viewable by everyone"
ON public.comments FOR SELECT
USING (true);

-- Only authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
ON public.comments FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Users can only delete their own comments
CREATE POLICY "Users can delete their own comments"
ON public.comments FOR DELETE
USING (auth.uid()::text = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
ON public.comments FOR UPDATE
USING (auth.uid()::text = user_id);

-- Anyone can read likes
CREATE POLICY "Likes are viewable by everyone"
ON public.comment_likes FOR SELECT
USING (true);

-- Only authenticated users can like
CREATE POLICY "Authenticated users can like comments"
ON public.comment_likes FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Users can unlike (delete their own likes)
CREATE POLICY "Users can unlike comments"
ON public.comment_likes FOR DELETE
USING (auth.uid()::text = user_id);

-- ============================================
-- Sample Data (Optional - for testing)
-- Uncomment to insert sample data
-- ============================================
/*
INSERT INTO public.comments (entity_type, entity_id, user_id, username, content) VALUES
('artist', 'artist-123', 'user-1', 'MusicLover42', 'This artist is amazing! Their latest album is fire 🔥'),
('artist', 'artist-123', 'user-2', 'JazzFan', 'Been listening to them for years. True talent!'),
('album', 'album-456', 'user-1', 'MusicLover42', 'This album is a masterpiece. Track 3 is my favorite!'),
('single', 'single-789', 'user-3', 'VinylCollector', 'This single is on repeat! Can''t wait for the full album.');

INSERT INTO public.comment_likes (comment_id, user_id) VALUES
(1, 'user-2'),
(1, 'user-3'),
(2, 'user-1'),
(3, 'user-2');
*/
