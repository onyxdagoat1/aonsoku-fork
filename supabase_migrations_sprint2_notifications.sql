-- Migration: Sprint 2 Notifications
-- Description: Adds notifications table and triggers for social interactions.

-- 1. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- The recipient
    type TEXT CHECK (type IN ('follow', 'reply', 'like', 'system', 'message')) NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    related_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- The actor
    related_entity_id UUID, -- post_id, comment_id, etc.
    related_entity_type TEXT, -- 'post', 'comment', 'yeditor', 'user'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications (read status)" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (true); -- Triggers run as postgres/superuser or define security definer functions

-- 2. Triggers

-- Trigger Function: Notify on Follow
CREATE OR REPLACE FUNCTION public.handle_new_follow()
RETURNS TRIGGER AS $$
DECLARE
    v_recipient_id UUID;
    v_actor_name TEXT;
BEGIN
    -- Get actor name
    SELECT display_name INTO v_actor_name FROM public.profiles WHERE id = NEW.follower_id;
    IF v_actor_name IS NULL THEN v_actor_name := 'Someone'; END IF;

    -- Determine recipient
    IF NEW.following_type = 'user' THEN
        v_recipient_id := NEW.following_id;
    ELSIF NEW.following_type = 'yeditor' THEN
        SELECT user_id INTO v_recipient_id FROM public.yeditors WHERE id = NEW.following_id;
    END IF;

    -- Insert notification if recipient exists and is not self (self-follow shouldn't happen but good to check)
    IF v_recipient_id IS NOT NULL AND v_recipient_id != NEW.follower_id THEN
        INSERT INTO public.notifications (user_id, type, title, body, related_user_id, related_entity_id, related_entity_type)
        VALUES (
            v_recipient_id,
            'follow',
            'New Follower',
            v_actor_name || ' started following you',
            NEW.follower_id,
            NEW.follower_id,
            'user'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: On Follow
DROP TRIGGER IF EXISTS on_follow_created ON public.user_follows;
CREATE TRIGGER on_follow_created
AFTER INSERT ON public.user_follows
FOR EACH ROW EXECUTE FUNCTION public.handle_new_follow();

-- Trigger Function: Notify on Reply
CREATE OR REPLACE FUNCTION public.handle_new_reply()
RETURNS TRIGGER AS $$
DECLARE
    v_post_author_id UUID;
    v_actor_name TEXT;
    v_post_preview TEXT;
BEGIN
    -- Get post author
    SELECT user_id, left(content, 20) INTO v_post_author_id, v_post_preview FROM public.posts WHERE id = NEW.post_id;
    
    -- Get actor name
    SELECT display_name INTO v_actor_name FROM public.profiles WHERE id = NEW.user_id;
    IF v_actor_name IS NULL THEN v_actor_name := 'Someone'; END IF;

    -- Notify post author (if not self)
    IF v_post_author_id IS NOT NULL AND v_post_author_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, type, title, body, related_user_id, related_entity_id, related_entity_type)
        VALUES (
            v_post_author_id,
            'reply',
            'New Reply',
            v_actor_name || ' replied to your post: "' || v_post_preview || '..."',
            NEW.user_id,
            NEW.post_id,
            'post'
        );
    END IF;

    -- If it's a nested reply, notify parent reply author too? (Complexity trade-off, skipping for now)

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: On Reply
DROP TRIGGER IF EXISTS on_reply_created ON public.post_replies;
CREATE TRIGGER on_reply_created
AFTER INSERT ON public.post_replies
FOR EACH ROW EXECUTE FUNCTION public.handle_new_reply();

-- Realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END;
$$;
