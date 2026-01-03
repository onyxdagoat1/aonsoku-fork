-- Add location and badges columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'::jsonb;

-- Update RLS policies if necessary (usually they cover all columns)
-- No changes needed to RLS as they already allow users to update their own profile rows.
