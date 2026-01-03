-- Migration: Fix Playlist ID type to Text to match Navidrome IDs
ALTER TABLE public.playlists ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.playlists ALTER COLUMN id TYPE TEXT;
