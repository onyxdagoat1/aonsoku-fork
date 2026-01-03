-- Migration: Sprint 1 Social Features
-- Description: Adds tables for user posts, direct messaging, and profile verification.

-- 1. Profile Verification
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_type TEXT CHECK (verification_type IN ('artist', 'contributor', 'staff', 'influencer'));

-- 2. User Posts System
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT,
    post_type TEXT CHECK (post_type IN ('text', 'image', 'track_share', 'album_share', 'playlist_share')) DEFAULT 'text',
    attached_content_id TEXT, -- track_id, album_id, etc.
    attached_content_type TEXT,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post Votes
CREATE TABLE IF NOT EXISTS public.post_votes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    vote SMALLINT NOT NULL CHECK (vote IN (1, -1)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Post Replies (Threaded)
CREATE TABLE IF NOT EXISTS public.post_replies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    parent_reply_id UUID REFERENCES public.post_replies(id) ON DELETE CASCADE, -- Allow nesting
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RPC: Vote on Post
CREATE OR REPLACE FUNCTION public.vote_post(p_post_id UUID, p_vote SMALLINT)
RETURNS VOID AS $$
DECLARE
    v_existing_vote SMALLINT;
BEGIN
    SELECT vote INTO v_existing_vote FROM public.post_votes WHERE post_id = p_post_id AND user_id = auth.uid();

    IF v_existing_vote IS NOT NULL THEN
        IF v_existing_vote = p_vote THEN
            -- Remove vote (toggle off)
            DELETE FROM public.post_votes WHERE post_id = p_post_id AND user_id = auth.uid();
            IF p_vote = 1 THEN
                UPDATE public.posts SET upvotes = upvotes - 1 WHERE id = p_post_id;
            ELSE
                UPDATE public.posts SET downvotes = downvotes - 1 WHERE id = p_post_id;
            END IF;
        ELSE
            -- Change vote
            UPDATE public.post_votes SET vote = p_vote WHERE post_id = p_post_id AND user_id = auth.uid();
            IF p_vote = 1 THEN
                UPDATE public.posts SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = p_post_id;
            ELSE
                UPDATE public.posts SET downvotes = downvotes + 1, upvotes = upvotes - 1 WHERE id = p_post_id;
            END IF;
        END IF;
    ELSE
        -- New vote
        INSERT INTO public.post_votes (post_id, user_id, vote) VALUES (p_post_id, auth.uid(), p_vote);
        IF p_vote = 1 THEN
            UPDATE public.posts SET upvotes = upvotes + 1 WHERE id = p_post_id;
        ELSE
            UPDATE public.posts SET downvotes = downvotes + 1 WHERE id = p_post_id;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Direct Messaging
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    participant_ids UUID[] NOT NULL, -- Array of user IDs
    last_message_preview TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for DM
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations USING GIN(participant_ids);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

-- RPC: Start or Get Conversation
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(p_other_user_id UUID)
RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;
    v_user_id UUID;
    v_participants UUID[];
BEGIN
    v_user_id := auth.uid();
    -- Sort participants to ensure uniqueness check works (requires predictable order if we enforced unique constraint differently, but array containment is easier)
    -- Simply looking for a conversation that has exactly these two participants.
    
    SELECT id INTO v_conversation_id
    FROM public.conversations
    WHERE participant_ids @> ARRAY[v_user_id, p_other_user_id] 
    AND participant_ids @> ARRAY[p_other_user_id, v_user_id]
    AND array_length(participant_ids, 1) = 2
    LIMIT 1;

    IF v_conversation_id IS NULL THEN
        INSERT INTO public.conversations (participant_ids)
        VALUES (ARRAY[v_user_id, p_other_user_id])
        RETURNING id INTO v_conversation_id;
    END IF;

    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies

-- Posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view posts" ON public.posts FOR SELECT USING (is_deleted = false);
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id); -- Logical delete usually

-- Post Votes
ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view votes" ON public.post_votes FOR SELECT USING (true);
CREATE POLICY "Users can manage their votes" ON public.post_votes FOR ALL USING (auth.uid() = user_id);

-- Post Replies
ALTER TABLE public.post_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view replies" ON public.post_replies FOR SELECT USING (true);
CREATE POLICY "Users can reply" ON public.post_replies FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their conversations" ON public.conversations FOR SELECT USING (auth.uid() = ANY(participant_ids));
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = ANY(participant_ids));

-- Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages in their conversations" 
ON public.messages FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.conversations 
        WHERE id = messages.conversation_id 
        AND auth.uid() = ANY(participant_ids)
    )
);
CREATE POLICY "Users can send messages to their conversations" 
ON public.messages FOR INSERT 
WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM public.conversations 
        WHERE id = messages.conversation_id 
        AND auth.uid() = ANY(participant_ids)
    )
);

-- Triggers for updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.post_replies FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add messages to realtime
-- Note: You might need to run this manually in dashboard if specific publication setup is needed, but this is the SQL command.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'conversations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
END;
$$;
