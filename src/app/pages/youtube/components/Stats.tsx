import {
  Eye,
  ListVideo,
  MessageSquare,
  RefreshCw,
  ThumbsUp,
  Video,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card'
import { YouTubePlaylist, YouTubeVideo } from '@/types/youtube'

interface StatsProps {
  videos: YouTubeVideo[]
  playlists: YouTubePlaylist[]
  onRefresh: () => void
}

export function YouTubeStats({ videos, playlists, onRefresh }: StatsProps) {
  const [refreshing, setRefreshing] = useState(false)

  const totalViews = videos.reduce((sum, v) => sum + parseInt(v.viewCount), 0)
  const totalLikes = videos.reduce((sum, v) => sum + parseInt(v.likeCount), 0)
  const totalComments = videos.reduce(
    (sum, v) => sum + parseInt(v.commentCount),
    0,
  )
  const avgViews =
    videos.length > 0 ? Math.round(totalViews / videos.length) : 0

  const handleRefresh = async () => {
    setRefreshing(true)
    await onRefresh()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const stats = [
    {
      icon: Video,
      label: 'Total Videos',
      value: videos.length,
      color: 'text-blue-400',
    },
    {
      icon: ListVideo,
      label: 'Playlists',
      value: playlists.length,
      color: 'text-purple-400',
    },
    {
      icon: Eye,
      label: 'Total Views',
      value: formatNumber(totalViews),
      color: 'text-green-400',
    },
    {
      icon: ThumbsUp,
      label: 'Total Likes',
      value: formatNumber(totalLikes),
      color: 'text-red-400',
    },
    {
      icon: MessageSquare,
      label: 'Total Comments',
      value: formatNumber(totalComments),
      color: 'text-orange-400',
    },
    {
      icon: Eye,
      label: 'Avg Views',
      value: formatNumber(avgViews),
      color: 'text-cyan-400',
    },
  ]

  return (
    <Card className="bg-transparent border-none shadow-none text-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
          Channel Statistics
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="hover:bg-white/10 text-muted-foreground hover:text-white"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className="text-center p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300 group"
              >
                <Icon
                  className={`w-6 h-6 mx-auto mb-2 ${stat.color} group-hover:scale-110 transition-transform`}
                />
                <p className="text-2xl font-bold text-white mb-1">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground group-hover:text-white/70 transition-colors">
                  {stat.label}
                </p>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground/50 mt-4 text-center">
          Data cached for 1 hour to save API quota
        </p>
      </CardContent>
    </Card>
  )
}
