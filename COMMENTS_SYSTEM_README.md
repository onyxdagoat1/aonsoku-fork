# Comment System Documentation

## Overview

This document describes the complete comment system implementation for Aonsoku. The system allows users to leave comments on artists, albums, compilations, and singles, with support for likes and moderation.

## Features

✅ **Comment on Multiple Entity Types**
- Artists
- Albums
- Compilations (automatically detected)
- Singles (automatically detected)

✅ **Interactive Features**
- Add comments
- Like/unlike comments
- Delete your own comments
- Real-time comment counts
- Relative timestamps ("5 minutes ago")

✅ **User Experience**
- Optimistic UI updates for instant feedback
- Responsive design
- Login-required with friendly messaging
- Loading states and error handling
- Confirmation dialogs for destructive actions

## Architecture

### File Structure

```
src/
├── app/
│   ├── components/
│   │   └── comments/
│   │       ├── index.tsx              # Main comment section component
│   │       ├── comment-item.tsx       # Individual comment display
│   │       └── comment-form.tsx       # Comment submission form
│   ├── features/
│   │   └── comments/
│   │       ├── api.ts                 # API functions
│   │       └── types.ts               # TypeScript types
│   ├── hooks/
│   │   ├── use-comments.ts            # React Query hooks
│   │   └── use-auth.ts                # Authentication hook
│   └── pages/
│       ├── artists/artist.tsx         # Artist page with comments
│       └── albums/album.tsx           # Album page with comments
├── i18n/
│   └── locales/
│       └── en.json                    # Translation keys
└── database/
    └── schema.sql                     # Database schema
```

### Database Schema

The comment system uses a SQLite database with two tables:

**comments**
- `id` - Primary key
- `entity_type` - Type of entity (artist/album/compilation/single)
- `entity_id` - ID of the entity
- `user_id` - User who created the comment
- `username` - Username for display
- `content` - Comment text
- `created_at` - Timestamp
- `likes` - Number of likes

**comment_likes**
- `id` - Primary key
- `comment_id` - Foreign key to comments
- `user_id` - User who liked
- `created_at` - Timestamp

### Components

#### Comments (Main Component)
**Location:** `src/app/components/comments/index.tsx`

**Props:**
```typescript
interface CommentsProps {
  entityType: 'artist' | 'album' | 'compilation' | 'single'
  entityId: string
  entityName: string
}
```

**Features:**
- Displays list of comments
- Shows comment form
- Handles loading and error states
- Shows total comment count

#### CommentItem
**Location:** `src/app/components/comments/comment-item.tsx`

**Features:**
- Displays individual comment with avatar
- Like button with optimistic updates
- Delete button (only for comment owner)
- Relative timestamp display
- Confirmation dialog for deletion

#### CommentForm
**Location:** `src/app/components/comments/comment-form.tsx`

**Features:**
- Textarea for comment input
- Character count (max 1000)
- Submit button with loading state
- Login prompt for unauthenticated users
- Client-side validation

### API Layer

**Location:** `src/app/features/comments/api.ts`

**Functions:**
- `getComments(entityType, entityId)` - Fetch comments
- `createComment(data)` - Create new comment
- `deleteComment(commentId)` - Delete comment
- `likeComment(commentId, userId)` - Toggle like

**Note:** These functions currently use mock data. You'll need to implement actual API calls to your Subsonic server.

### React Query Hooks

**Location:** `src/app/hooks/use-comments.ts`

**Hooks:**
- `useComments(entityType, entityId)` - Query comments
- `useCreateComment()` - Mutation to create comment
- `useDeleteComment()` - Mutation to delete comment
- `useLikeComment()` - Mutation to like/unlike comment

All mutations include:
- Optimistic updates
- Cache invalidation
- Error handling
- Success/error toasts

### Authentication

**Location:** `src/app/hooks/use-auth.ts`

**Implementation:**
Uses the existing `app.store.ts` to get logged-in user information:

```typescript
export function useAuth() {
  const { username, isServerConfigured } = useAppData()
  
  if (isServerConfigured && username) {
    return {
      user: {
        id: username,
        username: username,
        email: `${username}@subsonic.local`,
      },
    }
  }
  
  return { user: null }
}
```

## Internationalization

All user-facing text is translatable via i18n. Keys are in `src/i18n/locales/en.json`:

```json
{
  "comments": {
    "title_one": "{{count}} Comment",
    "title_other": "{{count}} Comments",
    "subtitle": "Share your thoughts about {{name}}",
    "empty": "No comments yet. Be the first to share your thoughts!",
    "delete": "Delete",
    "deleteDialog": {
      "title": "Delete Comment?",
      "description": "This action cannot be undone."
    },
    "form": {
      "placeholder": "Write your comment about this {{type}}...",
      "post": "Post Comment",
      "posting": "Posting...",
      "loginRequired": "Please log in to leave a comment",
      "error": {
        "empty": "Comment cannot be empty",
        "tooLong": "Comment is too long (max 1000 characters)",
        "failed": "Failed to post comment"
      }
    }
  },
  "common": {
    "cancel": "Cancel",
    "delete": "Delete",
    "deleting": "Deleting..."
  }
}
```

## Integration with Pages

### Artist Pages

**File:** `src/app/pages/artists/artist.tsx`

```tsx
import Comments from '@/app/components/comments'

// ... in the component return:
<div className="mt-8">
  <Comments
    entityType="artist"
    entityId={artist.id}
    entityName={artist.name}
  />
</div>
```

### Album Pages

**File:** `src/app/pages/albums/album.tsx`

```tsx
import Comments from '@/app/components/comments'

// Detect entity type
const isSingle = album.songCount === 1
const entityType = isSingle 
  ? 'single' 
  : album.compilation 
    ? 'compilation' 
    : 'album'

// ... in the component return:
<div className="mt-8">
  <Comments
    entityType={entityType}
    entityId={album.id}
    entityName={album.name}
  />
</div>
```

## Backend Implementation Guide

The frontend is complete, but you need to implement the backend API endpoints. Here's what you need:

### Required API Endpoints

1. **GET /api/comments**
   - Query params: `entityType`, `entityId`
   - Returns: Array of comments with likes

2. **POST /api/comments**
   - Body: `{ entityType, entityId, content, userId, username }`
   - Returns: Created comment object

3. **DELETE /api/comments/:id**
   - Requires: User authentication
   - Only allows deleting own comments
   - Returns: Success status

4. **POST /api/comments/:id/like**
   - Body: `{ userId }`
   - Toggles like (add if not exists, remove if exists)
   - Returns: Updated comment with new like count

### Database Setup

Run the SQL schema in `database/schema.sql` to create the tables:

```bash
sqlite3 your-database.db < database/schema.sql
```

### API Implementation Example (Node.js/Express)

```javascript
// Get comments
app.get('/api/comments', async (req, res) => {
  const { entityType, entityId } = req.query
  
  const comments = await db.all(`
    SELECT c.*, 
           COUNT(DISTINCT cl.id) as likes,
           CASE WHEN ucl.id IS NOT NULL THEN 1 ELSE 0 END as userHasLiked
    FROM comments c
    LEFT JOIN comment_likes cl ON c.id = cl.comment_id
    LEFT JOIN comment_likes ucl ON c.id = ucl.comment_id AND ucl.user_id = ?
    WHERE c.entity_type = ? AND c.entity_id = ?
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `, [req.user?.id, entityType, entityId])
  
  res.json(comments)
})

// Create comment
app.post('/api/comments', async (req, res) => {
  const { entityType, entityId, content } = req.body
  const { id: userId, username } = req.user
  
  const result = await db.run(`
    INSERT INTO comments (entity_type, entity_id, user_id, username, content, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `, [entityType, entityId, userId, username, content])
  
  const comment = await db.get('SELECT * FROM comments WHERE id = ?', [result.lastID])
  res.json(comment)
})

// Delete comment
app.delete('/api/comments/:id', async (req, res) => {
  const { id } = req.params
  const userId = req.user.id
  
  const comment = await db.get('SELECT * FROM comments WHERE id = ?', [id])
  
  if (!comment || comment.user_id !== userId) {
    return res.status(403).json({ error: 'Unauthorized' })
  }
  
  await db.run('DELETE FROM comments WHERE id = ?', [id])
  await db.run('DELETE FROM comment_likes WHERE comment_id = ?', [id])
  
  res.json({ success: true })
})

// Like/unlike comment
app.post('/api/comments/:id/like', async (req, res) => {
  const { id } = req.params
  const { userId } = req.body
  
  const existing = await db.get(
    'SELECT * FROM comment_likes WHERE comment_id = ? AND user_id = ?',
    [id, userId]
  )
  
  if (existing) {
    await db.run('DELETE FROM comment_likes WHERE id = ?', [existing.id])
  } else {
    await db.run(
      'INSERT INTO comment_likes (comment_id, user_id, created_at) VALUES (?, ?, datetime(\'now\'))',
      [id, userId]
    )
  }
  
  const likes = await db.get('SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ?', [id])
  res.json({ likes: likes.count })
})
```

## Testing

### Manual Testing Checklist

- [ ] Comments load on artist pages
- [ ] Comments load on album pages
- [ ] Comment form submits successfully
- [ ] Comments appear immediately after posting (optimistic update)
- [ ] Like button works and shows count
- [ ] Unlike works when clicking liked comment
- [ ] Delete button only appears for own comments
- [ ] Delete confirmation dialog works
- [ ] Comment deletes successfully
- [ ] Login prompt shows when not authenticated
- [ ] Timestamps display correctly
- [ ] Error messages show for failed operations
- [ ] Character count updates while typing
- [ ] Cannot submit empty comment
- [ ] Cannot submit comment over 1000 characters
- [ ] Translations work in different languages

## Customization

### Styling

The components use Tailwind CSS and shadcn/ui components. To customize:

1. **Colors:** Modify Tailwind classes in component files
2. **Layout:** Adjust spacing classes (`mt-`, `p-`, etc.)
3. **Typography:** Change text size classes (`text-sm`, `text-lg`, etc.)

### Behavior

1. **Comment Length:** Change `MAX_COMMENT_LENGTH` in `comment-form.tsx`
2. **Timestamps:** Modify `dayjs` configuration for different formats
3. **Avatars:** Replace placeholder with actual avatar URLs in `comment-item.tsx`

## Troubleshooting

### Comments Not Loading

1. Check browser console for API errors
2. Verify backend endpoints are implemented
3. Check CORS settings if frontend/backend on different domains
4. Verify database tables exist and have correct schema

### Comments Not Submitting

1. Check user is authenticated (`useAuth` returns user object)
2. Verify API endpoint is reachable
3. Check request payload matches expected format
4. Review backend logs for errors

### Likes Not Working

1. Check user ID is being passed correctly
2. Verify like endpoint returns updated count
3. Check optimistic update logic in `use-comments.ts`
4. Ensure `comment_likes` table has correct foreign keys

## Future Enhancements

- [ ] Reply to comments (nested comments)
- [ ] Edit comments
- [ ] Report inappropriate comments
- [ ] Markdown support for formatting
- [ ] Mentions (@username)
- [ ] Emoji reactions
- [ ] Sort comments (newest/oldest/most liked)
- [ ] Pagination for large comment lists
- [ ] Real-time updates via WebSocket
- [ ] Moderation tools for admins

## Support

For issues or questions:
1. Check this documentation
2. Review the code comments
3. Check browser console for errors
4. Review backend logs
5. Open an issue on GitHub

---

**Last Updated:** December 28, 2025
**Version:** 1.0.0
