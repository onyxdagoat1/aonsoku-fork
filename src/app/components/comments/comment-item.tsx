import { useState } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useTranslation } from 'react-i18next'
import { Heart, Trash2, MoreVertical } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog'
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar'
import { useAuth } from '@/app/hooks/use-auth'
import { useDeleteComment, useLikeComment } from '@/app/hooks/use-comments'
import type { Comment } from '@/app/features/comments/types'

dayjs.extend(relativeTime)

export default function CommentItem({ comment }: { comment: Comment }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const deleteComment = useDeleteComment()
  const likeComment = useLikeComment()

  const isOwnComment = user && user.id === comment.userId
  const hasLiked = comment.userHasLiked

  const handleLike = () => {
    if (!user) return
    likeComment.mutate({
      commentId: comment.id,
      userId: user.id,
    })
  }

  const handleDelete = () => {
    deleteComment.mutate(comment.id, {
      onSuccess: () => setShowDeleteDialog(false),
    })
  }

  return (
    <>
      <div className="flex gap-3 py-4">
        {/* Avatar */}
        <Avatar className="h-10 w-10">
          <AvatarFallback>
            {comment.username.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 space-y-1">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{comment.username}</span>
              <span className="text-xs text-muted-foreground">
                {dayjs(comment.createdAt).fromNow()}
              </span>
            </div>

            {/* Actions */}
            {isOwnComment && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('comments.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Comment text */}
          <p className="text-sm">{comment.content}</p>

          {/* Like button */}
          <div className="pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 px-2"
              onClick={handleLike}
              disabled={!user || likeComment.isPending}
            >
              <Heart
                className={`h-4 w-4 ${
                  hasLiked ? 'fill-red-500 text-red-500' : ''
                }`}
              />
              {comment.likes > 0 && (
                <span className="text-xs">{comment.likes}</span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('comments.deleteDialog.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('comments.deleteDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteComment.isPending}
            >
              {deleteComment.isPending
                ? t('common.deleting')
                : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
