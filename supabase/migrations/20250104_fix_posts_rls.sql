-- Migration: Fix triggers and RLS for posts/replies
-- This fixes:
-- 1. Trigger referencing parent_id instead of parent_reply_id
-- 2. RLS policies for posts updates (soft delete)
-- 3. RLS policies for post_replies

-- Drop ALL triggers on post_replies to clean up any that reference wrong columns
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT tgname FROM pg_trigger 
        WHERE tgrelid = 'public.post_replies'::regclass 
        AND NOT tgisinternal
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.tgname || ' ON public.post_replies';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Drop old functions that might have wrong column references
DROP FUNCTION IF EXISTS public.increment_reply_count() CASCADE;
DROP FUNCTION IF EXISTS public.decrement_reply_count() CASCADE;
DROP FUNCTION IF EXISTS public.update_reply_count() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_reply() CASCADE;
DROP FUNCTION IF EXISTS public.on_reply_insert() CASCADE;

-- Create correct reply count function
CREATE OR REPLACE FUNCTION public.update_post_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts 
    SET reply_count = reply_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts 
    SET reply_count = reply_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new trigger
CREATE TRIGGER update_post_reply_count_trigger
  AFTER INSERT OR DELETE ON public.post_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_reply_count();

-- Fix RLS for posts table
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (all possible names)
DROP POLICY IF EXISTS "posts_select_policy" ON public.posts;
DROP POLICY IF EXISTS "posts_insert_policy" ON public.posts;
DROP POLICY IF EXISTS "posts_update_policy" ON public.posts;
DROP POLICY IF EXISTS "posts_delete_policy" ON public.posts;
DROP POLICY IF EXISTS "posts_select" ON public.posts;
DROP POLICY IF EXISTS "posts_insert" ON public.posts;
DROP POLICY IF EXISTS "posts_update" ON public.posts;
DROP POLICY IF EXISTS "posts_delete" ON public.posts;
DROP POLICY IF EXISTS "Anyone can read posts" ON public.posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their posts" ON public.posts;

-- Create new policies
CREATE POLICY "posts_select"
  ON public.posts FOR SELECT
  USING (true);

CREATE POLICY "posts_insert"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_update"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "posts_delete"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Fix RLS for post_replies table
ALTER TABLE public.post_replies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (all possible names)
DROP POLICY IF EXISTS "post_replies_select_policy" ON public.post_replies;
DROP POLICY IF EXISTS "post_replies_insert_policy" ON public.post_replies;
DROP POLICY IF EXISTS "post_replies_update_policy" ON public.post_replies;
DROP POLICY IF EXISTS "post_replies_delete_policy" ON public.post_replies;
DROP POLICY IF EXISTS "replies_select" ON public.post_replies;
DROP POLICY IF EXISTS "replies_insert" ON public.post_replies;
DROP POLICY IF EXISTS "replies_update" ON public.post_replies;
DROP POLICY IF EXISTS "replies_delete" ON public.post_replies;
DROP POLICY IF EXISTS "Anyone can read replies" ON public.post_replies;
DROP POLICY IF EXISTS "Users can create replies" ON public.post_replies;
DROP POLICY IF EXISTS "Users can update their replies" ON public.post_replies;
DROP POLICY IF EXISTS "Users can delete their replies" ON public.post_replies;

-- Create new policies
CREATE POLICY "replies_select"
  ON public.post_replies FOR SELECT
  USING (true);

CREATE POLICY "replies_insert"
  ON public.post_replies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "replies_update"
  ON public.post_replies FOR UPDATE
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "replies_delete"
  ON public.post_replies FOR DELETE
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ));
