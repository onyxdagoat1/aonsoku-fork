import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Send } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Textarea } from '@/app/components/ui/textarea'
import { useAuth } from '@/app/hooks/use-auth'
import { useCreateComment } from '@/app/hooks/use-comments'

const MAX_COMMENT_LENGTH = 1000

export default function CommentForm({
  entityType,
  entityId,
}: {
  entityType: 'artist' | 'album' | 'compilation' | 'single'
  entityId: string
}) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [comment, setComment] = useState('')
  const createComment = useCreateComment()

  const handleSubmit = () => {
    if (!user || !comment.trim()) return

    if (comment.length > MAX_COMMENT_LENGTH) {
      // TODO: Show error toast
      return
    }

    createComment.mutate(
      {
        entityType,
        entityId,
        content: comment.trim(),
        userId: user.id,
        username: user.username,
      },
      {
        onSuccess: () => {
          setComment('')
        },
      },
    )
  }

  if (!user) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        {t('comments.form.loginRequired')}
      </div>
    )
  }

  const remainingChars = MAX_COMMENT_LENGTH - comment.length
  const isOverLimit = remainingChars < 0

  return (
    <div className="space-y-2">
      <Textarea
        placeholder={t('comments.form.placeholder', { type: entityType })}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="min-h-[100px] resize-none"
        disabled={createComment.isPending}
      />

      <div className="flex items-center justify-between">
        <span
          className={`text-xs ${
            isOverLimit ? 'text-destructive' : 'text-muted-foreground'
          }`}
        >
          {remainingChars} characters remaining
        </span>

        <Button
          onClick={handleSubmit}
          disabled={
            !comment.trim() ||
            isOverLimit ||
            createComment.isPending
          }
          size="sm"
        >
          <Send className="h-4 w-4 mr-2" />
          {createComment.isPending
            ? t('comments.form.posting')
            : t('comments.form.post')}
        </Button>
      </div>
    </div>
  )
}
