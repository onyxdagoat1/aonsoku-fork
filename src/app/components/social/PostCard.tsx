import { formatDistanceToNow } from 'date-fns'
import {
  MessageSquare,
  MoreHorizontal,
  Share2,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react'
import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ReportDialog } from '@/app/components/common/ReportDialog'
import { ImageAttachment, TrackEmbed } from '@/app/components/social/TrackEmbed'
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar'
import { Button } from '@/app/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import { VerifiedBadge } from '@/app/components/ui/VerifiedBadge'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/routes/routesList'
import { Post, postsService } from '@/service/posts.service'

interface PostCardProps {
  post: Post
  onVote?: (post: Post, vote: 1 | -1) => void
  onReply?: (post: Post) => void
  className?: string
}

// Badge component for verified/admin users
function UserBadge({ profile }: { profile?: Post['profiles'] }) {
  if (!profile) return null

  if (profile.is_admin) {
    return <VerifiedBadge type="admin" className="w-4 h-4" />
  }

  if (profile.is_yeditor) {
    return <VerifiedBadge type="yeditor" className="w-4 h-4" />
  }

  return null
}

export const PostCard = memo(
  ({ post, onVote, onReply, className }: PostCardProps) => {
    const [upvotes, setUpvotes] = useState(post.upvotes || 0)
    const [downvotes, setDownvotes] = useState(post.downvotes || 0)
    const [userVote, setUserVote] = useState(post.user_vote || 0)
    const [isVoting, setIsVoting] = useState(false)

    const handleVote = async (vote: 1 | -1) => {
      if (isVoting) return
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

        await postsService.vote(post.id, vote)
        if (onVote) onVote(post, vote)
      } catch {
        // Revert on error
        setUpvotes(post.upvotes || 0)
        setDownvotes(post.downvotes || 0)
        setUserVote(post.user_vote || 0)
      } finally {
        setIsVoting(false)
      }
    }

    const profile = post.profiles

    return (
      <div
        className={cn(
          'bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 transition-all hover:bg-card/80',
          className,
        )}
      >
        <div className="flex gap-4">
          {/* Avatar */}
          <Link to={profile ? ROUTES.PROFILE.replace(':id?', profile.id) : '#'}>
            <Avatar className="w-10 h-10 border border-white/10">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback>
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
                  className="font-bold text-base hover:underline truncate"
                >
                  {profile?.display_name || 'Unknown User'}
                </Link>
                <UserBadge profile={profile} />
                <span className="text-xs text-muted-foreground">
                  •{' '}
                  {formatDistanceToNow(
                    new Date(post.created_at || Date.now()),
                    { addSuffix: true },
                  )}
                </span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <ReportDialog
                    contentId={post.id}
                    contentType="post"
                    trigger={
                      <DropdownMenuItem
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <MessageSquare className="w-4 h-4 mr-2 rotate-180" />
                        Report Post
                      </DropdownMenuItem>
                    }
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Content */}
            <p className="text-foreground/90 whitespace-pre-wrap mb-3 leading-relaxed">
              {post.content}
            </p>

            {/* Music/Track Attachment */}
            {post.attached_content_id && post.attached_content_type && (
              <div className="mb-3">
                <TrackEmbed
                  contentId={post.attached_content_id}
                  contentType={post.attached_content_type as 'track' | 'album'}
                  trackName={post.attached_track_name ?? undefined}
                  artistName={post.attached_track_artist ?? undefined}
                  coverArt={post.attached_cover_art ?? undefined}
                />
              </div>
            )}

            {/* Image Attachment */}
            {post.image_url && (
              <div className="mb-3">
                <ImageAttachment imageUrl={post.image_url} />
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1 bg-muted/30 rounded-full p-1 border border-white/5">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-7 w-7 rounded-full transition-colors',
                    userVote === 1
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  onClick={() => handleVote(1)}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </Button>
                <span
                  className={cn(
                    'text-sm font-semibold px-1 min-w-[20px] text-center',
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
                    'h-7 w-7 rounded-full transition-colors',
                    userVote === -1
                      ? 'text-destructive bg-destructive/10'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  onClick={() => handleVote(-1)}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => onReply && onReply(post)}
              >
                <MessageSquare className="w-4 h-4" />
                {post.reply_count || 0}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 ml-auto text-muted-foreground hover:text-foreground"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  },
)
