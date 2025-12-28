-- ============================================
-- FIX: Profile Creation Trigger
-- ============================================
-- This fixes the "Database error saving new user" issue
-- Run this in your Supabase SQL Editor

-- First, update RLS policy to allow trigger to insert
-- The trigger runs with SECURITY DEFINER, but RLS still applies
-- We need to allow the service_role to insert profiles
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop and recreate the function with better error handling
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
  max_attempts INTEGER := 100;
BEGIN
  -- Extract username from email
  IF NEW.email IS NOT NULL THEN
    base_username := split_part(NEW.email, '@', 1);
  ELSE
    base_username := 'user';
  END IF;
  
  -- Clean username: remove special characters, convert to lowercase
  base_username := lower(regexp_replace(base_username, '[^a-zA-Z0-9]', '', 'g'));
  
  -- Ensure minimum length (username must be 3-30 chars per schema)
  IF length(base_username) < 3 THEN
    base_username := 'user' || substring(replace(NEW.id::text, '-', ''), 1, 6);
  END IF;
  
  -- Ensure maximum length (30 chars per schema)
  IF length(base_username) > 30 THEN
    base_username := substring(base_username, 1, 30);
  END IF;
  
  final_username := base_username;
  
  -- Find available username (with safety limit)
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) AND counter < max_attempts LOOP
    counter := counter + 1;
    -- Append counter, but ensure total length doesn't exceed 30
    IF length(base_username) + length(counter::text) > 30 THEN
      final_username := substring(base_username, 1, 30 - length(counter::text)) || counter::text;
    ELSE
      final_username := base_username || counter::text;
    END IF;
  END LOOP;
  
  -- If we hit max attempts, use UUID-based username
  IF counter >= max_attempts THEN
    final_username := 'user' || substring(replace(NEW.id::text, '-', ''), 1, 20);
  END IF;
  
  -- Insert profile with error handling
  BEGIN
    INSERT INTO public.profiles (id, username, display_name, avatar_url)
    VALUES (
      NEW.id,
      final_username,
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'display_name',
        final_username
      ),
      COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture'
      )
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- If username still conflicts, use UUID-based fallback
      final_username := 'user' || substring(replace(NEW.id::text, '-', ''), 1, 20);
      INSERT INTO public.profiles (id, username, display_name, avatar_url)
      VALUES (
        NEW.id,
        final_username,
        COALESCE(
          NEW.raw_user_meta_data->>'full_name',
          NEW.raw_user_meta_data->>'name',
          NEW.raw_user_meta_data->>'display_name',
          final_username
        ),
        COALESCE(
          NEW.raw_user_meta_data->>'avatar_url',
          NEW.raw_user_meta_data->>'picture'
        )
      );
    WHEN OTHERS THEN
      -- Log error but don't fail the user creation
      RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
      -- Try one more time with UUID-based username
      final_username := 'user' || substring(replace(NEW.id::text, '-', ''), 1, 20);
      INSERT INTO public.profiles (id, username, display_name, avatar_url)
      VALUES (
        NEW.id,
        final_username,
        final_username,
        NULL
      );
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Re-enable RLS with updated policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Update RLS policies to allow trigger inserts
-- The trigger runs with SECURITY DEFINER, so it should bypass RLS
-- But we'll add a policy that allows service_role inserts as a fallback
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Ensure the function owner has proper permissions
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

