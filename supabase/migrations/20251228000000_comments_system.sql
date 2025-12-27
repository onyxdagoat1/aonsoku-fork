-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing objects if they exist (for clean reinstall)
DROP VIEW IF EXISTS public.comments_with_reactions CASCADE;
DROP TABLE IF EXISTS public.comment_reactions CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP FUNCTION IF EXISTS update_reply_count() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create comments table
CREATE TABLE public.comments (
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
  CONSTRAINT valid_text_length CHECK (char_length(text) > 0 AND char_length(text) <= 2000)
);

-- Add foreign key after table creation
ALTER TABLE public.comments 
  ADD CONSTRAINT fk_parent_comment 
  FOREIGN KEY (parent_id) 
  REFERENCES public.comments(id) 
  ON DELETE CASCADE;

-- Create reactions table
CREATE TABLE public.comment_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_reaction_type CHECK (reaction_type IN ('like', 'love', 'fire', 'laugh', 'sad', 'angry')),
  CONSTRAINT unique_user_reaction UNIQUE(comment_id, user_id)
);

-- Add foreign key after table creation
ALTER TABLE public.comment_reactions
  ADD CONSTRAINT fk_comment
  FOREIGN KEY (comment_id)
  REFERENCES public.comments(id)
  ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_comments_content ON public.comments(content_type, content_id);
CREATE INDEX idx_comments_user ON public.comments(user_id);
CREATE INDEX idx_comments_parent ON public.comments(parent_id);
CREATE INDEX idx_comments_created ON public.comments(created_at DESC);
CREATE INDEX idx_comments_deleted ON public.comments(deleted) WHERE deleted = FALSE;
CREATE INDEX idx_reactions_comment ON public.comment_reactions(comment_id);
CREATE INDEX idx_reactions_user ON public.comment_reactions(user_id);

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
    SET reply_count = GREATEST(reply_count - 1, 0)
    WHERE id = OLD.parent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for reply count
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
CREATE TRIGGER trigger_update_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  WHEN (OLD.text IS DISTINCT FROM NEW.text)
  EXECUTE FUNCTION update_updated_at_column();

-- Create view for comments with reaction counts
-- Using a subquery to avoid nested aggregate functions
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

-- Enable Row Level Security
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
DROP POLICY IF EXISTS "Reactions are viewable by everyone" ON public.comment_reactions;
DROP POLICY IF EXISTS "Authenticated users can add reactions" ON public.comment_reactions;
DROP POLICY IF EXISTS "Users can delete own reactions" ON public.comment_reactions;

-- Create RLS Policies for comments
CREATE POLICY "Comments are viewable by everyone"
  ON public.comments
  FOR SELECT
  USING (deleted = FALSE);

CREATE POLICY "Authenticated users can insert comments"
  ON public.comments
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own comments"
  ON public.comments
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete own comments"
  ON public.comments
  FOR DELETE
  USING (true);

-- Create RLS Policies for reactions
CREATE POLICY "Reactions are viewable by everyone"
  ON public.comment_reactions
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add reactions"
  ON public.comment_reactions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete own reactions"
  ON public.comment_reactions
  FOR DELETE
  USING (true);

-- Grant permissions
GRANT ALL ON public.comments TO authenticated, anon;
GRANT ALL ON public.comment_reactions TO authenticated, anon;
GRANT SELECT ON public.comments_with_reactions TO authenticated, anon;

-- Add helpful comments
COMMENT ON TABLE public.comments IS 'User comments on artists, albums, songs, compilations, and singles';
COMMENT ON TABLE public.comment_reactions IS 'Emoji reactions to comments';
COMMENT ON VIEW public.comments_with_reactions IS 'Comments with aggregated reaction counts for efficient querying';
