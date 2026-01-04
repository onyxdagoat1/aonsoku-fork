import { formatDistanceToNow } from 'date-fns'
import {
  ChevronDown,
  ChevronUp,
  MessageSquare,
  MoreHorizontal,
  Share2,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from 'lucide-react'
import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { ReportDialog } from '@/app/components/common/ReportDialog'
import { ReplyCard } from '@/app/components/social/ReplyCard'
import { ImageAttachment, TrackEmbed } from '@/app/components/social/TrackEmbed'
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar'
import { Button } from '@/app/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import { Textarea } from '@/app/components/ui/textarea'
import { VerifiedBadge } from '@/app/components/ui/VerifiedBadge'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/routes/routesList'
import { Post, PostReply, postsService } from '@/service/posts.service'

interface PostCardProps {
  post: Post
  onVote?: (post: Post, vote: 1 | -1) => void
  onReply?: (post: Post) => void
  onDelete?: (postId: string) => void
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
  ({ post, onVote, onReply, onDelete, className }: PostCardProps) => {
    const { user, profile: currentProfile } = useAuth()
    const [upvotes, setUpvotes] = useState(post.upvotes || 0)
    const [downvotes, setDownvotes] = useState(post.downvotes || 0)
    const [userVote, setUserVote] = useState(post.user_vote || 0)
    const [isVoting, setIsVoting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [localReplyCount, setLocalReplyCount] = useState(
      post.reply_count || 0,
    )

    // Reply state
    const [replyToId, setReplyToId] = useState<string | null>(null)
    const [replyToUser, setReplyToUser] = useState<string | null>(null)

    // Check if current user can delete this post
    const isOwner = user?.id === post.user_id
    const isAdmin = currentProfile?.is_admin === true
    const canDelete = isOwner || isAdmin

    // Reply expansion state
    const [showReplies, setShowReplies] = useState(false)
    const [replies, setReplies] = useState<ReplyNode[]>([])
    const [isLoadingReplies, setIsLoadingReplies] = useState(false)
    const [replyText, setReplyText] = useState('')
    const [isSubmittingReply, setIsSubmittingReply] = useState(false)

    const loadReplies = async () => {
      if (isLoadingReplies) return
      setIsLoadingReplies(true)
      try {
        const flatReplies = await postsService.getRepliesWithVotes(post.id)

        // Build Tree
        const replyMap = new Map<string, ReplyNode>()
        const roots: ReplyNode[] = []

        // Create nodes
        flatReplies.forEach((r) => {
          replyMap.set(r.id, { ...r, children: [] })
        })

        // Link children
        flatReplies.forEach((r) => {
          if (r.parent_reply_id && replyMap.has(r.parent_reply_id)) {
            replyMap.get(r.parent_reply_id)!.children!.push(replyMap.get(r.id)!)
          } else {
            roots.push(replyMap.get(r.id)!)
          }
        })

        setReplies(roots)
      } catch (error) {
        console.error('Failed to load replies:', error)
      } finally {
        setIsLoadingReplies(false)
      }
    }

    const handleToggleReplies = async () => {
      if (!showReplies && replies.length === 0) {
        await loadReplies()
      }
      setShowReplies(!showReplies)
    }

    const handleReplyToReply = (reply: PostReply) => {
      setReplyToId(reply.id)
      setReplyToUser(reply.profiles?.display_name || 'User')

      // Focus textarea (simple way, or use ref)
      const textarea = document.querySelector(
        `textarea[id="reply-textarea-${post.id}"]`,
      ) as HTMLTextAreaElement
      if (textarea) {
        textarea.focus()
      }
    }

    const cancelReplyTo = () => {
      setReplyToId(null)
      setReplyToUser(null)
    }

    const handleSubmitReply = async () => {
      if (!replyText.trim() || isSubmittingReply || !user) return
      setIsSubmittingReply(true)
      try {
        await postsService.reply(
          post.id,
          replyText.trim(),
          replyToId || undefined,
        )
        setReplyText('')
        setReplyToId(null)
        setReplyToUser(null)
        setLocalReplyCount((prev) => prev + 1)
        await loadReplies()
        toast.success('Reply posted!')
      } catch (error) {
        console.error('Failed to post reply:', error)
        toast.error('Failed to post reply')
      } finally {
        setIsSubmittingReply(false)
      }
    }

    const handleDelete = async () => {
      if (!canDelete || isDeleting) return
      if (!window.confirm('Are you sure you want to delete this post?')) return

      setIsDeleting(true)
      try {
        await postsService.deletePost(post.id)
        toast.success('Post deleted')
        if (onDelete) onDelete(post.id)
      } catch (error) {
        console.error('Failed to delete post:', error)
        toast.error('Failed to delete post')
      } finally {
        setIsDeleting(false)
      }
    }

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
                  {canDelete && (
                    <>
                      <DropdownMenuItem
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {isDeleting ? 'Deleting...' : 'Delete Post'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
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
                onClick={handleToggleReplies}
              >
                <MessageSquare className="w-4 h-4" />
                {localReplyCount}
                {showReplies ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 ml-auto text-muted-foreground hover:text-foreground"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Replies Section */}
            {showReplies && (
              <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                {/* Reply Composer */}
                {user && (
                  <div className="flex flex-col gap-2">
                    {replyToUser && (
                      <div className="flex items-center justify-between text-xs bg-muted/50 px-3 py-1.5 rounded-md border border-white/5">
                        <span className="text-muted-foreground">
                          Replying to{' '}
                          <span className="font-semibold text-primary">
                            @{replyToUser}
                          </span>
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 hover:bg-transparent"
                          onClick={cancelReplyTo}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Textarea
                        id={`reply-textarea-${post.id}`}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        className="min-h-[60px] bg-muted/30 border-white/10 resize-none text-sm"
                      />
                      <Button
                        onClick={handleSubmitReply}
                        disabled={!replyText.trim() || isSubmittingReply}
                        size="sm"
                        className="self-end"
                      >
                        {isSubmittingReply ? '...' : 'Reply'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Loading */}
                {isLoadingReplies && (
                  <div className="text-center text-sm text-muted-foreground py-2">
                    Loading replies...
                  </div>
                )}

                {/* Replies List */}
                {!isLoadingReplies && replies.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-2">
                    No replies yet. Be the first to reply!
                  </div>
                )}

                {replies.map((reply) => (
                  <ReplyCard
                    key={reply.id}
                    reply={reply}
                    onDelete={loadReplies}
                    onReplyToReply={handleReplyToReply}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  },
)
