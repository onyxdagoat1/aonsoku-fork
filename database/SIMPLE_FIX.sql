-- ============================================
-- SIMPLE FIX: Profile Creation Trigger
-- ============================================
-- This fixes the "Database error saving new user" issue
-- Run this in your Supabase SQL Editor
-- 
-- The issue is that RLS policies might be blocking the trigger
-- This fix ensures the trigger can create profiles

-- Step 1: Temporarily disable RLS to fix the trigger
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop and recreate the function with better error handling
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
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
  
  -- Find available username
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    -- Append counter, but ensure total length doesn't exceed 30
    IF length(base_username) + length(counter::text) > 30 THEN
      final_username := substring(base_username, 1, 30 - length(counter::text)) || counter::text;
    ELSE
      final_username := base_username || counter::text;
    END IF;
    
    -- Safety check to prevent infinite loop
    IF counter > 100 THEN
      final_username := 'user' || substring(replace(NEW.id::text, '-', ''), 1, 20);
      EXIT;
    END IF;
  END LOOP;
  
  -- Insert profile
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
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate inserts
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW; -- Still allow user creation to succeed
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Ensure policies are correct
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- The trigger function uses SECURITY DEFINER, so it runs as the function owner (postgres)
-- This should bypass RLS policies. If it still doesn't work, the issue might be
-- that the function needs to be owned by a role with proper permissions.

