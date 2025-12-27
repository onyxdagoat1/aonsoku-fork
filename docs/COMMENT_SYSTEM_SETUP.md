# Comment System Setup Guide

A comprehensive comment system for yedits.net with Supabase backend, supporting nested replies, reactions, and moderation features.

## Features

✅ **Nested Comments** - Reply to comments up to 3 levels deep
✅ **Emoji Reactions** - 6 reaction types (like, love, fire, laugh, sad, angry)
✅ **Edit & Delete** - Users can edit/delete their own comments
✅ **Real-time Updates** - Instant updates using React Query
✅ **User Avatars** - Display user profile pictures
✅ **Pinned Comments** - Highlight important comments
✅ **Moderation** - Report and soft-delete functionality
✅ **Optimistic UI** - Fast, responsive interactions
✅ **Character Limit** - 2000 character max per comment
✅ **Keyboard Shortcuts** - Ctrl+Enter to submit

## Database Setup

### Step 1: Run Supabase Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy contents from `supabase/migrations/20251228000000_comments_system.sql`
5. Run the query

This creates:
- `comments` table with threading support
- `comment_reactions` table for emoji reactions
- `comments_with_reactions` view for efficient queries
- Indexes for performance
- Row Level Security (RLS) policies
- Triggers for auto-updating counts

### Step 2: Verify Tables

Check that these tables exist:
```sql
SELECT * FROM public.comments LIMIT 1;
SELECT * FROM public.comment_reactions LIMIT 1;
SELECT * FROM public.comments_with_reactions LIMIT 1;
```

## Application Setup

### Step 1: Configure Supabase

Make sure your `.env` has Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 2: Test Connection

The comment system will automatically work if Supabase is configured. Check the console for:

```
Supabase Configuration: {
  configured: true,
  hasUrl: true,
  hasKey: true
}
```

## Usage

### Basic Implementation

```tsx
import { CommentSection } from '@/app/components/comments/CommentSection';
import { useAuth } from '@/hooks/useAuth'; // Your auth hook

function ArtistPage({ artistId }) {
  const { user } = useAuth();

  return (
    <div>
      {/* Your page content */}
      
      <CommentSection
        contentType="artist"
        contentId={artistId}
        userId={user?.id}
        username={user?.username}
        userAvatar={user?.avatar}
        title="Artist Discussion"
        placeholder="Share your thoughts about this artist..."
      />
    </div>
  );
}
```

### Content Types

The system supports these content types:

- `'artist'` - Artist pages
- `'album'` - Album/compilation pages
- `'song'` - Individual song/single pages
- `'compilation'` - Compilation albums
- `'single'` - Single releases

### Full Example: Album Page

```tsx
import { CommentSection } from '@/app/components/comments/CommentSection';
import { useCommentStats } from '@/hooks/useComments';

function AlbumPage({ album }) {
  const user = useAuthUser();
  const stats = useCommentStats('album', album.id);

  return (
    <div className="space-y-8">
      {/* Album details */}
      <div>
        <h1>{album.name}</h1>
        <p>{album.artist}</p>
      </div>

      {/* Comment stats */}
      {stats.data && (
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{stats.data.total_comments} comments</span>
          <span>{stats.data.total_reactions} reactions</span>
        </div>
      )}

      {/* Comments */}
      <CommentSection
        contentType="album"
        contentId={album.id}
        userId={user?.id}
        username={user?.username}
        userAvatar={user?.avatar}
      />
    </div>
  );
}
```

### Using Individual Components

You can also use components individually:

```tsx
import { CommentThread } from '@/app/components/comments/CommentThread';
import { CommentForm } from '@/app/components/comments/CommentForm';
import { CommentReactions } from '@/app/components/comments/CommentReactions';

// Custom implementation
function CustomCommentView() {
  const { comments, createComment } = useComments({
    contentType: 'song',
    contentId: songId,
    userId: currentUser?.id,
  });

  return (
    <div>
      <CommentForm
        onSubmit={(text) => createComment({
          content_type: 'song',
          content_id: songId,
          text,
          username: currentUser.name,
        })}
        username={currentUser.name}
        userAvatar={currentUser.avatar}
      />

      {comments.map(comment => (
        <CommentThread
          key={comment.id}
          comment={comment}
          contentType="song"
          contentId={songId}
          currentUserId={currentUser?.id}
        />
      ))}
    </div>
  );
}
```

## Hooks Reference

### useComments

Main hook for comment management:

```tsx
const {
  comments,          // Array of comments with reactions
  isLoading,         // Loading state
  error,             // Error state
  refetch,           // Manually refetch comments
  createComment,     // Create new comment
  updateComment,     // Update existing comment
  deleteComment,     // Delete comment
  addReaction,       // Add emoji reaction
  removeReaction,    // Remove emoji reaction
  isCreating,        // Creating comment state
  isUpdating,        // Updating comment state
  isDeleting,        // Deleting comment state
} = useComments({
  contentType: 'artist',
  contentId: 'artist-123',
  userId: 'user-456',
});
```

### useCommentStats

Get comment statistics:

```tsx
const { data: stats } = useCommentStats('album', albumId);

// stats = {
//   total_comments: 42,
//   total_reactions: 156,
//   top_reactions: [
//     { type: 'fire', count: 89 },
//     { type: 'love', count: 45 },
//     { type: 'like', count: 22 },
//   ]
// }
```

## Component Props

### CommentSection

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `contentType` | `ContentType` | Yes | Type of content (artist/album/song/etc) |
| `contentId` | `string` | Yes | Unique ID of the content |
| `userId` | `string` | No | Current user ID (required for commenting) |
| `username` | `string` | No | Current username (required for commenting) |
| `userAvatar` | `string` | No | Current user avatar URL |
| `title` | `string` | No | Section title (default: "Comments") |
| `placeholder` | `string` | No | Input placeholder text |

### CommentThread

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `comment` | `CommentWithReactions` | Yes | Comment data with nested replies |
| `contentType` | `ContentType` | Yes | Content type |
| `contentId` | `string` | Yes | Content ID |
| `currentUserId` | `string` | No | Current user ID |
| `currentUsername` | `string` | No | Current username |
| `currentUserAvatar` | `string` | No | Current user avatar |
| `depth` | `number` | No | Nesting depth (default: 0) |

### CommentForm

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onSubmit` | `(text: string) => void` | Yes | Submit handler |
| `placeholder` | `string` | No | Input placeholder |
| `onCancel` | `() => void` | No | Cancel handler |
| `isSubmitting` | `boolean` | No | Loading state |
| `username` | `string` | No | Username to display |
| `userAvatar` | `string` | No | Avatar URL |
| `initialValue` | `string` | No | Pre-filled text |
| `compact` | `boolean` | No | Compact mode |
| `maxLength` | `number` | No | Max characters (default: 2000) |

## Security & Moderation

### Row Level Security (RLS)

The database has RLS enabled with these policies:

**Comments:**
- ✅ Anyone can read non-deleted comments
- ✅ Authenticated users can create comments
- ✅ Users can update their own comments
- ✅ Users can delete their own comments

**Reactions:**
- ✅ Anyone can view reactions
- ✅ Authenticated users can add reactions
- ✅ Users can remove their own reactions

### Moderation Features

```tsx
// Report a comment
await commentsService.reportComment(commentId);

// Pin/unpin (admin only)
await commentsService.pinComment(commentId, true);

// Soft delete (marks as deleted, keeps in DB)
await commentsService.deleteComment(commentId);
```

### Input Validation

- ✅ Min 1 character, max 2000 characters
- ✅ Text sanitization (handled by Supabase)
- ✅ XSS protection
- ✅ Rate limiting (configure in Supabase dashboard)

## Performance Optimization

### Caching Strategy

Comments are cached with React Query:

```tsx
// Stale time: 30 seconds
queryKey: ['comments', contentType, contentId]

// Stats stale time: 1 minute  
queryKey: ['comment-stats', contentType, contentId]
```

### Optimistic Updates

All mutations use optimistic UI for instant feedback:

```tsx
// Example: Adding a reaction
addReactionMutation.mutate({ commentId, reactionType }, {
  onMutate: async (newReaction) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey });
    
    // Optimistically update UI
    queryClient.setQueryData(queryKey, (old) => {
      // Update comment with new reaction
    });
  },
});
```

### Database Indexes

Performance indexes on:
- `content_type + content_id` (composite)
- `user_id`
- `parent_id`
- `created_at`

## Real-time Updates (Optional)

Enable real-time subscriptions:

```tsx
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

function useRealtimeComments(contentType: string, contentId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['comments', contentType, contentId];

  useEffect(() => {
    const channel = supabase
      .channel(`comments:${contentType}:${contentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `content_type=eq.${contentType} AND content_id=eq.${contentId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contentType, contentId]);
}
```

## Troubleshooting

### Comments Not Showing

1. Check Supabase connection:
```tsx
import { isSupabaseConfigured } from '@/lib/supabase';
console.log('Supabase configured:', isSupabaseConfigured());
```

2. Check RLS policies are enabled
3. Verify user is authenticated
4. Check browser console for errors

### Can't Post Comments

1. Ensure `userId`, `username` are provided
2. Check character limit (2000 max)
3. Verify RLS policy allows inserts
4. Check Supabase API key has correct permissions

### Reactions Not Working

1. Verify user is logged in
2. Check `user_id` is passed to `useComments`
3. Look for duplicate key violations (one reaction per user)

### Performance Issues

1. Enable pagination if >50 comments:
```tsx
const { data, fetchNextPage } = useInfiniteQuery({
  queryKey: ['comments', contentType, contentId],
  queryFn: ({ pageParam = 0 }) => 
    commentsService.getComments(contentType, contentId, userId, pageParam),
});
```

2. Implement virtual scrolling for long threads
3. Lazy load replies (only fetch when expanded)

## Advanced Features

### Sorting Comments

```tsx
// By newest
.order('created_at', { ascending: false })

// By most reactions
.order('total_reactions', { ascending: false })

// Pinned first
.order('pinned', { ascending: false })
.order('created_at', { ascending: false })
```

### Filtering Comments

```tsx
// By user
.eq('user_id', userId)

// By date range
.gte('created_at', startDate)
.lte('created_at', endDate)

// Exclude deleted
.eq('deleted', false)
```

### Comment Search

```tsx
// Full-text search
.textSearch('text', searchQuery)
```

## Migration from Existing System

If you have existing comments:

```sql
-- Example: Import from old comments table
INSERT INTO public.comments (
  content_type,
  content_id,
  user_id,
  username,
  text,
  created_at
)
SELECT 
  'song' as content_type,
  song_id as content_id,
  author_id as user_id,
  author_name as username,
  comment_text as text,
  posted_at as created_at
FROM old_comments_table;
```

## Production Checklist

- [ ] Supabase migration applied
- [ ] RLS policies enabled
- [ ] API keys secured in environment variables
- [ ] Rate limiting configured
- [ ] Moderation workflow established
- [ ] User authentication integrated
- [ ] Error tracking setup (Sentry, etc.)
- [ ] Analytics tracking (optional)
- [ ] Backup strategy in place
- [ ] SSL/HTTPS enabled

## License

MIT
