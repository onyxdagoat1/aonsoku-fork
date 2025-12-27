import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Heart, Trash2, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { Comment } from '@/app/features/comments/types'

interface CommentItemProps {
  comment: Comment
  onDelete: (commentId: number) => Promise<void>
  onLike: (commentId: number) => Promise<void>
}

export default function CommentItem({
  comment,
  onDelete,
  onLike,
}: CommentItemProps) {
  const { t } = useTranslation()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLiking, setIsLiking] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(comment.id)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error('Failed to delete comment:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleLike = async () => {
    setIsLiking(true)
    try {
      await onLike(comment.id)
    } catch (error) {
      console.error('Failed to like comment:', error)
    } finally {
      setIsLiking(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return dateString
    }
  }

  return (
    <>
      <div className="group rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(comment.user_name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{comment.user_name}</span>
                <span className="text-sm text-muted-foreground">
                  {formatDate(comment.created_at)}
                </span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('comments.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <p className="text-sm leading-relaxed text-foreground">
              {comment.content}
            </p>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={isLiking}
                className="h-8 gap-1.5"
              >
                <Heart
                  className={`h-4 w-4 ${
                    comment.user_has_liked
                      ? 'fill-red-500 text-red-500'
                      : ''
                  }`}
                />
                {comment.likes > 0 && (
                  <span className="text-sm">{comment.likes}</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('comments.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('comments.deleteDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t('common.deleting') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
