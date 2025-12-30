import { useTranslation } from 'react-i18next'
import {
  HeaderFallback,
  PreviewListFallback,
} from '@/app/components/fallbacks/home-fallbacks'
import HomeHeader from '@/app/components/home/carousel/header'
import PreviewList, {
  type PreviewItem,
} from '@/app/components/home/preview-list'
import {
  useGetHighlights,
  useGetMostPlayed,
  useGetRandomAlbums,
  useGetRandomSongs,
  useGetRecentlyAdded,
  useGetRecentlyPlayed,
} from '@/app/hooks/use-home'
import { ROUTES } from '@/routes/routesList'
import { type Highlight } from '@/service/highlightsService'

export default function Home() {
  const { t } = useTranslation()

  const { data: randomSongs, isLoading, isFetching } = useGetRandomSongs()

  const recentlyPlayed = useGetRecentlyPlayed()
  const mostPlayed = useGetMostPlayed()
  const recentlyAdded = useGetRecentlyAdded()
  const randomAlbums = useGetRandomAlbums()

  const { data: eotw } = useGetHighlights('eotw')
  const { data: definitive } = useGetHighlights('definitive')
  const { data: upcoming } = useGetHighlights('upcoming')
  const { data: playlists } = useGetHighlights('playlist')

  const mapHighlightsToAlbums = (highlights: Highlight[] | undefined) => {
    if (!highlights || highlights.length === 0) return null
    return {
      list: highlights.map((h) => ({
        id: h.content_id,
        name: h.title,
        artist: h.subtitle || '',
        coverArt: h.content_id,
        type: h.content_type,
        isCollection: h.content_type === 'collection',
        isSong: h.content_type === 'song',
        countdownDate: h.countdown_date,
      })) as PreviewItem[],
    }
  }

  const sections = [
    {
      title: 'Edit of the Week',
      data: mapHighlightsToAlbums(eotw),
      loader: false,
      route: '',
    },
    {
      title: 'Definitive Edits Showcase',
      data: mapHighlightsToAlbums(definitive),
      loader: false,
      route: '',
    },
    {
      title: t('home.recentlyPlayed'),
      data: recentlyPlayed.data,
      loader: recentlyPlayed.isLoading,
      route: ROUTES.ALBUMS.RECENTLY_PLAYED,
    },
    {
      title: 'Upcoming Releases',
      data: mapHighlightsToAlbums(upcoming),
      loader: false,
      route: '',
    },
    {
      title: 'Editorial Playlists',
      data: mapHighlightsToAlbums(playlists),
      loader: false,
      route: '',
    },
    {
      title: t('home.mostPlayed'),
      data: mostPlayed.data,
      loader: mostPlayed.isLoading,
      route: ROUTES.ALBUMS.MOST_PLAYED,
    },
    {
      title: t('home.recentlyAdded'),
      data: recentlyAdded.data,
      loader: recentlyAdded.isLoading,
      route: ROUTES.ALBUMS.RECENTLY_ADDED,
    },
    {
      title: t('home.explore'),
      data: randomAlbums.data,
      loader: randomAlbums.isLoading,
      route: ROUTES.ALBUMS.RANDOM,
    },
  ]

  return (
    <div className="w-full px-8 py-6">
      {isFetching || isLoading ? (
        <HeaderFallback />
      ) : (
        <HomeHeader songs={randomSongs || []} />
      )}

      {sections.map((section) => {
        if (section.loader) {
          return <PreviewListFallback key={section.title} />
        }

        if (!section.data || !section.data?.list) return null

        return (
          <PreviewList
            key={section.title}
            title={section.title}
            moreRoute={section.route}
            list={section.data.list}
          />
        )
      })}
    </div>
  )
}
