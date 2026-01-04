-- Migration: Add reply_votes table for voting on post replies

CREATE TABLE IF NOT EXISTS public.reply_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reply_id UUID NOT NULL REFERENCES public.post_replies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vote INTEGER NOT NULL CHECK (vote IN (-1, 1)),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT reply_votes_unique UNIQUE (reply_id, user_id)
);

-- Enable RLS
ALTER TABLE public.reply_votes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read votes
CREATE POLICY "reply_votes_select_policy"
    ON public.reply_votes FOR SELECT
    USING (true);

-- Allow authenticated users to insert/update their own votes
CREATE POLICY "reply_votes_insert_policy"
    ON public.reply_votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reply_votes_update_policy"
    ON public.reply_votes FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reply_votes_delete_policy"
    ON public.reply_votes FOR DELETE
    USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_reply_votes_reply_id ON public.reply_votes(reply_id);
CREATE INDEX idx_reply_votes_user_id ON public.reply_votes(user_id);
