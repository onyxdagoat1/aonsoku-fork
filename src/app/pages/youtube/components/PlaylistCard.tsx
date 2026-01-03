import { List } from 'lucide-react'
import { useState } from 'react'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { YouTubePlaylist, YouTubeVideo } from '@/types/youtube'
import { YouTubePlaylistViewer } from './PlaylistViewer'

interface PlaylistCardProps {
  playlist: YouTubePlaylist
  onVideoSelect?: (video: YouTubeVideo) => void
}

export function YouTubePlaylistCard({
  playlist,
  onVideoSelect,
}: PlaylistCardProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleVideoSelect = (video: YouTubeVideo) => {
    setIsOpen(false)
    onVideoSelect?.(video)
  }

  return (
    <>
      <Card
        className="cursor-pointer hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:scale-[1.02] transition-all duration-300 border-white/10 bg-white/5 backdrop-blur-sm group hover:bg-white/10 overflow-hidden"
        onClick={() => setIsOpen(true)}
      >
        <div className="relative overflow-hidden">
          <img
            src={playlist.thumbnail}
            alt={playlist.title}
            className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs flex items-center gap-1 z-10">
            <List className="w-3 h-3" />
            {playlist.itemCount} videos
          </div>
        </div>
        <CardHeader>
          <CardTitle className="line-clamp-2 text-sm text-white/90 group-hover:text-primary transition-colors">
            {playlist.title}
          </CardTitle>
          <CardDescription className="line-clamp-2 text-xs">
            {playlist.description || 'No description'}
          </CardDescription>
        </CardHeader>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{playlist.title}</DialogTitle>
            <DialogDescription>
              {playlist.itemCount} videos in this playlist
            </DialogDescription>
          </DialogHeader>
          <YouTubePlaylistViewer
            playlist={playlist}
            onVideoSelect={handleVideoSelect}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
