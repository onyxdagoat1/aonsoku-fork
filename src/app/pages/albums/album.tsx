import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import ImageHeader from '@/app/components/album/image-header'
import { AlbumInfo } from '@/app/components/album/info'
import { RecordLabelsInfo } from '@/app/components/album/record-labels'
import { AlbumFallback } from '@/app/components/fallbacks/album-fallbacks'
import { PreviewListFallback } from '@/app/components/fallbacks/home-fallbacks'
import { BadgesData } from '@/app/components/header-info'
import PreviewList from '@/app/components/home/preview-list'
import ListWrapper from '@/app/components/list-wrapper'
import { PostsFeed } from '@/app/components/social/PostsFeed'
import { DataTable } from '@/app/components/ui/data-table'
import { YeditorBadge } from '@/app/components/yeditor/YeditorBadge'
import {
  useGetAlbum,
  useGetArtistAlbums,
  useGetGenreAlbums,
} from '@/app/hooks/use-album'
import { useContentTag } from '@/app/hooks/use-content-tags'
import { useGetYeditorForContent } from '@/app/hooks/use-yeditor'
import ErrorPage from '@/app/pages/error-page'
import { songsColumns } from '@/app/tables/songs-columns'
import { getEraColor, getEraLabel } from '@/config/eras'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/routes/routesList'
import { postsService } from '@/service/posts.service'
import { usePlayerActions } from '@/store/player.store'
import { ColumnFilter } from '@/types/columnFilter'
import { Albums } from '@/types/responses/album'
import { sortRecentAlbums } from '@/utils/album'
import { convertSecondsToHumanRead } from '@/utils/convertSecondsToTime'

export default function Album() {
  const { albumId } = useParams() as { albumId: string }
  const { setSongList } = usePlayerActions()
  const { t } = useTranslation()

  const {
    data: album,
    isLoading: albumIsLoading,
    isFetched,
  } = useGetAlbum(albumId)

  const { data: postCount } = useQuery({
    queryKey: ['post-count', 'album', albumId],
    queryFn: () => postsService.getPostCount('album', albumId),
  })

  const { data: tags } = useContentTag(albumId, 'album')

  const { data: artist, isLoading: moreAlbumsIsLoading } = useGetArtistAlbums(
    album?.artistId || '',
  )
  const { data: randomAlbums, isLoading: randomAlbumsIsLoading } =
    useGetGenreAlbums(album?.genre || '')

  const moreAlbums = artist?.album

  const isSingle = album?.songCount === 1
  const entityType = isSingle
    ? 'single'
    : album?.isCompilation
      ? 'compilation'
      : 'album'

  const { data: yeditor } = useGetYeditorForContent(
    albumId,
    entityType as 'album' | 'single' | 'compilation',
  )

  if (albumIsLoading) return <AlbumFallback />
  if (isFetched && !album) {
    return <ErrorPage status={404} statusText="Not Found" />
  }
  if (!album) return <AlbumFallback />

  const columns = songsColumns()

  const albumDuration = album.duration
    ? convertSecondsToHumanRead(album.duration)
    : null

  const albumType = isSingle ? t('album.singleHeadline') : t('album.headline')

  const badges: BadgesData = [
    { content: album.year?.toString() ?? null, type: 'text' },
    {
      content: album.genre ?? null,
      type: 'link',
      link: ROUTES.ALBUMS.GENRE(album.genre),
    },
    {
      content: album.songCount
        ? t('playlist.songCount', { count: album.songCount })
        : null,
      type: 'text',
    },
    {
      content: albumDuration
        ? t('playlist.duration', { duration: albumDuration })
        : null,
      type: 'text',
    },
  ]

  const columnsToShow: ColumnFilter[] = [
    'trackNumber',
    'title',
    'duration',
    'playCount',
    'played',
    'bitRate',
    'contentType',
    'select',
  ]

  function removeCurrentAlbumFromList(moreAlbums: Albums[], sort = false) {
    if (moreAlbums.length === 0 || !album) return null

    let list = moreAlbums.filter((item) => item.id !== album.id)

    if (sort) {
      list = sortRecentAlbums(list)
    }

    if (list.length > 16) list = list.slice(0, 16)

    if (list.length === 0) return null

    return list
  }

  const artistAlbums = moreAlbums
    ? removeCurrentAlbumFromList(moreAlbums, true)
    : null

  const randomGenreAlbums =
    randomAlbums?.list && album.genre
      ? removeCurrentAlbumFromList(randomAlbums.list)
      : null

  const albumComment = album.song.length > 0 ? album.song[0].comment : null

  if (album.era) {
    badges.push({
      content: (
        <span
          className="px-3 py-1 rounded-full text-white text-sm font-semibold shadow-lg"
          style={{
            backgroundColor: getEraColor(album.era),
            boxShadow: `0 0 20px ${getEraColor(album.era)}60`,
          }}
        >
          {getEraLabel(album.era)}
        </span>
      ),
      type: 'component',
    })
  }

  if (tags?.aiTag) {
    badges.push({
      content: (
        <span
          className={cn(
            'px-3 py-1 rounded-full text-white text-xs font-bold shadow-lg uppercase tracking-wider',
            tags.aiTag === 'ai'
              ? 'bg-purple-500/80 border border-purple-400/30'
              : 'bg-green-500/80 border border-green-400/30',
          )}
        >
          {tags.aiTag === 'ai' ? 'AI' : 'HUMAN'}
        </span>
      ),
      type: 'component',
    })
  }

  if (tags?.editType) {
    badges.push({
      content: (
        <span className="px-3 py-1 rounded-full bg-blue-500/80 text-white text-xs font-bold shadow-lg border border-blue-400/30 uppercase tracking-wider">
          {tags.editType}
        </span>
      ),
      type: 'component',
    })
  }

  if (yeditor) {
    badges.push({
      content: <YeditorBadge yeditor={yeditor} />,
      type: 'component',
    })
  }

  return (
    <div className="w-full">
      <ImageHeader
        type={albumType}
        title={album.name}
        subtitle={album.artist}
        artistId={album.artistId}
        artists={album.artists}
        coverArtId={album.coverArt}
        coverArtType="album"
        coverArtSize="700"
        coverArtAlt={album.name}
        badges={badges}
        description={albumComment || undefined}
      />

      <ListWrapper>
        <AlbumInfo album={album} />

        <DataTable
          columns={columns}
          data={album.song}
          handlePlaySong={(row) => setSongList(album.song, row.index)}
          columnFilter={columnsToShow}
          showDiscNumber={true}
          variant="modern"
        />

        {/* Comment removed (moved to header) */}

        <RecordLabelsInfo album={album} />

        <div className="mt-4">
          {moreAlbumsIsLoading && <PreviewListFallback />}
          {artistAlbums && !moreAlbumsIsLoading && album.artistId && (
            <PreviewList
              list={artistAlbums}
              showMore={true}
              title={t('album.more.listTitle')}
              moreTitle={t('album.more.discography')}
              moreRoute={ROUTES.ALBUMS.ARTIST(album.artistId, album.artist)}
            />
          )}

          {randomAlbumsIsLoading && <PreviewListFallback />}
          {!randomAlbumsIsLoading && randomGenreAlbums && (
            <PreviewList
              list={randomGenreAlbums}
              moreRoute={ROUTES.ALBUMS.GENRE(album.genre)}
              title={t('album.more.genreTitle', {
                genre: album.genre,
              })}
            />
          )}
        </div>

        {/* Comments Section */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold text-white/90">
              {t('comments.title', { defaultValue: 'Comments on' })}{' '}
              {album.name}
            </h2>
            {postCount !== undefined && (
              <span className="text-sm font-medium text-muted-foreground bg-white/10 px-2 py-0.5 rounded-full">
                {postCount}
              </span>
            )}
          </div>
          <PostsFeed
            attachmentFilter={{
              type: 'album',
              id: album.id,
              name: album.name,
              artist: album.artist,
              coverArt: album.coverArt,
            }}
          />
        </div>
      </ListWrapper>
    </div>
  )
}
