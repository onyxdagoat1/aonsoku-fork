import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useGetAlbum, useGetAlbumInfo } from '@/app/hooks/use-album'
import { AlbumFallback } from '@/app/components/fallbacks/album-fallbacks'
import ImageHeader from '@/app/components/album/image-header'
import AlbumTable from '@/app/components/album/album-table'
import ListWrapper from '@/app/components/list-wrapper'
import ErrorPage from '@/app/pages/error-page'
import { BadgesData } from '@/app/components/header-info'
import Comments from '@/app/components/comments'

export default function Album() {
  const { t } = useTranslation()
  const { albumId } = useParams() as { albumId: string }

  const { data: album, isLoading, isFetched } = useGetAlbum(albumId)
  const { data: albumInfo } = useGetAlbumInfo(albumId)

  if (isLoading) return <AlbumFallback />
  if (isFetched && !album) {
    return <ErrorPage status={404} statusText="Not Found" />
  }
  if (!album) return <AlbumFallback />

  const badges: BadgesData = [
    {
      content: album.artist,
      type: 'artist',
      artistId: album.artistId,
    },
    {
      content: album.year?.toString(),
      type: 'text',
    },
    {
      content: t('playlist.songCount', { count: album.songCount }),
      type: 'text',
    },
    {
      content: album.duration
        ? `${Math.floor(album.duration / 60)} ${t('common.minuteShort')}`
        : null,
      type: 'text',
    },
  ]

  // Detect entity type
  const isSingle = album.songCount === 1
  const entityType = isSingle 
    ? 'single' 
    : album.compilation 
      ? 'compilation' 
      : 'album'

  return (
    <div className="w-full">
      <ImageHeader
        type={t('album.headline')}
        title={album.name}
        coverArtId={album.coverArt}
        coverArtType="album"
        coverArtSize="700"
        coverArtAlt={album.name}
        badges={badges}
      />

      <ListWrapper>
        <AlbumTable album={album} albumInfo={albumInfo} />

        {/* Comments Section */}
        <Comments
          entityType={entityType}
          entityId={album.id}
          entityName={album.name}
        />
      </ListWrapper>
    </div>
  )
}
