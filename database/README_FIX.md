# Fix Database Error: "Database error saving new user"

## Problem
When signing up or logging in, you get the error:
```
Database error saving new user
error_code=unexpected_failure
```

This happens because the database trigger that creates user profiles is failing.

## Solution

### Option 1: Quick Fix (Recommended)
Run the SQL in `SIMPLE_FIX.sql` in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Click **SQL Editor** in the sidebar
3. Click **New Query**
4. Copy and paste the entire contents of `database/SIMPLE_FIX.sql`
5. Click **Run** (or press Cmd/Ctrl + Enter)

This will:
- Fix the trigger function with better error handling
- Ensure it can create profiles even if there are conflicts
- Re-enable RLS with proper policies

### Option 2: Manual Fix
If Option 1 doesn't work, try this:

1. Go to Supabase Dashboard → SQL Editor
2. Run this to check if the trigger exists:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

3. If it exists, drop it:
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
```

4. Then run the entire `SIMPLE_FIX.sql` file

### Option 3: Check RLS Policies
If the trigger still doesn't work, the issue might be with RLS:

1. Go to Supabase Dashboard → Authentication → Policies
2. Find the `profiles` table
3. Make sure these policies exist:
   - **SELECT**: "Public profiles are viewable by everyone" (USING: true)
   - **INSERT**: "Users can insert their own profile" (WITH CHECK: auth.uid() = id)
   - **UPDATE**: "Users can update their own profile" (USING: auth.uid() = id)

4. The trigger uses `SECURITY DEFINER` which should bypass RLS, but if it doesn't, you may need to temporarily disable RLS for the trigger to work:
```sql
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
-- Run the trigger fix
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

## Verification

After running the fix, test it:

1. Try signing up a new user
2. Check if a profile was created:
```sql
SELECT * FROM public.profiles ORDER BY created_at DESC LIMIT 5;
```

3. If profiles are being created, the fix worked!

## Common Issues

### Issue: "function does not exist"
**Solution**: Make sure you ran the entire `SIMPLE_FIX.sql` file, not just parts of it.

### Issue: "permission denied"
**Solution**: Make sure you're running the SQL as a user with proper permissions (usually the postgres user or service_role).

### Issue: "duplicate key value violates unique constraint"
**Solution**: The fix includes handling for this, but if it persists, you may need to clean up duplicate usernames:
```sql
-- Find duplicates
SELECT username, COUNT(*) FROM public.profiles GROUP BY username HAVING COUNT(*) > 1;

-- Fix them (be careful!)
UPDATE public.profiles 
SET username = username || '_' || substring(id::text, 1, 8)
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY username ORDER BY created_at) as rn
    FROM public.profiles
  ) t WHERE rn > 1
);
```

## Still Having Issues?

If the fix doesn't work:
1. Check the Supabase logs: Dashboard → Logs → Postgres Logs
2. Look for errors related to `handle_new_user` or `profiles` table
3. Make sure your database schema matches `database/MASTER_SCHEMA.sql`
4. Verify that the `profiles` table exists and has the correct structure

