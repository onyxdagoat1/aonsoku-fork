import { Clock, Eye, MessageSquare, ThumbsUp } from 'lucide-react'
import { Badge } from '@/app/components/ui/badge'
import { Card, CardContent } from '@/app/components/ui/card'
import { YouTubeVideo } from '@/types/youtube'

interface VideoCardProps {
  video: YouTubeVideo
  viewMode?: 'grid' | 'list'
  onClick: () => void
}

export function YouTubeVideoCard({
  video,
  viewMode = 'grid',
  onClick,
}: VideoCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    if (days < 365) return `${Math.floor(days / 30)} months ago`
    return `${Math.floor(days / 365)} years ago`
  }

  const formatNumber = (num: string) => {
    const n = parseInt(num)
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
  }

  if (viewMode === 'list') {
    return (
      <Card
        className="cursor-pointer hover:bg-white/10 transition-colors overflow-hidden border-white/10 bg-black/20 backdrop-blur-sm"
        onClick={onClick}
      >
        <CardContent className="p-3">
          <div className="flex gap-3">
            <div className="relative flex-shrink-0 w-40 h-24">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover rounded"
              />
              <div className="absolute bottom-1 right-1 bg-black/90 text-white px-1.5 py-0.5 rounded text-xs font-semibold">
                {video.duration}
              </div>
              {parseInt(video.viewCount) > 100000 && (
                <Badge className="absolute top-1 left-1 bg-red-600 text-white text-xs py-0 h-5">
                  Trending
                </Badge>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium line-clamp-2 text-sm mb-1 text-white/90">
                {video.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-2">
                {formatDate(video.publishedAt)}
              </p>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {formatNumber(video.viewCount)}
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" />
                  {formatNumber(video.likeCount)}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {formatNumber(video.commentCount)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:scale-[1.02] transition-all duration-300 overflow-hidden group border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10"
      onClick={onClick}
    >
      <div className="relative overflow-hidden">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
        <div className="absolute bottom-1.5 right-1.5 bg-black/90 text-white px-1.5 py-0.5 rounded text-xs font-semibold">
          {video.duration}
        </div>
        {parseInt(video.viewCount) > 100000 && (
          <Badge className="absolute top-1.5 left-1.5 bg-red-600 text-white text-xs">
            Trending
          </Badge>
        )}
      </div>
      <CardContent className="p-3">
        <h3 className="font-medium line-clamp-2 text-sm mb-1 leading-tight text-white/90 group-hover:text-primary transition-colors">
          {video.title}
        </h3>
        <p className="text-xs text-muted-foreground mb-2">
          {formatDate(video.publishedAt)}
        </p>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {formatNumber(video.viewCount)}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" />
            {formatNumber(video.likeCount)}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {formatNumber(video.commentCount)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
