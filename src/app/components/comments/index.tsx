import { useTranslation } from 'react-i18next'
import { MessageCircle } from 'lucide-react'
import { useComments } from '@/app/hooks/use-comments'
import CommentForm from './comment-form'
import CommentItem from './comment-item'
import { Skeleton } from '@/app/components/ui/skeleton'

export default function Comments({
  entityType,
  entityId,
  entityName,
}: {
  entityType: 'artist' | 'album' | 'compilation' | 'single'
  entityId: string
  entityName: string
}) {
  const { t } = useTranslation()
  const { data: comments, isLoading } = useComments(entityType, entityId)

  const commentCount = comments?.length || 0

  return (
    <div className="mt-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h2 className="text-xl font-semibold">
          {t('comments.title', { count: commentCount })}
        </h2>
      </div>

      <p className="text-sm text-muted-foreground">
        {t('comments.subtitle', { name: entityName })}
      </p>

      {/* Comment Form */}
      <CommentForm entityType={entityType} entityId={entityId} />

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          ))
        ) : comments && comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        ) : (
          // Empty state
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t('comments.empty')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
