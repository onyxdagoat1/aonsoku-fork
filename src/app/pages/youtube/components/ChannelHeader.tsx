import { Card, CardContent } from '@/app/components/ui/card'
import { YouTubeChannelInfo } from '@/types/youtube'

interface ChannelHeaderProps {
  channel: YouTubeChannelInfo
}

export function YouTubeChannelHeader({ channel }: ChannelHeaderProps) {
  return (
    <Card className="w-full bg-black/40 backdrop-blur-md border-white/5">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <img
            src={channel.thumbnail}
            alt={channel.title}
            className="w-32 h-32 rounded-full object-cover"
          />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2">{channel.title}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground mb-4">
              <span>
                {parseInt(channel.subscriberCount).toLocaleString()} subscribers
              </span>
              <span>•</span>
              <span>
                {parseInt(channel.videoCount).toLocaleString()} videos
              </span>
            </div>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {channel.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
