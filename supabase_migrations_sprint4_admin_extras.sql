-- Migration: Sprint 4 Admin Extras
-- Description: Adds tables for Scheduled Releases, Announcements, and Party System which are used in the Admin Panel.

-- 1. Scheduled Releases
CREATE TABLE IF NOT EXISTS public.scheduled_releases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    release_type TEXT CHECK (release_type IN ('album', 'single', 'event', 'compilation', 'edit')) DEFAULT 'album',
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_hidden BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_archived BOOLEAN DEFAULT false,
    archived_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Party System
CREATE TABLE IF NOT EXISTS public.parties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    host_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_live BOOLEAN DEFAULT false,
    is_private BOOLEAN DEFAULT false,
    password TEXT,
    max_attendees INTEGER DEFAULT 50,
    current_track JSONB, -- store track metadata
    queue_locked BOOLEAN DEFAULT false,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.party_members (
    party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (party_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.party_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.party_queue_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE,
    requested_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    artist TEXT,
    uri TEXT, -- Spotify/YouTube/Local URI
    duration_ms INTEGER,
    provider TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    played_at TIMESTAMP WITH TIME ZONE -- null if not played
);

CREATE TABLE IF NOT EXISTS public.party_queue_votes (
    queue_item_id UUID REFERENCES public.party_queue_items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    vote INTEGER NOT NULL CHECK (vote IN (1, -1)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (queue_item_id, user_id)
);

-- RLS Policies

-- Scheduled Releases
ALTER TABLE public.scheduled_releases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active releases" ON public.scheduled_releases;
CREATE POLICY "Public can view active releases" ON public.scheduled_releases 
    FOR SELECT USING (is_hidden = false OR is_active = true);
DROP POLICY IF EXISTS "Admins can manage releases" ON public.scheduled_releases;
CREATE POLICY "Admins can manage releases" ON public.scheduled_releases 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
    );

-- Announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read announcements" ON public.announcements;
CREATE POLICY "Public can read announcements" ON public.announcements 
    FOR SELECT USING (is_archived = false);
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
CREATE POLICY "Admins can manage announcements" ON public.announcements 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
    );

-- Parties
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view live parties" ON public.parties;
CREATE POLICY "Public can view live parties" ON public.parties
    FOR SELECT USING (true); -- Simplified for visibility
DROP POLICY IF EXISTS "Hosts can manage their parties" ON public.parties;
CREATE POLICY "Hosts can manage their parties" ON public.parties
    FOR ALL USING (auth.uid() = host_id OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

ALTER TABLE public.party_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view other members" ON public.party_members;
CREATE POLICY "Members can view other members" ON public.party_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can join/leave" ON public.party_members;
CREATE POLICY "Users can join/leave" ON public.party_members FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.party_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can read messages in party" ON public.party_messages;
CREATE POLICY "Everyone can read messages in party" ON public.party_messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Members can post messages" ON public.party_messages;
CREATE POLICY "Members can post messages" ON public.party_messages 
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.party_members WHERE party_id = party_messages.party_id AND user_id = auth.uid())
    );

ALTER TABLE public.party_queue_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can read queue" ON public.party_queue_items;
CREATE POLICY "Everyone can read queue" ON public.party_queue_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Members can add to queue" ON public.party_queue_items;
CREATE POLICY "Members can add to queue" ON public.party_queue_items 
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.party_members WHERE party_id = party_queue_items.party_id AND user_id = auth.uid())
    );

ALTER TABLE public.party_queue_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view votes" ON public.party_queue_votes;
CREATE POLICY "Everyone can view votes" ON public.party_queue_votes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can vote" ON public.party_queue_votes;
CREATE POLICY "Users can vote" ON public.party_queue_votes FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_releases_scheduled ON public.scheduled_releases(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON public.announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_parties_host ON public.parties(host_id);
