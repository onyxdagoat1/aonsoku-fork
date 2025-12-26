# Supabase Implementation Guide

## Overview

We've successfully integrated Supabase Auth + PostgreSQL into yedits.net! This enables social features while maintaining Navidrome as the music backend.

## What's Been Implemented

### ✅ Core Infrastructure

1. **Supabase Client** (`src/lib/supabase.ts`)
   - Initialized with environment variables
   - Automatic session management
   - PKCE auth flow for security
   - Graceful fallback when not configured

2. **Database Schema** (`supabase/schema.sql`)
   - 7 tables with full Row Level Security
   - Automatic triggers for timestamps
   - Auto-create profiles on signup
   - Foreign key relationships

3. **TypeScript Types** (`src/lib/database.types.ts`)
   - Full type safety for all tables
   - Auto-generated from schema
   - IDE autocomplete support

### ✅ Authentication System

4. **Auth Context** (`src/contexts/AuthContext.tsx`)
   - Centralized auth state management
   - Email/password authentication
   - OAuth (Google, Discord, GitHub)
   - Profile loading and updates
   - Session persistence

5. **Auth Hooks** (React hooks for easy use)
   - `useAuth()` - Main auth hook
   - `useComments()` - Song comments
   - `usePlaylists()` - Playlist management
   - `useFavorites()` - Favorite songs

### ✅ Features Ready to Use

| Feature | Table | Status | Description |
|---------|-------|--------|-------------|
| **User Profiles** | `profiles` | ✅ Ready | Avatar, bio, username |
| **Comments** | `comments` | ✅ Ready | Nested replies support |
| **Playlists** | `playlists` | ✅ Ready | Public/private sharing |
| **Collaborators** | `playlist_collaborators` | ✅ Ready | Shared editing |
| **Favorites** | `favorites` | ✅ Ready | Quick access |
| **History** | `listening_history` | ✅ Ready | Play tracking |

## Architecture

```
┌─────────────────────────────────────────────┐
│          User Interface (React)             │
│  ┌─────────────┐  ┌────────────────────┐  │
│  │ Auth Pages  │  │ Social Features    │  │
│  │ - Login     │  │ - Comments         │  │
│  │ - Register  │  │ - Playlists        │  │
│  │ - OAuth     │  │ - Profiles         │  │
│  └─────────────┘  └────────────────────┘  │
└──────────┬─────────────────┬───────────────┘
           │                 │
           ▼                 ▼
    ┌─────────────┐   ┌─────────────┐
    │  Supabase   │   │  Navidrome  │
    │   Client    │   │   Client    │
    └──────┬──────┘   └──────┬──────┘
           │                 │
           ▼                 ▼
    ┌─────────────┐   ┌─────────────┐
    │  Supabase   │   │  Navidrome  │
    │   Cloud     │   │   Server    │
    │  - Auth     │   │  - Music    │
    │  - Database │   │  - Streams  │
    │  - Storage  │   │  - Metadata │
    └─────────────┘   └─────────────┘
```

## Database Schema

### Tables Overview

#### 1. `profiles` - User Profiles
```sql
id                              UUID (PK, FK to auth.users)
username                        TEXT UNIQUE
display_name                    TEXT
avatar_url                      TEXT
bio                             TEXT
navidrome_username              TEXT (optional)
navidrome_credentials_encrypted TEXT (optional)
created_at, updated_at          TIMESTAMPTZ
```

**Features:**
- Auto-created on user signup
- Public viewing, owner editing only
- Can store encrypted Navidrome credentials
- Username validation (3-30 chars)

#### 2. `comments` - Song Comments
```sql
id          UUID (PK)
user_id     UUID (FK to profiles)
song_id     TEXT (Navidrome song ID)
content     TEXT (1-2000 chars)
parent_id   UUID (FK to comments, for replies)
created_at, updated_at  TIMESTAMPTZ
```

**Features:**
- Threaded replies (via `parent_id`)
- Public viewing, authenticated posting
- Owner can edit/delete own comments
- Indexed by song_id for performance

#### 3. `playlists` - User Playlists
```sql
id            UUID (PK)
user_id       UUID (FK to profiles)
name          TEXT (1-100 chars)
description   TEXT (max 500 chars)
is_public     BOOLEAN
cover_art_url TEXT
song_count    INTEGER (auto-updated)
created_at, updated_at  TIMESTAMPTZ
```

**Features:**
- Public/private visibility
- Automatic song count tracking
- Cover art support
- Owner management only

#### 4. `playlist_songs` - Playlist Contents
```sql
id          UUID (PK)
playlist_id UUID (FK to playlists)
song_id     TEXT (Navidrome song ID)
position    INTEGER (for ordering)
added_at    TIMESTAMPTZ
```

**Features:**
- Order preservation
- Unique constraint (no duplicate songs)
- Auto-updates parent playlist song_count
- Visible to playlist viewers

#### 5. `playlist_collaborators` - Shared Editing
```sql
id          UUID (PK)
playlist_id UUID (FK to playlists)
user_id     UUID (FK to profiles)
can_edit    BOOLEAN
added_at    TIMESTAMPTZ
```

**Features:**
- Share playlists with others
- View-only or edit permissions
- Managed by playlist owner

#### 6. `favorites` - Favorite Songs
```sql
id         UUID (PK)
user_id    UUID (FK to profiles)
song_id    TEXT (Navidrome song ID)
created_at TIMESTAMPTZ
```

**Features:**
- Quick favorite/unfavorite
- Private to user
- Unique constraint (one favorite per song)

#### 7. `listening_history` - Play Tracking
```sql
id                    UUID (PK)
user_id               UUID (FK to profiles)
song_id               TEXT (Navidrome song ID)
played_at             TIMESTAMPTZ
play_duration_seconds INTEGER
```

**Features:**
- Track what users listen to
- Optional duration tracking
- Private to user
- Can generate stats/recommendations

## Usage Examples

### Authentication

```tsx
import { useAuth } from '@/contexts/AuthContext'

function LoginPage() {
  const { signIn, signInWithProvider } = useAuth()

  // Email/Password
  const handleEmailLogin = async () => {
    await signIn('user@example.com', 'password')
  }

  // OAuth
  const handleGoogleLogin = async () => {
    await signInWithProvider('google')
  }

  return (
    <div>
      <button onClick={handleEmailLogin}>Email Login</button>
      <button onClick={handleGoogleLogin}>Continue with Google</button>
    </div>
  )
}
```

### Comments

```tsx
import { useComments } from '@/hooks/useComments'
import { useAuth } from '@/contexts/AuthContext'

function SongComments({ songId }: { songId: string }) {
  const { user } = useAuth()
  const { comments, createComment, isLoading } = useComments(songId)

  const handlePost = async (content: string) => {
    createComment({ song_id: songId, content })
  }

  return (
    <div>
      {comments.map(comment => (
        <div key={comment.id}>
          <strong>{comment.profiles.username}</strong>
          <p>{comment.content}</p>
        </div>
      ))}
      {user && <CommentForm onSubmit={handlePost} />}
    </div>
  )
}
```

### Playlists

```tsx
import { usePlaylists } from '@/hooks/usePlaylists'
import { useAuth } from '@/contexts/AuthContext'

function MyPlaylists() {
  const { user } = useAuth()
  const { playlists, createPlaylist } = usePlaylists(user?.id)

  const handleCreate = async () => {
    await createPlaylist({
      name: 'My Playlist',
      description: 'Great music',
      is_public: true
    })
  }

  return (
    <div>
      <button onClick={handleCreate}>New Playlist</button>
      {playlists.map(playlist => (
        <div key={playlist.id}>
          <h3>{playlist.name}</h3>
          <p>{playlist.song_count} songs</p>
        </div>
      ))}
    </div>
  )
}
```

### Favorites

```tsx
import { useFavorites } from '@/hooks/useFavorites'
import { useAuth } from '@/contexts/AuthContext'

function FavoriteButton({ songId }: { songId: string }) {
  const { user } = useAuth()
  const { isFavorite, toggleFavorite } = useFavorites(user?.id)

  return (
    <button onClick={() => toggleFavorite(songId)}>
      {isFavorite(songId) ? '❤️' : '🤍'}
    </button>
  )
}
```

## Next Steps: Building UI Components

### Phase 1: Auth Pages (High Priority)

1. **Create Login Page** (`src/pages/Login.tsx`)
   ```tsx
   - Email/password form
   - OAuth buttons (Google, Discord, GitHub)
   - Link to register page
   - Forgot password flow
   ```

2. **Create Register Page** (`src/pages/Register.tsx`)
   ```tsx
   - Email/password/username form
   - OAuth signup buttons
   - Terms of service checkbox
   - Redirect to login after success
   ```

3. **Auth Callback Handler** (`src/pages/AuthCallback.tsx`)
   ```tsx
   - Handle OAuth redirects
   - Extract session from URL
   - Redirect to app after success
   ```

4. **Profile Page** (`src/pages/Profile.tsx`)
   ```tsx
   - View/edit profile
   - Avatar upload
   - Link Navidrome account
   - Privacy settings
   ```

### Phase 2: Social Features (Medium Priority)

5. **Comments Component** (`src/components/Comments.tsx`)
   ```tsx
   - List comments for song
   - Reply to comments (nested)
   - Edit/delete own comments
   - Real-time updates (optional)
   ```

6. **Playlist Manager** (`src/components/PlaylistManager.tsx`)
   ```tsx
   - Create/edit/delete playlists
   - Add/remove songs
   - Reorder songs
   - Share settings
   ```

7. **Public Playlists Browser** (`src/pages/DiscoverPlaylists.tsx`)
   ```tsx
   - Browse public playlists
   - Filter by genre/popularity
   - Follow/subscribe to playlists
   - Import to own library
   ```

### Phase 3: Advanced Features (Low Priority)

8. **User Profiles** (`src/pages/UserProfile.tsx`)
   ```tsx
   - View other users' profiles
   - See public playlists
   - Follow/unfollow users
   - Activity feed
   ```

9. **Listening Stats** (`src/pages/Stats.tsx`)
   ```tsx
   - Most played songs
   - Listening time charts
   - Top artists/albums
   - Weekly/monthly summaries
   ```

10. **Recommendations** (`src/pages/Recommendations.tsx`)
    ```tsx
    - Based on listening history
    - Similar users' favorites
    - Trending in community
    - Personalized playlists
    ```

## Security Considerations

### Row Level Security (RLS)

All tables have RLS enabled:

```sql
-- Users can only edit their own data
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

### Best Practices

1. **Never expose service_role key** - Only use anon key in frontend
2. **Validate all inputs** - Use Zod schemas for forms
3. **Encrypt sensitive data** - Navidrome credentials should be encrypted
4. **Use prepared statements** - Supabase client handles this
5. **Rate limiting** - Enable in Supabase dashboard

### Navidrome Integration

Users can link their Navidrome account in two ways:

**Option 1: Store encrypted credentials** (auto-login)
```tsx
const encryptedCreds = encryptPassword(navidromePassword)
await updateProfile({
  navidrome_username: username,
  navidrome_credentials_encrypted: encryptedCreds
})
```

**Option 2: Session-based** (login each time)
```tsx
// User logs into Navidrome separately
// App uses Supabase for social features only
// No credential storage needed
```

## Testing Checklist

- [ ] Sign up with email/password
- [ ] Sign in with email/password
- [ ] Sign in with Google OAuth
- [ ] Sign in with Discord OAuth
- [ ] Profile auto-created on signup
- [ ] Update profile (username, bio, avatar)
- [ ] Create comment on song
- [ ] Reply to comment
- [ ] Edit own comment
- [ ] Delete own comment
- [ ] Create private playlist
- [ ] Create public playlist
- [ ] Add songs to playlist
- [ ] Reorder playlist songs
- [ ] Share playlist with collaborator
- [ ] Favorite/unfavorite songs
- [ ] View listening history
- [ ] Sign out

## Deployment Notes

### Environment Variables

**Development (.env):**
```env
VITE_SUPABASE_URL=https://dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=dev-anon-key
```

**Production (.env.production):**
```env
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod-anon-key
```

### Supabase Dashboard Settings

1. **Authentication > Settings**
   - Set site URL to production domain
   - Add production redirect URLs
   - Enable email confirmations
   - Configure SMTP (optional)

2. **Database > Backups**
   - Enable daily backups (Pro plan)
   - Set retention policy

3. **API > Rate Limiting**
   - Enable for production
   - Set appropriate limits

## Troubleshooting

### Common Issues

**"Supabase not configured"**
- Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in .env
- Restart dev server after adding env vars

**"Failed to create profile"**
- Run `supabase/schema.sql` in SQL Editor
- Check trigger `on_auth_user_created` exists

**"Row Level Security policy violation"**
- User might not be authenticated
- Check policies in Table Editor
- Ensure `auth.uid()` matches user ID

**OAuth redirect errors**
- Verify redirect URLs match in both:
  - Supabase Dashboard > Authentication > URL Configuration
  - OAuth provider settings (Google/Discord/GitHub)

## Cost Management

### Free Tier Limits
- 50,000 Monthly Active Users
- 500 MB database
- 1 GB file storage
- 2 GB bandwidth

### Monitoring Usage
1. Go to Supabase Dashboard
2. Click **Settings** > **Usage**
3. Monitor:
   - Database size
   - Active users
   - API requests
   - Bandwidth

### Optimization Tips
- Use indexes on frequently queried columns
- Implement pagination for large lists
- Cache public data in frontend
- Use CDN for avatar images
- Archive old listening history

## Support

If you need help:
1. Check [Supabase Docs](https://supabase.com/docs)
2. Visit [Supabase Discord](https://discord.supabase.com)
3. Review this implementation guide
4. Check browser console for errors

## Summary

✅ **Complete Backend**: Database schema, auth, and APIs ready

✅ **React Integration**: Context, hooks, and TypeScript types

✅ **Security**: Row Level Security policies configured

🔄 **Next**: Build UI components for auth and social features

---

**Ready to build amazing social features!** 🚀
