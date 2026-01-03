import { Loader2, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useComments } from '@/hooks/useComments'
import type { ContentType } from '@/types/comments'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { CommentForm } from './CommentForm'
import { CommentThread } from './CommentThread'

interface CommentSectionProps {
  contentType: ContentType
  contentId: string
  userId?: string
  username?: string
  userAvatar?: string
  title?: string
  placeholder?: string
}

export function CommentSection({
  contentType,
  contentId,
  userId: propUserId,
  username: propUsername,
  userAvatar: propUserAvatar,
  title = 'Comments',
  placeholder = 'Add a comment...',
}: CommentSectionProps) {
  const { user, profile } = useAuth()

  // Use props if provided, otherwise fall back to auth hook
  const userId = propUserId || user?.id || undefined
  const username =
    propUsername ||
    profile?.username ||
    user?.user_metadata?.username ||
    undefined
  const userAvatar =
    propUserAvatar ||
    profile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    undefined

  const [showForm, setShowForm] = useState(false)
  const { comments, isLoading, createComment, isCreating } = useComments({
    contentType,
    contentId,
    userId,
  })

  const handleSubmit = (text: string) => {
    if (!userId || !username) {
      alert('Please log in to comment')
      return
    }

    createComment(
      {
        content_type: contentType,
        content_id: contentId,
        text,
        username,
        userAvatar,
      },
      {
        onSuccess: () => {
          setShowForm(false)
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="text-lg font-semibold">
            {title} {comments.length > 0 && `(${comments.length})`}
          </h3>
        </div>
        {userId && !showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            Add Comment
          </Button>
        )}
      </div>

      {/* Comment form */}
      {showForm && userId && (
        <div>
          <CommentForm
            placeholder={placeholder}
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
            isSubmitting={isCreating}
            username={username || 'Anonymous'}
            userAvatar={userAvatar}
          />
          <Separator className="mt-6" />
        </div>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            No comments yet. Be the first to comment!
          </p>
          {!showForm && userId && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowForm(true)}
            >
              Add Comment
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              contentType={contentType}
              contentId={contentId}
              currentUserId={userId}
              currentUsername={username}
              currentUserAvatar={userAvatar}
            />
          ))}
        </div>
      )}
    </div>
  )
}
