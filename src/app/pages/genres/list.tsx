import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ShadowHeader } from '@/app/components/album/shadow-header'
import { EmptyWrapper } from '@/app/components/albums/empty-wrapper'
import { HeaderTitle } from '@/app/components/header-title'
import ListWrapper from '@/app/components/list-wrapper'
import { Skeleton } from '@/app/components/ui/skeleton'
import { ROUTES } from '@/routes/routesList'
import { subsonic } from '@/service/subsonic'
import { queryKeys } from '@/utils/queryKeys'

interface Genre {
  value: string
  albumCount: number
  songCount: number
}

const GenreItem = memo(({ genre }: { genre: Genre }) => {
  return (
    <Link
      to={ROUTES.ALBUMS.GENRE(genre.value)}
      className="group relative flex aspect-square w-full select-none flex-col justify-end overflow-hidden rounded-md bg-muted p-4 hover:bg-accent transition-all"
    >
      <div className="z-10 flex flex-col items-start gap-1">
        <h3 className="font-bold text-xl group-hover:text-accent-foreground text-foreground">
          {genre.value}
        </h3>
        <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/70">
          {genre.albumCount} albums • {genre.songCount} songs
        </span>
      </div>
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-background/80 to-transparent" />
    </Link>
  )
})

export default function GenreExplorer() {
  const { t } = useTranslation()

  const { data: genres, isLoading } = useQuery({
    queryKey: [queryKeys.genres.all],
    queryFn: subsonic.genres.get,
  })

  if (isLoading) {
    return (
      <div className="w-full h-full p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 15 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-md" />
        ))}
      </div>
    )
  }

  const showList = genres && genres.length > 0

  return (
    <div className={clsx('w-full', showList ? 'h-full' : 'h-content')}>
      <ShadowHeader>
        <div className="w-full flex items-center justify-between">
          <HeaderTitle
            title={t('sidebar.genres') || 'Genres'}
            count={genres?.length ?? 0}
          />
        </div>
      </ShadowHeader>

      {showList ? (
        <ListWrapper className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-20">
          {genres.map((genre: Genre) => (
            <GenreItem key={genre.value} genre={genre} />
          ))}
        </ListWrapper>
      ) : (
        <ListWrapper>
          <EmptyWrapper>
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
              <span>No genres found.</span>
            </div>
          </EmptyWrapper>
        </ListWrapper>
      )}
    </div>
  )
}
