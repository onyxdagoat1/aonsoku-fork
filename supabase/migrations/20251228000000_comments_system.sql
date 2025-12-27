-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Content type and reference
  content_type TEXT NOT NULL CHECK (content_type IN ('artist', 'album', 'song', 'compilation', 'single')),
  content_id TEXT NOT NULL,
  
  -- User info (from Navidrome or Supabase auth)
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  user_avatar TEXT,
  
  -- Comment content
  text TEXT NOT NULL,
  
  -- Threading support
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  reply_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  edited BOOLEAN DEFAULT FALSE,
  pinned BOOLEAN DEFAULT FALSE,
  
  -- Moderation
  deleted BOOLEAN DEFAULT FALSE,
  reported BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT valid_text_length CHECK (char_length(text) > 0 AND char_length(text) <= 2000)
);

-- Create reactions table
CREATE TABLE IF NOT EXISTS public.comment_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'fire', 'laugh', 'sad', 'angry')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one reaction per user per comment
  UNIQUE(comment_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_content ON public.comments(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON public.comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reactions_comment ON public.comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON public.comment_reactions(user_id);

-- Function to update reply count
CREATE OR REPLACE FUNCTION update_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE public.comments
    SET reply_count = reply_count + 1
    WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE public.comments
    SET reply_count = reply_count - 1
    WHERE id = OLD.parent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for reply count
DROP TRIGGER IF EXISTS trigger_update_reply_count ON public.comments;
CREATE TRIGGER trigger_update_reply_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION update_reply_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.edited = TRUE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_updated_at ON public.comments;
CREATE TRIGGER trigger_update_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  WHEN (OLD.text IS DISTINCT FROM NEW.text)
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments
-- Anyone can read non-deleted comments
CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT
  USING (deleted = FALSE);

-- Authenticated users can insert comments
CREATE POLICY "Authenticated users can insert comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- RLS Policies for reactions
-- Anyone can view reactions
CREATE POLICY "Reactions are viewable by everyone"
  ON public.comment_reactions FOR SELECT
  USING (true);

-- Authenticated users can add reactions
CREATE POLICY "Authenticated users can add reactions"
  ON public.comment_reactions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Users can delete their own reactions
CREATE POLICY "Users can delete own reactions"
  ON public.comment_reactions FOR DELETE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create view for comments with reaction counts
CREATE OR REPLACE VIEW public.comments_with_reactions AS
SELECT 
  c.*,
  COALESCE(
    json_object_agg(
      r.reaction_type, 
      COUNT(r.id)
    ) FILTER (WHERE r.reaction_type IS NOT NULL),
    '{}'
  ) as reaction_counts,
  COUNT(r.id) as total_reactions
FROM public.comments c
LEFT JOIN public.comment_reactions r ON c.id = r.comment_id
WHERE c.deleted = FALSE
GROUP BY c.id;

-- Grant permissions
GRANT ALL ON public.comments TO authenticated;
GRANT ALL ON public.comment_reactions TO authenticated;
GRANT SELECT ON public.comments_with_reactions TO authenticated;
GRANT ALL ON public.comments TO anon;
GRANT ALL ON public.comment_reactions TO anon;
GRANT SELECT ON public.comments_with_reactions TO anon;
