import { AudioLines } from 'lucide-react'
import { memo } from 'react'
import { Link } from 'react-router-dom'
import { getCoverArtUrl } from '@/api/httpClient'
import { ArtistLink } from '@/app/components/song/artist-link'
import { ROUTES } from '@/routes/routesList'

interface AlbumChartEntryProps {
  album: any // typed as any for now, ideally IAlbum
  rank: number
  score: number
  onPlay?: () => void
}

export const AlbumChartEntry = memo(
  ({ album, rank, score, showScore = true, onPlay }: AlbumChartEntryProps) => {
    const isTop3 = rank <= 3

    return (
      <div className="group flex items-center p-3 rounded-xl hover:bg-accent/50 transition-all duration-300 border border-transparent hover:border-border/50 gap-4 relative">
        {/* Clickable Area Overlay for Navigation (excluding play button) */}
        <Link
          to={ROUTES.ALBUM.PAGE(album.id)}
          className="absolute inset-0 z-0"
        />

        {/* Rank */}
        <div
          className={`w-8 flex-shrink-0 text-center font-bold text-lg ${isTop3 ? 'text-primary scale-110' : 'text-muted-foreground'} z-10`}
        >
          {rank}
        </div>

        {/* Cover Art */}
        <div className="relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden shadow-sm group-hover:shadow-md transition-all z-10">
          <img
            src={getCoverArtUrl(album.coverArt, 'album')}
            alt={album.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {onPlay && (
            <div
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onPlay()
              }}
            >
              <div className="bg-white/90 rounded-full p-1.5 shadow-sm text-black">
                <svg
                  className="w-3 h-3 fill-current translate-x-0.5"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center z-10 pointer-events-none">
          <div className="font-medium truncate text-foreground group-hover:text-primary transition-colors pointer-events-auto">
            {album.title}
          </div>
          <div className="text-sm text-muted-foreground truncate flex items-center gap-1 pointer-events-auto">
            <ArtistLink
              artistId={album.artistId}
              className="hover:text-foreground transition-colors"
            >
              {album.artist}
            </ArtistLink>
            {album.year && (
              <>
                <span className="text-xs opacity-50">•</span>
                <span className="text-xs">{album.year}</span>
              </>
            )}
          </div>
        </div>

        {/* Score */}
        {showScore && (
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground bg-accent/30 px-3 py-1 rounded-full z-10">
            <AudioLines className="w-3 h-3 text-primary" />
            <span className="font-mono">{score.toLocaleString()}</span>
          </div>
        )}
      </div>
    )
  },
)

AlbumChartEntry.displayName = 'AlbumChartEntry'
