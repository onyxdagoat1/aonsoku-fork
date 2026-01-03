-- Party System + Social + Profile Social Links Migration
-- Run this migration in Supabase SQL Editor
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- PROFILE SOCIAL LINKS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profile_social_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter','instagram','github','linkedin','youtube','spotify')),
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, platform)
);

ALTER TABLE public.profile_social_links ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "profile_social_links_select" ON public.profile_social_links
    FOR SELECT TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "profile_social_links_write_own" ON public.profile_social_links
    FOR ALL TO authenticated
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- PARTY SYSTEM TABLES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.parties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_live BOOLEAN NOT NULL DEFAULT true,
  is_private BOOLEAN NOT NULL DEFAULT false,
  password_hash TEXT,
  max_attendees INTEGER NOT NULL DEFAULT 50,
  scheduled_for TIMESTAMPTZ,
  genre_tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  current_track JSONB DEFAULT NULL,
  queue_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parties_host_id ON public.parties(host_id);
CREATE INDEX IF NOT EXISTS idx_parties_is_live ON public.parties(is_live);
CREATE INDEX IF NOT EXISTS idx_parties_scheduled_for ON public.parties(scheduled_for);

CREATE TABLE IF NOT EXISTS public.party_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'listener' CHECK (role IN ('host','listener','moderator')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(party_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_party_members_party_id ON public.party_members(party_id);
CREATE INDEX IF NOT EXISTS idx_party_members_user_id ON public.party_members(user_id);

CREATE TABLE IF NOT EXISTS public.party_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_party_messages_party_id ON public.party_messages(party_id);
CREATE INDEX IF NOT EXISTS idx_party_messages_created_at ON public.party_messages(created_at);

CREATE TABLE IF NOT EXISTS public.party_queue_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL,
  title TEXT,
  artist TEXT,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','played','skipped')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_party_queue_items_party_id ON public.party_queue_items(party_id);

CREATE TABLE IF NOT EXISTS public.party_queue_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_item_id UUID NOT NULL REFERENCES public.party_queue_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote SMALLINT NOT NULL CHECK (vote IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(queue_item_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_party_queue_votes_queue_item_id ON public.party_queue_votes(queue_item_id);

-- RLS
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_queue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_queue_votes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "parties_select" ON public.parties
    FOR SELECT TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "parties_insert" ON public.parties
    FOR INSERT TO authenticated
    WITH CHECK (host_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "parties_update_host" ON public.parties
    FOR UPDATE TO authenticated
    USING (host_id = auth.uid())
    WITH CHECK (host_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "parties_admin_all" ON public.parties
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "party_members_select" ON public.party_members
    FOR SELECT TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "party_members_insert_self" ON public.party_members
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "party_messages_select" ON public.party_messages
    FOR SELECT TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "party_messages_insert_member" ON public.party_messages
    FOR INSERT TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.party_members m
        WHERE m.party_id = party_messages.party_id
          AND m.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "party_messages_admin_delete" ON public.party_messages
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "party_queue_items_select" ON public.party_queue_items
    FOR SELECT TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "party_queue_items_insert_member" ON public.party_queue_items
    FOR INSERT TO authenticated
    WITH CHECK (
      requested_by = auth.uid() AND
      EXISTS (
        SELECT 1 FROM public.party_members m
        WHERE m.party_id = party_queue_items.party_id
          AND m.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "party_queue_items_admin_all" ON public.party_queue_items
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "party_queue_votes_select" ON public.party_queue_votes
    FOR SELECT TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "party_queue_votes_upsert_member" ON public.party_queue_votes
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (
      user_id = auth.uid() AND
      EXISTS (
        SELECT 1
        FROM public.party_queue_items qi
        JOIN public.party_members m ON m.party_id = qi.party_id
        WHERE qi.id = party_queue_votes.queue_item_id
          AND m.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- PARTY RPC HELPERS (PASSWORD-PROTECTED JOIN + CREATE)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.create_party(
  p_name TEXT,
  p_description TEXT DEFAULT '',
  p_is_private BOOLEAN DEFAULT false,
  p_password TEXT DEFAULT NULL,
  p_max_attendees INTEGER DEFAULT 50,
  p_scheduled_for TIMESTAMPTZ DEFAULT NULL,
  p_genre_tags TEXT[] DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_party_id UUID;
  v_host UUID;
BEGIN
  v_host := auth.uid();
  IF v_host IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.parties (
    name,
    description,
    host_id,
    is_live,
    is_private,
    password_hash,
    max_attendees,
    scheduled_for,
    genre_tags
  ) VALUES (
    p_name,
    COALESCE(p_description, ''),
    v_host,
    CASE WHEN p_scheduled_for IS NULL THEN true ELSE false END,
    COALESCE(p_is_private, false),
    CASE
      WHEN COALESCE(p_is_private, false)
        THEN extensions.crypt(COALESCE(p_password, ''), extensions.gen_salt('bf'))
      ELSE NULL
    END,
    COALESCE(p_max_attendees, 50),
    p_scheduled_for,
    COALESCE(p_genre_tags, ARRAY[]::TEXT[])
  ) RETURNING id INTO v_party_id;

  INSERT INTO public.party_members (party_id, user_id, role)
  VALUES (v_party_id, v_host, 'host')
  ON CONFLICT (party_id, user_id) DO NOTHING;

  RETURN v_party_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_party(TEXT, TEXT, BOOLEAN, TEXT, INTEGER, TIMESTAMPTZ, TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_party(TEXT, TEXT, BOOLEAN, TEXT, INTEGER, TIMESTAMPTZ, TEXT[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.join_party(
  p_party_id UUID,
  p_password TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user UUID;
  v_private BOOLEAN;
  v_hash TEXT;
BEGIN
  v_user := auth.uid();
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT is_private, password_hash
    INTO v_private, v_hash
  FROM public.parties
  WHERE id = p_party_id;

  IF v_private THEN
    IF v_hash IS NULL OR v_hash <> extensions.crypt(COALESCE(p_password, ''), v_hash) THEN
      RAISE EXCEPTION 'Invalid password';
    END IF;
  END IF;

  INSERT INTO public.party_members (party_id, user_id, role)
  VALUES (p_party_id, v_user, 'listener')
  ON CONFLICT (party_id, user_id) DO NOTHING;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.join_party(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_party(UUID, TEXT) TO authenticated;

-- =============================================================================
-- SOCIAL ACTIVITY
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.social_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('scrobble','favorite','playlist_add','party_join','party_create','follow')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_activity_created_at ON public.social_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_social_activity_user_id ON public.social_activity(user_id);

ALTER TABLE public.social_activity ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "social_activity_select" ON public.social_activity
    FOR SELECT TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "social_activity_insert_own" ON public.social_activity
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- ANNOUNCEMENTS (ADMIN -> EVERYONE)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_announcements_is_archived_created_at ON public.announcements(is_archived, created_at);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "announcements_select" ON public.announcements;
DROP POLICY IF EXISTS "announcements_admin_write" ON public.announcements;

DO $$ BEGIN
  CREATE POLICY "announcements_select" ON public.announcements
    FOR SELECT TO anon, authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "announcements_admin_insert" ON public.announcements
    FOR INSERT TO authenticated
    WITH CHECK (
      created_by = auth.uid() AND
      EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "announcements_admin_update" ON public.announcements
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "announcements_admin_delete" ON public.announcements
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT SELECT ON TABLE public.announcements TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.announcements TO authenticated;
