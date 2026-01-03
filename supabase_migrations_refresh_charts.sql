-- Migration: Chart Calculation Functions
-- Run this in Supabase SQL Editor to enable chart generation

-- RPC: Calculate and snapshot charts for the day
CREATE OR REPLACE FUNCTION public.calculate_recent_charts()
RETURNS VOID AS $$
DECLARE
    v_date DATE := CURRENT_DATE;
BEGIN
    -- 1. DELETE existing snapshots for today to allow re-run
    DELETE FROM public.chart_snapshots WHERE snapshot_date = v_date;

    -- 2. Top Tracks (Streams - All Time for now, or last 30 days)
    -- Insert into snapshots
    INSERT INTO public.chart_snapshots (chart_type, content_type, content_id, rank, score, snapshot_date)
    SELECT 
        'streams', 
        'track', 
        track_id, 
        ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC),
        COUNT(*),
        v_date
    FROM public.stream_counts
    WHERE streamed_at >= (NOW() - INTERVAL '30 days') -- Monthly chart
    GROUP BY track_id
    LIMIT 50;

    -- 3. Top Artists (Streams)
    INSERT INTO public.chart_snapshots (chart_type, content_type, content_id, rank, score, snapshot_date)
    SELECT 
        'streams', 
        'artist', 
        artist_id, 
        ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC),
        COUNT(*),
        v_date
    FROM public.stream_counts
    WHERE streamed_at >= (NOW() - INTERVAL '30 days')
    AND artist_id IS NOT NULL
    GROUP BY artist_id
    LIMIT 50;

    -- 4. Top Albums (Streams)
    INSERT INTO public.chart_snapshots (chart_type, content_type, content_id, rank, score, snapshot_date)
    SELECT 
        'streams', 
        'album', 
        album_id, 
        ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC),
        COUNT(*),
        v_date
    FROM public.stream_counts
    WHERE streamed_at >= (NOW() - INTERVAL '30 days')
    AND album_id IS NOT NULL
    GROUP BY album_id
    LIMIT 50;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
