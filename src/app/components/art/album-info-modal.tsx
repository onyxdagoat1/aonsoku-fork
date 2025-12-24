import { IAlbum } from '@/types/responses/album'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Button } from '@/app/components/ui/button'
import { getCoverArtUrl } from '@/api/httpClient'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import { Disc, Disc3, User, Calendar, Download, Music, Hash } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/routes/routesList'
import { useArtworkStore } from '@/store/artwork.store'

interface AlbumInfoModalProps {
  album: IAlbum | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AlbumInfoModal({
  album,
  open,
  onOpenChange,
}: AlbumInfoModalProps) {
  const { success, error } = useToast()
  const { incrementAlbumDownload } = useArtworkStore()

  if (!album) return null

  const isSingle = album.songCount === 1
  const coverUrl = getCoverArtUrl(album.coverArt, 'album', '800')

  const handleDownload = async () => {
    try {
      const response = await fetch(coverUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${album.name} - ${album.artist}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      incrementAlbumDownload(album.id)
      success('Downloaded', `${album.name} cover saved to downloads`)
    } catch (err) {
      error('Download failed', 'Failed to download comp cover')
      console.error(err)
    }
  }

  const createdDate = album.created
    ? new Date(album.created).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{album.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image */}
          <div className="space-y-4">
            <LazyLoadImage
              src={coverUrl}
              alt={`${album.name} by ${album.artist}`}
              className="w-full rounded-lg shadow-lg"
              effect="opacity"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Cover
              </Button>
              <Button
                variant="default"
                className="flex-1"
                asChild
              >
                <Link to={ROUTES.ALBUM.PAGE(album.id)}>
                  <Music className="w-4 h-4 mr-2" />
                  View Comp
                </Link>
              </Button>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Artist */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>Artist</span>
              </div>
              <p className="text-lg font-semibold">{album.artist}</p>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {isSingle ? (
                  <Disc className="w-4 h-4" />
                ) : (
                  <Disc3 className="w-4 h-4" />
                )}
                <span>Type</span>
              </div>
              <p className="text-lg">{isSingle ? 'Single' : 'Comp'}</p>
            </div>

            {/* Song Count */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hash className="w-4 h-4" />
                <span>Tracks</span>
              </div>
              <p className="text-lg font-medium">
                {album.songCount} {album.songCount === 1 ? 'track' : 'tracks'}
              </p>
            </div>

            {/* Created Date */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Added</span>
              </div>
              <p className="text-sm">{createdDate}</p>
            </div>

            {/* Genre */}
            {album.genre && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Genre
                </h3>
                <p className="text-sm">{album.genre}</p>
              </div>
            )}

            {/* Year */}
            {album.year && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Year
                </h3>
                <p className="text-sm">{album.year}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
