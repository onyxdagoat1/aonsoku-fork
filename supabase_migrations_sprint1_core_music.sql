-- Migration: Sprint 1 Core Music Features
-- Description: Adds tables for stream tracking, scheduled releases, charts, and playlist follows.

-- 1. Stream Tracking
-- Records individual streams
CREATE TABLE IF NOT EXISTS public.stream_counts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    track_id TEXT NOT NULL,
    album_id TEXT,
    artist_id TEXT,
    streamed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aggregated stats for quick access
CREATE TABLE IF NOT EXISTS public.track_stats (
    track_id TEXT PRIMARY KEY,
    total_streams INTEGER DEFAULT 0,
    unique_listeners INTEGER DEFAULT 0,
    last_streamed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RPC: Record a stream
CREATE OR REPLACE FUNCTION public.record_stream(
    p_track_id TEXT,
    p_album_id TEXT DEFAULT NULL,
    p_artist_id TEXT DEFAULT NULL,
    p_duration INTEGER DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    -- Insert individual record
    INSERT INTO public.stream_counts (user_id, track_id, album_id, artist_id, duration_seconds)
    VALUES (v_user_id, p_track_id, p_album_id, p_artist_id, p_duration);

    -- Update aggregated stats
    INSERT INTO public.track_stats (track_id, total_streams, unique_listeners, last_streamed_at, updated_at)
    VALUES (p_track_id, 1, 1, NOW(), NOW())
    ON CONFLICT (track_id)
    DO UPDATE SET
        total_streams = track_stats.total_streams + 1,
        last_streamed_at = NOW(),
        updated_at = NOW(),
        unique_listeners = (
            SELECT COUNT(DISTINCT user_id) 
            FROM public.stream_counts 
            WHERE track_id = p_track_id
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Get top streamed tracks
CREATE OR REPLACE FUNCTION public.get_top_streamed_tracks(
    limit_count INTEGER DEFAULT 10,
    period TEXT DEFAULT 'all_time' -- 'all_time', 'today', 'week', 'month'
)
RETURNS TABLE (
    track_id TEXT,
    stream_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT sc.track_id, COUNT(*) as count
    FROM public.stream_counts sc
    WHERE 
        CASE 
            WHEN period = 'today' THEN sc.streamed_at >= CURRENT_DATE
            WHEN period = 'week' THEN sc.streamed_at >= (NOW() - INTERVAL '7 days')
            WHEN period = 'month' THEN sc.streamed_at >= (NOW() - INTERVAL '30 days')
            ELSE TRUE
        END
    GROUP BY sc.track_id
    ORDER BY count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Scheduled Releases / Countdown
CREATE TABLE IF NOT EXISTS public.scheduled_releases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    artist_name TEXT,
    album_id TEXT, -- Nullable, if linked to Navidrome item
    cover_art_url TEXT,
    release_type TEXT CHECK (release_type IN ('album', 'single', 'compilation', 'edit', 'event')),
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_hidden BOOLEAN DEFAULT FALSE, -- For pre-upload hiding
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RPC: Get upcoming public releases
CREATE OR REPLACE FUNCTION public.get_upcoming_releases()
RETURNS SETOF public.scheduled_releases AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.scheduled_releases
    WHERE is_active = TRUE 
    AND is_hidden = FALSE 
    AND scheduled_at > NOW()
    ORDER BY scheduled_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Charts System (Snapshots)
CREATE TABLE IF NOT EXISTS public.chart_snapshots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    chart_type TEXT NOT NULL CHECK (chart_type IN ('streams', 'follows', 'likes')),
    content_type TEXT NOT NULL CHECK (content_type IN ('track', 'album', 'artist')),
    content_id TEXT NOT NULL,
    rank INTEGER NOT NULL,
    score INTEGER NOT NULL, -- stream count, like count, etc.
    snapshot_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RPC: Get charts
CREATE OR REPLACE FUNCTION public.get_chart(
    p_chart_type TEXT,
    p_content_type TEXT,
    p_limit INTEGER DEFAULT 50,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS SETOF public.chart_snapshots AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.chart_snapshots
    WHERE chart_type = p_chart_type 
    AND content_type = p_content_type
    AND snapshot_date = p_date
    ORDER BY rank ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Playlist Follows
-- Modify playlists table first
ALTER TABLE public.playlists ADD COLUMN IF NOT EXISTS followed_count INTEGER DEFAULT 0;
ALTER TABLE public.playlists ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.playlist_follows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE NOT NULL,
    followed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, playlist_id)
);

-- RPC: Follow playlist
CREATE OR REPLACE FUNCTION public.follow_playlist(p_playlist_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.playlist_follows (user_id, playlist_id)
    VALUES (auth.uid(), p_playlist_id);

    -- Update count
    UPDATE public.playlists 
    SET followed_count = followed_count + 1 
    WHERE id = p_playlist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Unfollow playlist
CREATE OR REPLACE FUNCTION public.unfollow_playlist(p_playlist_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.playlist_follows 
    WHERE user_id = auth.uid() AND playlist_id = p_playlist_id;

    -- Update count
    UPDATE public.playlists 
    SET followed_count = GREATEST(0, followed_count - 1) 
    WHERE id = p_playlist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Get followed playlists
CREATE OR REPLACE FUNCTION public.get_followed_playlists(p_user_id UUID)
RETURNS SETOF public.playlists AS $$
BEGIN
    RETURN QUERY
    SELECT p.* 
    FROM public.playlists p
    JOIN public.playlist_follows pf ON p.id = pf.playlist_id
    WHERE pf.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies

-- Stream Counts
ALTER TABLE public.stream_counts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own streams" ON public.stream_counts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own streams" ON public.stream_counts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all streams" ON public.stream_counts FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
);

-- Track Stats
ALTER TABLE public.track_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Track stats are viewable by everyone" ON public.track_stats FOR SELECT USING (true);
CREATE POLICY "System can update track stats" ON public.track_stats FOR ALL USING (true); -- Ideally restricted to service role, but public for RPC

-- Scheduled Releases
ALTER TABLE public.scheduled_releases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view active releases" ON public.scheduled_releases FOR SELECT USING (is_active = true AND is_hidden = false);
CREATE POLICY "Admins can manage releases" ON public.scheduled_releases FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
);

-- Chart Snapshots
ALTER TABLE public.chart_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Charts are viewable by everyone" ON public.chart_snapshots FOR SELECT USING (true);

-- Playlist Follows
ALTER TABLE public.playlist_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see who follows what" ON public.playlist_follows FOR SELECT USING (true);
CREATE POLICY "Users can manage their follows" ON public.playlist_follows FOR ALL USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.track_stats FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.scheduled_releases FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stream_counts_track ON public.stream_counts(track_id);
CREATE INDEX IF NOT EXISTS idx_stream_counts_user ON public.stream_counts(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_counts_time ON public.stream_counts(streamed_at DESC);
CREATE INDEX IF NOT EXISTS idx_scheduled_releases_date ON public.scheduled_releases(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_chart_snapshots_date ON public.chart_snapshots(snapshot_date, chart_type);
