-- Migration: Create notifications table and triggers (Comprehensive)

-- 1. Ensure notifications table exists
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('follow', 'reply', 'like', 'system', 'message', 'vote', 'report')),
    title TEXT NOT NULL,
    body TEXT,
    related_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    related_entity_id UUID,
    related_entity_type TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);


-- 2. Trigger: Post Replies
CREATE OR REPLACE FUNCTION public.handle_new_reply_notification()
RETURNS TRIGGER AS $$
DECLARE
    post_owner_id UUID;
    parent_reply_owner_id UUID;
BEGIN
    SELECT user_id INTO post_owner_id FROM public.posts WHERE id = NEW.post_id;

    IF NEW.parent_reply_id IS NOT NULL THEN
        SELECT user_id INTO parent_reply_owner_id FROM public.post_replies WHERE id = NEW.parent_reply_id;
        IF parent_reply_owner_id IS NOT NULL AND parent_reply_owner_id != NEW.user_id THEN
            INSERT INTO public.notifications (user_id, type, title, body, related_user_id, related_entity_id, related_entity_type)
            VALUES (parent_reply_owner_id, 'reply', 'New reply to your comment', substring(NEW.content from 1 for 100), NEW.user_id, NEW.post_id, 'post');
        END IF;
        IF post_owner_id != NEW.user_id AND (parent_reply_owner_id Is NULL OR post_owner_id != parent_reply_owner_id) THEN
             INSERT INTO public.notifications (user_id, type, title, body, related_user_id, related_entity_id, related_entity_type)
            VALUES (post_owner_id, 'reply', 'New reply on your post', substring(NEW.content from 1 for 100), NEW.user_id, NEW.post_id, 'post');
        END IF;
    ELSE
        IF post_owner_id != NEW.user_id THEN
            INSERT INTO public.notifications (user_id, type, title, body, related_user_id, related_entity_id, related_entity_type)
            VALUES (post_owner_id, 'reply', 'New comment on your post', substring(NEW.content from 1 for 100), NEW.user_id, NEW.post_id, 'post');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_reply_created_notify ON public.post_replies;
CREATE TRIGGER on_reply_created_notify
    AFTER INSERT ON public.post_replies
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_reply_notification();


-- 3. Trigger: Announcements
CREATE OR REPLACE FUNCTION public.handle_new_announcement_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, body, related_entity_id, related_entity_type, created_at)
    SELECT id, 'system', 'New Announcement: ' || NEW.title, substring(NEW.body from 1 for 100), NEW.id, 'announcement', NOW()
    FROM public.profiles;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_announcement_created_notify ON public.announcements;
CREATE TRIGGER on_announcement_created_notify
    AFTER INSERT ON public.announcements
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_announcement_notification();


-- 4. Trigger: Follows (user_follows)
CREATE OR REPLACE FUNCTION public.handle_new_follow_notification()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
BEGIN
    IF NEW.following_type = 'user' THEN
        target_user_id := NEW.following_id::uuid;
    ELSIF NEW.following_type = 'yeditor' THEN
        SELECT user_id INTO target_user_id FROM public.yeditors WHERE id = NEW.following_id::uuid;
    END IF;

    IF target_user_id IS NOT NULL AND target_user_id != NEW.follower_id THEN
        INSERT INTO public.notifications (user_id, type, title, body, related_user_id, related_entity_id, related_entity_type)
        VALUES (target_user_id, 'follow', 'New Follower', 'started following you', NEW.follower_id, NEW.id, 'follow');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_follows') THEN
        DROP TRIGGER IF EXISTS on_follow_created_notify ON public.user_follows;
        CREATE TRIGGER on_follow_created_notify
            AFTER INSERT ON public.user_follows
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_new_follow_notification();
    END IF;
END $$;


-- 5. Trigger: Post Votes
CREATE OR REPLACE FUNCTION public.handle_new_vote_notification()
RETURNS TRIGGER AS $$
DECLARE
    post_owner_id UUID;
BEGIN
    IF NEW.vote > 0 THEN
        SELECT user_id INTO post_owner_id FROM public.posts WHERE id = NEW.post_id;
        IF post_owner_id != NEW.user_id THEN
             IF NOT EXISTS (SELECT 1 FROM public.notifications WHERE user_id = post_owner_id AND related_user_id = NEW.user_id AND related_entity_id = NEW.post_id AND type = 'like') THEN
                INSERT INTO public.notifications (user_id, type, title, body, related_user_id, related_entity_id, related_entity_type)
                VALUES (post_owner_id, 'like', 'New Like', 'liked your post', NEW.user_id, NEW.post_id, 'post');
             END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_vote_created_notify ON public.post_votes;
CREATE TRIGGER on_vote_created_notify
    AFTER INSERT ON public.post_votes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_vote_notification();


-- 6. Trigger: Messages
CREATE OR REPLACE FUNCTION public.handle_new_message_notification()
RETURNS TRIGGER AS $$
DECLARE
    participants UUID[];
    p_id UUID;
BEGIN
    SELECT participant_ids INTO participants FROM public.conversations WHERE id = NEW.conversation_id;
    
    FOREACH p_id IN ARRAY participants LOOP
        IF p_id != NEW.sender_id THEN
             INSERT INTO public.notifications (user_id, type, title, body, related_user_id, related_entity_id, related_entity_type)
             VALUES (p_id, 'message', 'New Message', substring(NEW.content from 1 for 100), NEW.sender_id, NEW.conversation_id, 'conversation');
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_created_notify ON public.messages;
CREATE TRIGGER on_message_created_notify
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_message_notification();


-- 7. Trigger: Content Reports (Admins)
CREATE OR REPLACE FUNCTION public.handle_new_report_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, body, related_user_id, related_entity_id, related_entity_type)
    SELECT id, 'system', 'New Report', 'Report type: ' || NEW.content_type, NEW.reporter_id, NEW.id, 'report'
    FROM public.profiles 
    WHERE is_admin = true;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_report_created_notify ON public.content_reports;
CREATE TRIGGER on_report_created_notify
    AFTER INSERT ON public.content_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_report_notification();
