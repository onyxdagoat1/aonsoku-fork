# Supabase Setup Guide for Comment System

This guide will walk you through setting up Supabase as the backend for your comment system.

## Prerequisites

- A Supabase account (free tier works fine)
- Your Aonsoku app running locally

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in:
   - **Name**: `aonsoku-comments` (or whatever you prefer)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait ~2 minutes for the project to be created

## Step 2: Run the Database Migration

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click "New query"
3. Copy the entire contents of `database/supabase-migration.sql`
4. Paste it into the SQL editor
5. Click **Run** (or press Ctrl/Cmd + Enter)
6. You should see: "Success. No rows returned"

### Verify Tables Were Created

1. Click **Table Editor** in the left sidebar
2. You should see two new tables:
   - `comments`
   - `comment_likes`

## Step 3: Get Your API Credentials

1. Click **Project Settings** (gear icon in sidebar)
2. Click **API** in the left menu
3. Find these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

## Step 4: Add Credentials to Your App

### Option A: Using .env file (Recommended)

1. Create a `.env` file in your project root (if it doesn't exist)
2. Add these lines:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

3. Replace with your actual values from Step 3
4. **IMPORTANT**: Add `.env` to `.gitignore` (it should already be there)

### Option B: Direct configuration (Not recommended for production)

Edit `src/lib/supabase.ts` and replace the placeholder values:

```typescript
const supabaseUrl = 'https://YOUR_PROJECT.supabase.co'
const supabaseAnonKey = 'your_anon_key_here'
```

## Step 5: Restart Your Dev Server

```bash
npm run dev
```

The app will now connect to Supabase!

## Step 6: Test the Comment System

1. Navigate to any artist or album page
2. Scroll to the bottom
3. Write a comment and click "Post Comment"
4. The comment should appear immediately
5. Refresh the page - **the comment should still be there!**

### Verify in Supabase

1. Go to **Table Editor** → **comments**
2. You should see your comment in the table

## Features Enabled

✅ **Persistent Comments** - Stored in PostgreSQL database  
✅ **User Authentication** - Uses Supabase Auth (with RLS policies)  
✅ **Like System** - Automatic like counting with triggers  
✅ **Real-time Updates** - Comments refresh automatically  
✅ **Security** - Row Level Security policies protect data  
✅ **Optimistic Updates** - Instant UI feedback  

## Security Features (Row Level Security)

The migration includes these security policies:

- ✅ Anyone can **read** comments (even without login)
- ✅ Only **authenticated users** can create comments
- ✅ Users can only **delete their own** comments
- ✅ Users can only **edit their own** comments
- ✅ Only authenticated users can like comments
- ✅ Users can unlike their own likes

## Database Features

### Automatic Like Counting

When users like/unlike comments, the `likes` count is automatically updated via database triggers.

### Automatic Timestamps

The `updated_at` field is automatically set when a comment is edited.

### Cascade Deletes

When a comment is deleted, all its likes are automatically deleted too.

## Testing with Sample Data

1. Open **SQL Editor** in Supabase
2. In `database/supabase-migration.sql`, find the commented section at the bottom
3. Uncomment the INSERT statements
4. Run them in the SQL editor
5. Refresh your app - you'll see sample comments!

## Monitoring

### View All Comments

1. Go to **Table Editor** → **comments**
2. You can view, edit, or delete comments here

### View Analytics

1. Go to **Database** → **Tables**
2. Click on `comments` or `comment_likes`
3. See row counts, storage size, etc.

### View Logs

1. Go to **Logs** → **Postgres Logs**
2. See all database queries in real-time

## Troubleshooting

### "Comments are not persisting"

1. Check browser console for errors (F12)
2. Verify `.env` file has correct credentials
3. Make sure dev server was restarted after adding `.env`
4. Check Supabase **Logs** for any errors

### "Failed to post comment"

1. Check if you're logged in to your app
2. Verify RLS policies are enabled (they should be from migration)
3. Check browser console for specific error
4. Look at **Logs** → **API** in Supabase

### "Error: relation 'comments' does not exist"

1. The migration didn't run successfully
2. Go to **SQL Editor** and run `database/supabase-migration.sql` again

### "User authentication not working"

1. The app uses your existing auth system
2. Supabase RLS policies check `auth.role() = 'authenticated'`
3. You may need to configure Supabase Auth or adjust RLS policies

## Advanced Configuration

### Using Supabase Auth (Optional)

If you want to use Supabase's built-in authentication:

1. Go to **Authentication** → **Providers**
2. Enable your preferred providers (Email, Google, etc.)
3. Update `src/app/hooks/use-auth.ts` to use Supabase auth
4. Update RLS policies to use `auth.uid()`

### Custom Policies

You can modify RLS policies in **Authentication** → **Policies**:

- Add moderator roles
- Allow anonymous comments
- Add spam filtering
- Rate limiting

### Backup Your Data

1. Go to **Database** → **Backups**
2. Backups are automatic on paid plans
3. Free tier: Export data via **Table Editor** → **Export to CSV**

## Performance Optimization

### Indexes

The migration creates indexes for:
- `entity_type + entity_id` (fast comment lookup)
- `user_id` (fast user comment history)
- `created_at` (fast sorting)

### Caching

React Query already handles caching. Comments are cached and only refetched when:
- You navigate to a different page
- You post/delete/like a comment
- Cache expires (default: 5 minutes)

## Production Deployment

### Environment Variables

Make sure to set these in your production environment:

```env
VITE_SUPABASE_URL=your_production_url
VITE_SUPABASE_ANON_KEY=your_production_key
```

### Security Checklist

- ✅ Never commit `.env` file
- ✅ Use environment variables for credentials
- ✅ Keep RLS policies enabled
- ✅ Regularly review **Logs** for suspicious activity
- ✅ Set up email notifications in Supabase

## Cost & Limits (Free Tier)

- ✅ 500 MB database storage
- ✅ Unlimited API requests
- ✅ 50,000 monthly active users
- ✅ 2 GB bandwidth

This is more than enough for most music apps!

## Next Steps

1. ✅ Complete the setup above
2. ✅ Test thoroughly in development
3. ✅ Customize the UI if needed
4. ✅ Add moderation features (optional)
5. ✅ Deploy to production

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **This Project's README**: See `COMMENTS_SYSTEM_README.md`

---

**You're all set!** 🎉 Your comment system now has a production-ready backend with Supabase!
