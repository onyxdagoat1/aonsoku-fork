# Quick Environment Setup Guide

## Problem: "supabaseUrl is required" Error

This means your `.env` file is missing or doesn't have Supabase credentials.

## Quick Fix (2 minutes)

### Step 1: Create `.env` File

**In your project root directory**, create a file named `.env` (no extension!):

```bash
# On Mac/Linux:
cp .env.example .env

# On Windows:
copy .env.example .env
```

### Step 2: Add Your Supabase Credentials

Open the `.env` file and add:

```env
# Navidrome (keep your existing values)
VITE_SERVER_URL=http://localhost:4533
VITE_SERVER_USER=demo
VITE_SERVER_PASSWORD=demo

# Supabase - ADD THESE TWO LINES
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Get Your Supabase Credentials

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click on your project
3. Click **Settings** (gear icon) in the left sidebar
4. Click **API**
5. Copy these two values:
   - **Project URL** → This is your `VITE_SUPABASE_URL`
   - **anon public** key → This is your `VITE_SUPABASE_ANON_KEY`

### Step 4: Paste Into `.env`

Replace the placeholder values:

```env
# BEFORE:
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# AFTER (with your actual values):
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODQ4NjE4MDAsImV4cCI6MjAwMDQzNzgwMH0.abcdefghijklmnopqrstuvwxyz1234567890
```

**Important:** NO quotes, NO spaces around the `=` sign!

### Step 5: Restart Dev Server

```bash
# Stop the server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

### Step 6: Test It!

Open your browser:
```
http://localhost:3000/#/auth/login
```

You should see the login page! ✅

---

## Don't Have a Supabase Account Yet?

### Create One (Free, 5 minutes)

1. Go to [supabase.com](https://supabase.com)
2. Click **Start your project**
3. Sign up with GitHub (easiest)
4. Click **New Project**
5. Fill in:
   - **Name:** `yedits-net`
   - **Database Password:** (generate strong password, save it!)
   - **Region:** Choose closest to you
6. Click **Create new project**
7. Wait ~2 minutes for setup
8. Follow Step 3 above to get your credentials

---

## Still Not Working?

### Check Your `.env` File

```bash
# See if file exists:
ls -la .env

# View contents (Mac/Linux):
cat .env

# View contents (Windows):
type .env
```

Should show:
```
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Common Mistakes

❌ **Wrong:** Quotes around values
```env
VITE_SUPABASE_URL="https://xxx.supabase.co"  # DON'T DO THIS
```

✅ **Correct:** No quotes
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
```

❌ **Wrong:** Spaces around `=`
```env
VITE_SUPABASE_URL = https://xxx.supabase.co  # DON'T DO THIS
```

✅ **Correct:** No spaces
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
```

❌ **Wrong:** Using placeholder values
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co  # This won't work!
```

✅ **Correct:** Your actual project URL
```env
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
```

### Verify It's Working

After restarting the dev server, open browser console (F12) and you should see:

```
Supabase Configuration: {
  configured: true,
  hasUrl: true,
  hasKey: true,
  url: 'https://abcdefgh.supabase.co...'
}
```

If you see `configured: false`, your `.env` file isn't being read.

---

## Need More Help?

See the full troubleshooting guide: [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
