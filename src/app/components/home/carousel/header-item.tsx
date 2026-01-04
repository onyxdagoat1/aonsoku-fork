import clsx from 'clsx'
import { Play } from 'lucide-react'
import { isFirefox } from 'react-device-detect'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import { Link } from 'react-router-dom'
import { getCoverArtUrl } from '@/api/httpClient'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { useContentTag } from '@/app/hooks/use-content-tags'
import { getEraColor, getEraLabel } from '@/config/eras'
import { ROUTES } from '@/routes/routesList'
import { subsonic } from '@/service/subsonic'
import { usePlayerActions } from '@/store/player.store'
import { ISong } from '@/types/responses/song'
import { convertSecondsToTime } from '@/utils/convertSecondsToTime'

export function HeaderItem({ song }: { song: ISong }) {
  const { setSongList } = usePlayerActions()
  const { data: tags } = useContentTag(song.id, 'song')

  async function handlePlaySongAlbum(song: ISong) {
    const album = await subsonic.albums.getOne(song.albumId)

    if (album) {
      const songIndex = album.song.findIndex((item) => item.id === song.id)

      setSongList(album.song, songIndex)
    }
  }

  const coverArtUrl = getCoverArtUrl(song.coverArt, 'song', '400')

  return (
    <div
      className={clsx(
        'w-full h-[250px] 2xl:h-[300px] relative',
        isFirefox && 'bg-black/60',
        'group/header',
      )}
    >
      <div
        data-testid="header-bg"
        className="absolute -inset-10 bg-cover bg-center z-0 bg-skeleton"
        style={{
          backgroundImage: `url(${coverArtUrl})`,
          filter: isFirefox ? 'blur(24px)' : undefined,
        }}
      />
      <div
        className={clsx(
          'w-full h-full bg-gradient-to-b from-background/40 to-background/80 absolute z-10',
          !isFirefox && 'backdrop-blur-xl',
        )}
      >
        <div className="flex h-full p-4 2xl:p-6 gap-4">
          <div
            className="h-full aspect-square relative group bg-skeleton rounded-lg overflow-hidden shadow-2xl"
            data-testid="header-image-container"
          >
            <LazyLoadImage
              src={coverArtUrl}
              alt={song.title}
              effect="opacity"
              width="100%"
              height="100%"
              className="aspect-square rounded-lg object-cover bg-center absolute inset-0 z-0"
              data-testid="header-image"
            />
            <div className="w-full h-full flex items-center justify-center rounded-lg bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-colors duration-300 absolute inset-0 z-10">
              <Button
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full w-14 h-14"
                variant="outline"
                onClick={() => handlePlaySongAlbum(song)}
                data-testid="header-play-button"
              >
                <Play className="fill-foreground ml-1" />
              </Button>
            </div>
          </div>
          <div className="flex flex-1 h-full flex-col justify-end pb-2">
            <Link to={ROUTES.ALBUM.PAGE(song.albumId)} className="w-fit">
              <h1
                data-testid="header-title"
                className="w-full scroll-m-20 text-3xl 2xl:text-5xl font-bold tracking-tight mb-1 hover:underline drop-shadow-sm"
              >
                {song.title}
              </h1>
            </Link>
            {!song.artistId ? (
              <h4
                data-testid="header-artist"
                className="scroll-m-20 text-lg 2xl:text-2xl font-medium tracking-tight opacity-90"
              >
                {song.artist}
              </h4>
            ) : (
              <Link to={ROUTES.ARTIST.PAGE(song.artistId)} className="w-fit">
                <h4
                  data-testid="header-artist"
                  className="scroll-m-20 text-lg 2xl:text-2xl font-medium tracking-tight opacity-90 hover:underline hover:text-primary transition-colors"
                >
                  {song.artist}
                </h4>
              </Link>
            )}
            <div className="flex gap-2 mt-3 flex-wrap">
              {song.genre !== undefined && (
                <Link to={ROUTES.ALBUMS.GENRE(song.genre)} className="flex">
                  <Badge
                    variant="neutral"
                    className="border bg-black/60 backdrop-blur-md text-white hover:bg-black/80"
                    data-testid="header-genre"
                  >
                    {song.genre}
                  </Badge>
                </Link>
              )}
              {song.year && (
                <Badge
                  variant="neutral"
                  className="border bg-black/60 backdrop-blur-md text-white hover:bg-black/80"
                  data-testid="header-year"
                >
                  {song.year}
                </Badge>
              )}
              <Badge
                variant="neutral"
                className="border bg-black/60 backdrop-blur-md text-white hover:bg-black/80"
                data-testid="header-duration"
              >
                {convertSecondsToTime(song.duration)}
              </Badge>

              {tags?.aiTag && (
                <Badge
                  variant="outline"
                  className={clsx(
                    'border backdrop-blur-md uppercase tracking-wider font-bold text-[10px]',
                    tags.aiTag === 'ai'
                      ? 'bg-purple-500/80 text-purple-100 border-purple-500/50'
                      : 'bg-green-500/80 text-green-100 border-green-500/50',
                  )}
                >
                  {tags.aiTag === 'ai' ? 'AI' : 'HUMAN'}
                </Badge>
              )}
              {tags?.editType && (
                <Badge
                  variant="outline"
                  className="border bg-blue-500/80 text-blue-100 border-blue-500/50 backdrop-blur-md uppercase tracking-wider font-bold text-[10px]"
                >
                  {tags.editType}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
