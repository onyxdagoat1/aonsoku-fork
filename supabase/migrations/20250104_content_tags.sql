-- Migration: Add content_tags table for AI and Edit Type tagging
-- This table stores AI generation status and edit type for albums and songs

-- Drop existing objects if they exist (for clean re-run)
DROP TABLE IF EXISTS public.content_tags CASCADE;

-- Create the table
CREATE TABLE public.content_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id TEXT NOT NULL,
    content_type TEXT NOT NULL,
    ai_tag TEXT DEFAULT NULL,
    edit_type TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT content_tags_content_type_check CHECK (content_type IN ('album', 'song')),
    CONSTRAINT content_tags_ai_tag_check CHECK (ai_tag IS NULL OR ai_tag IN ('human', 'ai')),
    CONSTRAINT content_tags_edit_type_check CHECK (edit_type IS NULL OR edit_type IN ('highlight', 'unique', 'vanilla', 'overhaul', 'renovation', 'extension', 'remix')),
    CONSTRAINT content_tags_unique UNIQUE (content_id, content_type)
);

-- Enable RLS
ALTER TABLE public.content_tags ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read content tags
CREATE POLICY "content_tags_select_policy"
    ON public.content_tags FOR SELECT
    USING (true);

-- Allow anyone to insert content tags (for now)
CREATE POLICY "content_tags_insert_policy"
    ON public.content_tags FOR INSERT
    WITH CHECK (true);

-- Allow anyone to update content tags (for now)
CREATE POLICY "content_tags_update_policy"
    ON public.content_tags FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Basic indexes (without partial index conditions)
CREATE INDEX idx_content_tags_content_id ON public.content_tags(content_id);
CREATE INDEX idx_content_tags_content_type ON public.content_tags(content_type);
