import { Download, Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCoverArtUrl } from '@/api/httpClient'
import { Button } from '@/app/components/ui/button'
import { ROUTES } from '@/routes/routesList'
import { subsonic } from '@/service/subsonic'
import { usePlayerActions } from '@/store/player.store'

interface TrackEmbedProps {
  contentId: string
  contentType: 'track' | 'album' | 'single' | 'compilation'
  trackName?: string
  artistName?: string
  coverArt?: string
  albumId?: string // Optional album ID for tracks
  className?: string
}

export function TrackEmbed({
  contentId,
  contentType,
  trackName,
  artistName,
  coverArt,
  albumId: providedAlbumId,
  className,
}: TrackEmbedProps) {
  const { setSongList } = usePlayerActions()
  const [resolvedAlbumId, setResolvedAlbumId] = useState<string | null>(
    providedAlbumId || null,
  )

  // Resolve album ID for tracks if not provided
  useEffect(() => {
    if (contentType === 'track' && !providedAlbumId) {
      subsonic.songs
        .getSong(contentId)
        .then((song) => {
          if (song?.albumId) {
            setResolvedAlbumId(song.albumId)
          }
        })
        .catch(console.error)
    }
  }, [contentId, contentType, providedAlbumId])

  const handlePlay = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      if (contentType === 'track') {
        // Play single track
        const song = await subsonic.songs.getSong(contentId)
        if (song) {
          setSongList([song], 0)
        }
      } else {
        // Play album/comp
        const album = await subsonic.albums.getOne(contentId)
        if (album?.song) {
          setSongList(album.song, 0)
        }
      }
    } catch (error) {
      console.error('Failed to play:', error)
    }
  }

  // For tracks, link to the album page if we have an album ID
  // For albums, link directly
  const linkTo =
    contentType === 'track'
      ? resolvedAlbumId
        ? ROUTES.ALBUM.PAGE(resolvedAlbumId)
        : '#'
      : ROUTES.ALBUM.PAGE(contentId)

  const handleClick = (e: React.MouseEvent) => {
    // Prevent navigation if we don't have a valid link
    if (linkTo === '#') {
      e.preventDefault()
    }
  }

  return (
    <Link
      to={linkTo}
      onClick={handleClick}
      className={`group flex items-center gap-3 p-3 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-black/40 transition-all ${className}`}
    >
      {/* Cover Art */}
      <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
        {coverArt ? (
          <img
            src={getCoverArtUrl(coverArt, 'album', '100')}
            alt={trackName || 'Track'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center">
            <Play className="w-5 h-5 text-white/50" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate text-foreground">
          {trackName || 'Unknown Track'}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {artistName || 'Unknown Artist'}
        </div>
      </div>

      {/* Play Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 rounded-full bg-primary text-primary-foreground opacity-80 group-hover:opacity-100 transition-opacity shadow-lg"
        onClick={handlePlay}
      >
        <Play className="w-4 h-4 fill-current" />
      </Button>
    </Link>
  )
}

// Image attachment with download
interface ImageAttachmentProps {
  imageUrl: string
  className?: string
}

export function ImageAttachment({ imageUrl, className }: ImageAttachmentProps) {
  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `image-${Date.now()}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  return (
    <div
      className={`relative group rounded-xl overflow-hidden bg-black/20 border border-white/5 ${className}`}
    >
      <img
        src={imageUrl}
        alt="Attached"
        className="w-full max-h-[600px] object-contain rounded-xl mx-auto"
        loading="lazy"
      />
      {/* Download overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
          onClick={handleDownload}
        >
          <Download className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}
