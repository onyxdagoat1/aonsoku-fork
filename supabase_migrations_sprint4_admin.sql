-- Migration: Sprint 4 Admin & Moderation
-- Description: Adds tables for blacklist, content reports, and moderation actions.

-- 1. Blacklisted Words
CREATE TABLE IF NOT EXISTS public.blacklisted_words (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    word TEXT NOT NULL UNIQUE,
    severity TEXT CHECK (severity IN ('warn', 'block', 'shadow_ban')) DEFAULT 'block',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Content Reports
CREATE TABLE IF NOT EXISTS public.content_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL, -- 'post', 'comment', 'user', 'message'
    content_id TEXT NOT NULL,
    reason TEXT,
    description TEXT,
    status TEXT CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')) DEFAULT 'pending',
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Moderation Actions (Audit Log)
CREATE TABLE IF NOT EXISTS public.moderation_actions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    action TEXT CHECK (action IN ('warn', 'delete', 'ban', 'shadow_ban', 'dismiss')),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies

-- Blacklisted Words
ALTER TABLE public.blacklisted_words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage blacklist" ON public.blacklisted_words 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
    );
CREATE POLICY "Everyone can read blacklist (for client-side validation)" ON public.blacklisted_words
    FOR SELECT USING (true);

-- Content Reports
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create reports" ON public.content_reports 
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins can view and update reports" ON public.content_reports 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
    );

-- Moderation Actions
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view and create actions" ON public.moderation_actions 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
    );

-- Triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.content_reports FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add Indexes
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.content_reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created ON public.content_reports(created_at);
