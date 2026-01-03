-- =====================================================
-- Profile Rework Migration
-- Adds banner support and comment threading
-- =====================================================

-- Add banner_url to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Add parent_id and reply_count to profile_comments for threading
ALTER TABLE public.profile_comments 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.profile_comments(id) ON DELETE CASCADE;

ALTER TABLE public.profile_comments 
ADD COLUMN IF NOT EXISTS reply_count INT DEFAULT 0;

-- Create index for faster comment thread lookups
CREATE INDEX IF NOT EXISTS idx_profile_comments_parent_id 
ON public.profile_comments(parent_id);

-- Function to update reply count when a reply is added
CREATE OR REPLACE FUNCTION update_profile_comment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE public.profile_comments 
    SET reply_count = reply_count + 1 
    WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE public.profile_comments 
    SET reply_count = GREATEST(0, reply_count - 1) 
    WHERE id = OLD.parent_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for reply count updates
DROP TRIGGER IF EXISTS trigger_profile_comment_reply_count ON public.profile_comments;
CREATE TRIGGER trigger_profile_comment_reply_count
AFTER INSERT OR DELETE ON public.profile_comments
FOR EACH ROW
EXECUTE FUNCTION update_profile_comment_reply_count();

-- Create banners storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload banners
DROP POLICY IF EXISTS "Users can upload own banners" ON storage.objects;
CREATE POLICY "Users can upload own banners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'banners' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to banners
DROP POLICY IF EXISTS "Public banner access" ON storage.objects;
CREATE POLICY "Public banner access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'banners');

-- Allow users to update/delete their own banners
DROP POLICY IF EXISTS "Users can manage own banners" ON storage.objects;
CREATE POLICY "Users can manage own banners"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'banners' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own banners" ON storage.objects;
CREATE POLICY "Users can delete own banners"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'banners' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Fix profile_social_links - ensure unique constraint on profile_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profile_social_links_profile_id_key'
  ) THEN
    -- First, remove duplicates keeping the most recent one
    DELETE FROM public.profile_social_links a
    USING public.profile_social_links b
    WHERE a.created_at < b.created_at 
    AND a.profile_id = b.profile_id;
    
    -- Then add the unique constraint
    ALTER TABLE public.profile_social_links 
    ADD CONSTRAINT profile_social_links_profile_id_key UNIQUE (profile_id);
  END IF;
END $$;
