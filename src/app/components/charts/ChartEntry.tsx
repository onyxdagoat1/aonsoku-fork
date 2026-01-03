import { PlayIcon, TrendingUp } from 'lucide-react'
import { memo } from 'react'
import { Link } from 'react-router-dom'
import { getCoverArtUrl } from '@/api/httpClient'
import { ArtistLink } from '@/app/components/song/artist-link'
import PlaySongButton from '@/app/components/table/play-button'
import { SongTableActions } from '@/app/components/table/song-actions'
import { Badge } from '@/app/components/ui/badge'
import { ROUTES } from '@/routes/routesList'
import { ISong } from '@/types/responses/song'
import { convertSecondsToTime } from '@/utils/convertSecondsToTime'

interface ChartEntryProps {
  song: ISong
  rank: number
  score: number // stream count or points
  onPlay: () => void
  showScore?: boolean
}

export const ChartEntry = memo(
  ({ song, rank, score, onPlay, showScore = true }: ChartEntryProps) => {
    return (
      <div className="group flex items-center p-2 rounded-md hover:bg-accent/50 transition-colors gap-4">
        {/* Rank */}
        <div className="w-8 flex-shrink-0 text-center font-bold text-lg text-muted-foreground">
          {rank}
        </div>

        {/* Cover Art */}
        <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden">
          <img
            src={getCoverArtUrl(song.coverArt, 'song')}
            alt={song.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <PlaySongButton
              trackId={song.id}
              trackNumber={rank} // Abuse trackNumber for rank or just 1
              handlePlayButton={onPlay}
            />
          </div>
        </div>

        {/* Title & Artist */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <Link
            to={ROUTES.ALBUM.PAGE(song.albumId)}
            className="font-medium truncate hover:underline text-foreground"
          >
            {song.title}
          </Link>
          <div className="text-sm text-muted-foreground truncate flex items-center gap-1">
            {song.explicitStatus && (
              <Badge variant="outline" className="text-[10px] h-4 px-1 mr-1">
                E
              </Badge>
            )}
            <ArtistLink artistId={song.artistId}>{song.artist}</ArtistLink>
          </div>
        </div>

        {/* Score / Stats */}
        {showScore && (
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground w-24 justify-end">
            <TrendingUp className="w-3 h-3" />
            <span>{score.toLocaleString()}</span>
          </div>
        )}

        {/* Duration */}
        <div className="hidden md:block w-12 text-sm text-right text-muted-foreground">
          {convertSecondsToTime(song.duration)}
        </div>

        {/* Actions */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <SongTableActions row={{ original: song } as any} />
        </div>
      </div>
    )
  },
)

ChartEntry.displayName = 'ChartEntry'
