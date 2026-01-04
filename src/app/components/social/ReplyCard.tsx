import { formatDistanceToNow } from 'date-fns'
import {
  MessageSquare,
  MoreHorizontal,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from 'lucide-react'
import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar'
import { Button } from '@/app/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/routes/routesList'
import { PostReply, postsService } from '@/service/posts.service'

export interface ReplyNode extends PostReply {
  user_vote?: number
  children?: ReplyNode[]
}

interface ReplyCardProps {
  reply: ReplyNode
  onReplyToReply?: (reply: PostReply) => void
  onDelete?: () => void
  className?: string
  depth?: number
}

export const ReplyCard = memo(
  ({
    reply,
    onReplyToReply,
    onDelete,
    className,
    depth = 0,
  }: ReplyCardProps) => {
    const { user, profile: currentProfile } = useAuth()
    const [upvotes, setUpvotes] = useState(reply.upvotes || 0)
    const [downvotes, setDownvotes] = useState(reply.downvotes || 0)
    const [userVote, setUserVote] = useState(reply.user_vote || 0)
    const [isVoting, setIsVoting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const isOwner = user?.id === reply.user_id
    const isAdmin = currentProfile?.is_admin === true
    const canDelete = isOwner || isAdmin

    // ... (rest of logic same) ...

    const handleVote = async (vote: 1 | -1) => {
      // ... (same implementation)
      if (isVoting || !user) return
      setIsVoting(true)

      try {
        const newVote = userVote === vote ? 0 : vote

        // Optimistic update
        if (vote === 1) {
          if (userVote === 1) {
            setUpvotes((v) => v - 1)
          } else if (userVote === -1) {
            setDownvotes((v) => v - 1)
            setUpvotes((v) => v + 1)
          } else {
            setUpvotes((v) => v + 1)
          }
        } else {
          if (userVote === -1) {
            setDownvotes((v) => v - 1)
          } else if (userVote === 1) {
            setUpvotes((v) => v - 1)
            setDownvotes((v) => v + 1)
          } else {
            setDownvotes((v) => v + 1)
          }
        }
        setUserVote(newVote)

        await postsService.voteReply(reply.id, vote)
      } catch {
        // Revert on error
        setUpvotes(reply.upvotes || 0)
        setDownvotes(reply.downvotes || 0)
        setUserVote(reply.user_vote || 0)
      } finally {
        setIsVoting(false)
      }
    }

    const handleDelete = async () => {
      if (!canDelete || isDeleting) return
      if (!window.confirm('Are you sure you want to delete this reply?')) return

      setIsDeleting(true)
      try {
        await postsService.deleteReply(reply.id)
        toast.success('Reply deleted')
        if (onDelete) onDelete()
      } catch (error) {
        console.error('Failed to delete reply:', error)
        toast.error('Failed to delete reply')
      } finally {
        setIsDeleting(false)
      }
    }

    const profile = reply.profiles

    return (
      <div className={cn('flex flex-col', className)}>
        <div
          className={cn(
            'bg-muted/30 rounded-lg p-3 transition-all relative',
            depth > 0 && 'border-l-2 border-primary/20 bg-muted/20',
          )}
        >
          <div className="flex gap-3">
            {/* Avatar */}
            <Link
              to={profile ? ROUTES.PROFILE.replace(':id?', profile.id) : '#'}
            >
              <Avatar className="w-8 h-8 border border-white/10">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="text-xs">
                  {profile?.display_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Link
                    to={
                      profile ? ROUTES.PROFILE.replace(':id?', profile.id) : '#'
                    }
                    className="font-semibold text-sm hover:underline truncate"
                  >
                    {profile?.display_name || 'Unknown User'}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    •{' '}
                    {formatDistanceToNow(
                      new Date(reply.created_at || Date.now()),
                      {
                        addSuffix: true,
                      },
                    )}
                  </span>
                </div>

                {canDelete && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      >
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Content */}
              <p className="text-foreground/90 text-sm whitespace-pre-wrap mb-2">
                {reply.content}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-muted/50 rounded-full p-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-6 w-6 rounded-full transition-colors',
                      userVote === 1
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                    onClick={() => handleVote(1)}
                    disabled={!user}
                  >
                    <ThumbsUp className="w-3 h-3" />
                  </Button>
                  <span
                    className={cn(
                      'text-xs font-semibold px-1 min-w-[16px] text-center',
                      upvotes - downvotes > 0
                        ? 'text-primary'
                        : upvotes - downvotes < 0
                          ? 'text-destructive'
                          : 'text-muted-foreground',
                    )}
                  >
                    {upvotes - downvotes}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-6 w-6 rounded-full transition-colors',
                      userVote === -1
                        ? 'text-destructive bg-destructive/10'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                    onClick={() => handleVote(-1)}
                    disabled={!user}
                  >
                    <ThumbsDown className="w-3 h-3" />
                  </Button>
                </div>

                {onReplyToReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => onReplyToReply(reply)}
                  >
                    <MessageSquare className="w-3 h-3" />
                    Reply
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {reply.children && reply.children.length > 0 && (
          <div className={cn('space-y-3 mt-2', depth < 3 && 'ml-6')}>
            {reply.children.map((child) => (
              <ReplyCard
                key={child.id}
                reply={child}
                onDelete={onDelete}
                onReplyToReply={onReplyToReply}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    )
  },
)
