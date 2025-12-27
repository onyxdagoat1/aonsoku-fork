import { useTranslation } from 'react-i18next'
import { useComments } from '@/app/hooks/use-comments'
import CommentForm from './comment-form'
import CommentItem from './comment-item'
import { Skeleton } from '@/components/ui/skeleton'

interface CommentsProps {
  entityType: 'artist' | 'album' | 'compilation' | 'single'
  entityId: string
  entityName: string
}

export default function Comments({
  entityType,
  entityId,
  entityName,
}: CommentsProps) {
  const { t } = useTranslation()
  const {
    comments,
    isLoading,
    addComment,
    deleteComment,
    likeComment,
    isAddingComment,
  } = useComments(entityType, entityId)

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">
          {t('comments.title', { count: comments?.length || 0 })}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('comments.subtitle', { name: entityName })}
        </p>
      </div>

      <CommentForm
        onSubmit={addComment}
        isSubmitting={isAddingComment}
        entityType={entityType}
      />

      <div className="space-y-4">
        {isLoading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : comments && comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onDelete={deleteComment}
              onLike={likeComment}
            />
          ))
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              {t('comments.empty')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
