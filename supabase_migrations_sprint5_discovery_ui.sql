-- Migration: Sprint 5 & 6 - UI, Discovery, and Library Management
-- Description: Tables for user preferences, smart playlists, saved searches, queue history, and custom tags.

-- 1. User Preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    layout_settings JSONB DEFAULT '{}'::jsonb, -- grid_size, list_density, sidebar_config
    theme_settings JSONB DEFAULT '{}'::jsonb, -- animated_background, custom_colors
    playback_settings JSONB DEFAULT '{}'::jsonb, -- crossfade, replay_gain
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Smart Playlist Rules
CREATE TABLE IF NOT EXISTS public.smart_playlist_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE,
    field TEXT NOT NULL, -- bpm, genre, year, artist, added_at
    operator TEXT NOT NULL, -- equals, contains, gt, lt, range
    value TEXT,
    value_end TEXT, -- for ranges
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Saved Searches
CREATE TABLE IF NOT EXISTS public.saved_searches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    filters JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Queue History
CREATE TABLE IF NOT EXISTS public.queue_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    track_ids TEXT[] NOT NULL, -- Array of Navidrome IDs
    played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    saved_as_playlist_id UUID REFERENCES public.playlists(id) ON DELETE SET NULL
);

-- 5. Custom Tags (Library Management)
CREATE TABLE IF NOT EXISTS public.custom_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Null = System tag
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.content_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_type TEXT NOT NULL, -- track, album
    content_id TEXT NOT NULL,
    tag_id UUID REFERENCES public.custom_tags(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(content_type, content_id, tag_id, user_id)
);

-- RLS Policies

-- User Preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Smart Playlist Rules
ALTER TABLE public.smart_playlist_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view rules for visible playlists" ON public.smart_playlist_rules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.playlists 
            WHERE playlists.id = smart_playlist_rules.playlist_id 
            AND (playlists.is_public = true OR playlists.user_id = auth.uid())
        )
    );
CREATE POLICY "Users manage rules for own playlists" ON public.smart_playlist_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.playlists 
            WHERE playlists.id = smart_playlist_rules.playlist_id 
            AND playlists.user_id = auth.uid()
        )
    );

-- Saved Searches
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saved searches" ON public.saved_searches
    FOR ALL USING (auth.uid() = user_id);

-- Queue History
ALTER TABLE public.queue_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own queue history" ON public.queue_history
    FOR ALL USING (auth.uid() = user_id);

-- Custom Tags
ALTER TABLE public.custom_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view tags" ON public.custom_tags FOR SELECT USING (true);
CREATE POLICY "Admins manage system tags" ON public.custom_tags 
    FOR ALL USING (
        is_system = true AND 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );
CREATE POLICY "Users manage own tags" ON public.custom_tags
    FOR ALL USING (is_system = false AND created_by = auth.uid());

-- Content Tags
ALTER TABLE public.content_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view content tags" ON public.content_tags FOR SELECT USING (true);
CREATE POLICY "Users manage own content tags" ON public.content_tags
    FOR ALL USING (user_id = auth.uid());

-- Triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert Default System Tags
INSERT INTO public.custom_tags (name, color, is_system) VALUES
('Banger', '#FF0000', true),
('Chill', '#0000FF', true),
('Focus', '#00FF00', true),
('Gym', '#FFFF00', true)
ON CONFLICT DO NOTHING;
