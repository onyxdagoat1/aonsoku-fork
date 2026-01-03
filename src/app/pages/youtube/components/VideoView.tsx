import {
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  Hash,
  Loader2,
  MessageSquare,
  Minimize2,
  PanelRightClose,
  PanelRightOpen,
  Share2,
  ThumbsDown,
  ThumbsUp,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent } from '@/app/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/app/components/ui/collapsible'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { youtubeService } from '@/service/youtube'
import { YouTubeComment, YouTubeVideo } from '@/types/youtube'

interface VideoViewProps {
  video: YouTubeVideo
  onClose: () => void
  onVideoChange?: (video: YouTubeVideo) => void
  onVideoHover?: (thumbnail: string | null) => void
  onMinimize?: () => void
}

export function YouTubeVideoView({
  video,
  onClose,
  onVideoChange,
  onVideoHover,
  onMinimize,
}: VideoViewProps) {
  const [comments, setComments] = useState<YouTubeComment[]>([])
  const [relatedVideos, setRelatedVideos] = useState<YouTubeVideo[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isDisliked, setIsDisliked] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadComments()
    loadRelatedVideos()
  }, [video.id])

  const loadComments = async () => {
    setLoadingComments(true)
    try {
      const data = await youtubeService.getVideoComments(video.id, 50)
      setComments(data)
    } catch (err) {
      console.error('Error loading comments:', err)
    } finally {
      setLoadingComments(false)
    }
  }

  const loadRelatedVideos = async () => {
    try {
      const data = await youtubeService.getChannelVideos(6)
      setRelatedVideos(data.filter((v) => v.id !== video.id).slice(0, 6))
    } catch (err) {
      console.error('Error loading related videos:', err)
    }
  }

  const formatNumber = (num: string) => {
    const n = parseInt(num)
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleShare = () => {
    const url = `https://www.youtube.com/watch?v=${video.id}`
    navigator.clipboard.writeText(url)
    toast({
      title: 'Link copied!',
      description: 'Video URL copied to clipboard',
    })
  }

  const handleDownload = async () => {
    setIsDownloading(true)

    try {
      const videoUrl = `https://www.youtube.com/watch?v=${video.id}`

      toast({
        title: 'Starting download...',
        description: 'Contacting download service',
      })

      // Call Cobalt API with proper headers
      const response = await fetch(
        'https://cobalt-backend.canine.tools/api/json',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: videoUrl,
            vQuality: '1080',
          }),
        },
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      console.log('Cobalt response:', data)

      if (data.status === 'redirect' && data.url) {
        // Direct download link
        window.open(data.url, '_blank')

        toast({
          title: 'Download started!',
          description: 'Video download has begun',
        })
      } else if (data.status === 'picker' && data.picker?.length > 0) {
        // Multiple quality options - pick first
        window.open(data.picker[0].url, '_blank')

        toast({
          title: 'Download started!',
          description: 'Video download has begun',
        })
      } else if (data.status === 'stream' && data.url) {
        // Stream URL
        window.open(data.url, '_blank')

        toast({
          title: 'Opening video...',
          description: 'Video stream is loading',
        })
      } else {
        throw new Error(data.text || 'Download service returned an error')
      }
    } catch (err: any) {
      console.error('Download error:', err)
      toast({
        title: 'Download failed',
        description:
          err.message ||
          'Could not download video. Try opening in YouTube instead.',
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const extractTags = (description: string) => {
    const hashtagRegex = /#\w+/g
    const matches = description.match(hashtagRegex) || []
    return matches.slice(0, 5)
  }

  const tags = extractTags(video.description)

  return (
    <div className="flex h-screen bg-transparent">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation Bar */}
        <div className="h-14 border-b px-6 flex items-center justify-between bg-black/40 backdrop-blur-md sticky top-0 z-10 border-white/5">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Back to Videos
            </Button>
            {onMinimize && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMinimize}
                className="gap-2"
              >
                <Minimize2 className="w-4 h-4" />
                Minimize Player
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                window.open(
                  `https://www.youtube.com/watch?v=${video.id}`,
                  '_blank',
                )
              }
              className="gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open in YouTube
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="gap-2"
            >
              {sidebarOpen ? (
                <>
                  <PanelRightClose className="w-4 h-4" />
                  Hide Comments
                </>
              ) : (
                <>
                  <PanelRightOpen className="w-4 h-4" />
                  Show Comments
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1">
          <div className="w-full px-6 py-6 space-y-6">
            {/* Video Player */}
            <div className="w-full bg-black rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10 aspect-video">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            {/* Video Info Section */}
            <div className="space-y-4">
              {/* Title */}
              <h1 className="text-2xl font-bold leading-tight">
                {video.title}
              </h1>

              {/* Stats and Actions Bar */}
              <div className="flex items-center justify-between gap-4">
                {/* Left: Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    {formatNumber(video.viewCount)} views
                  </span>
                  <span>•</span>
                  <span>{formatDate(video.publishedAt)}</span>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className={cn(
                      isLiked && 'bg-primary text-primary-foreground',
                    )}
                    onClick={() => {
                      setIsLiked(!isLiked)
                      if (isDisliked) setIsDisliked(false)
                    }}
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    {formatNumber(video.likeCount)}
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    className={cn(
                      isDisliked && 'bg-primary text-primary-foreground',
                    )}
                    onClick={() => {
                      setIsDisliked(!isDisliked)
                      if (isLiked) setIsLiked(false)
                    }}
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleShare}
                    className="gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="gap-2"
                  >
                    {isDownloading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {isDownloading ? 'Downloading...' : 'Download'}
                  </Button>
                </div>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      <Hash className="w-3 h-3" />
                      {tag.slice(1)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Description Card */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">Description</h3>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {video.description || 'No description available.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Related Videos */}
            {relatedVideos.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Related Videos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {relatedVideos.map((related) => (
                    <Card
                      key={related.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                      onClick={() => onVideoChange?.(related)}
                      onMouseEnter={() => onVideoHover?.(related.thumbnail)}
                      onMouseLeave={() => onVideoHover?.(null)}
                    >
                      <div className="relative aspect-video">
                        <img
                          src={related.thumbnail}
                          alt={related.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/90 text-white px-2 py-1 rounded text-xs font-semibold">
                          {related.duration}
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <h4 className="font-medium text-sm line-clamp-2 leading-tight mb-2">
                          {related.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {formatNumber(related.viewCount)}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            {formatNumber(related.likeCount)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Padding */}
            <div className="h-6"></div>
          </div>
        </ScrollArea>
      </div>

      {/* Collapsible Comments Sidebar */}
      {sidebarOpen && (
        <div className="w-[400px] border-l border-white/5 flex flex-col bg-black/40 backdrop-blur-xl">
          {/* Comments Header */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-white/5 bg-transparent">
            <div className="flex items-center gap-2 text-white">
              <MessageSquare className="w-5 h-5" />
              <h2 className="font-semibold">Comments</h2>
              <Badge
                variant="outline"
                className="bg-white/10 text-white border-0"
              >
                {formatNumber(video.commentCount)}
              </Badge>
            </div>
          </div>

          {/* Comments List */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              {loadingComments ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No comments available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <CommentThread key={comment.id} comment={comment} />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

function CommentThread({ comment }: { comment: YouTubeComment }) {
  const [isOpen, setIsOpen] = useState(false)
  const hasReplies = comment.replies && comment.replies.length > 0

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'today'
    if (days === 1) return '1 day ago'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    if (days < 365) return `${Math.floor(days / 30)} months ago`
    return `${Math.floor(days / 365)} years ago`
  }

  return (
    <div className="space-y-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
      {/* Main Comment */}
      <div className="flex gap-3 group">
        <Avatar className="w-8 h-8 flex-shrink-0 ring-1 ring-white/10">
          <AvatarImage src={comment.authorProfileImageUrl} />
          <AvatarFallback className="text-xs bg-white/10 text-white">
            {comment.author[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="font-medium text-sm text-white/90">
              {comment.author}
            </span>
            <span className="text-xs text-white/40">
              {formatDate(comment.publishedAt)}
            </span>
          </div>
          <div
            className="text-sm leading-relaxed text-white/80"
            dangerouslySetInnerHTML={{ __html: comment.text }}
          />
          {comment.likeCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-white/40 pt-1">
              <ThumbsUp className="w-3 h-3" />
              {comment.likeCount}
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {hasReplies && (
        <div className="ml-11 border-l border-white/10 pl-3">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 mb-2 py-1">
              {isOpen ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              <span className="font-medium">
                {comment.replies!.length}{' '}
                {comment.replies!.length === 1 ? 'reply' : 'replies'}
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-1">
              {comment.replies!.map((reply) => (
                <div key={reply.id} className="flex gap-3">
                  <Avatar className="w-6 h-6 flex-shrink-0 ring-1 ring-white/10">
                    <AvatarImage src={reply.authorProfileImageUrl} />
                    <AvatarFallback className="text-[10px] bg-white/10 text-white">
                      {reply.author[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium text-xs text-white/90">
                        {reply.author}
                      </span>
                      <span className="text-[10px] text-white/40">
                        {formatDate(reply.publishedAt)}
                      </span>
                    </div>
                    <div
                      className="text-xs leading-relaxed text-white/70"
                      dangerouslySetInnerHTML={{ __html: reply.text }}
                    />
                    {reply.likeCount > 0 && (
                      <div className="flex items-center gap-1.5 text-[10px] text-white/40 pt-0.5">
                        <ThumbsUp className="w-2.5 h-2.5" />
                        {reply.likeCount}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </div>
  )
}
