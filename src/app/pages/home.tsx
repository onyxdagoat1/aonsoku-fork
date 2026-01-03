import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { getCoverArtUrl } from '@/api/httpClient'
import {
  HeaderFallback,
  PreviewListFallback,
} from '@/app/components/fallbacks/home-fallbacks'
import { AnnouncementsBanner } from '@/app/components/home/AnnouncementsBanner'
import HomeHeader from '@/app/components/home/carousel/header'
import PreviewList, {
  type PreviewItem,
} from '@/app/components/home/preview-list'
import { PostsFeed } from '@/app/components/social/PostsFeed'
import {
  useGetHighlights,
  useGetMostPlayed,
  useGetRandomAlbums,
  useGetRandomSongs,
  useGetRecentlyAdded,
  useGetRecentlyPlayed,
} from '@/app/hooks/use-home'
import { ROUTES } from '@/routes/routesList'
import { chartsService } from '@/service/charts.service'
import { type Highlight } from '@/service/highlightsService'
import { songs } from '@/service/songs'
import { subsonic } from '@/service/subsonic'
import { usePlayerStore } from '@/store/player.store'

export default function Home() {
  const { t } = useTranslation()
  const [currentCover, setCurrentCover] = useState<string | null>(null)

  const { data: randomSongs, isLoading, isFetching } = useGetRandomSongs()

  const recentlyPlayed = useGetRecentlyPlayed()
  const mostPlayed = useGetMostPlayed()
  const recentlyAdded = useGetRecentlyAdded()
  const randomAlbums = useGetRandomAlbums()

  const { data: eotw } = useGetHighlights('eotw')
  const { data: definitive } = useGetHighlights('definitive')
  const { data: upcoming } = useGetHighlights('upcoming')
  const { data: playlists } = useGetHighlights('playlist')

  // Fetch more data for Charts
  const { data: featured } = useGetHighlights('featured')
  // const { data: allArtists } = useGetArtists() // Unused and caused error

  // Combine all highlights for the top carousel
  const eotwList = eotw || []
  const definitiveList = definitive || []
  const featuredList = featured || []
  const upcomingList = upcoming || []

  // Ranges for dynamic title
  const definitiveStartIndex = eotwList.length
  const featuredStartIndex = definitiveStartIndex + definitiveList.length
  const upcomingStartIndex = featuredStartIndex + featuredList.length

  const combinedHighlights = [
    ...eotwList,
    ...definitiveList,
    ...featuredList,
    ...upcomingList,
  ]

  const [featuredTitle, setFeaturedTitle] = useState('Edit of the Week')

  const handleFeaturedSlideChange = (index: number) => {
    if (index >= upcomingStartIndex) {
      setFeaturedTitle('Upcoming Releases')
    } else if (index >= featuredStartIndex) {
      setFeaturedTitle('Featured')
    } else if (index >= definitiveStartIndex) {
      setFeaturedTitle('Definitive Showcase')
    } else {
      setFeaturedTitle('Edit of the Week')
    }
  }

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

  const featuredSection = {
    title: featuredTitle, // Dynamic Title
    data: mapHighlightsToAlbums(combinedHighlights),
    loader: false,
    route: '',
    display: 'carousel',
  }

  // Define sections for the main list (excluding the ones now in featured)
  const mainSections = [
    {
      title: t('home.recentlyPlayed'),
      data: recentlyPlayed.data,
      loader: recentlyPlayed.isLoading,
      route: ROUTES.ALBUMS.RECENTLY_PLAYED,
    },
    {
      title: t('home.mostPlayed'),
      data: mostPlayed.data,
      loader: mostPlayed.isLoading,
      route: ROUTES.ALBUMS.MOST_PLAYED,
    },
    {
      title: 'Editorial Playlists',
      data: mapHighlightsToAlbums(playlists),
      loader: false,
      route: '',
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

  // --- TOP CHARTS DATA ---
  const { data: streamChart } = useQuery({
    queryKey: ['home-charts', 'streams'],
    queryFn: () => chartsService.getTopStreamedTracks('week', 5),
  })
  const { data: topSongs } = useQuery({
    queryKey: ['home-songs-details', streamChart],
    queryFn: async () => {
      if (!streamChart || streamChart.length === 0) return []
      const results = await Promise.all(
        streamChart.map((entry) =>
          songs.getSong(entry.track_id).catch(() => null),
        ),
      )
      return results.filter(Boolean)
    },
    enabled: !!streamChart && streamChart.length > 0,
  })

  const { data: artistChart } = useQuery({
    queryKey: ['home-charts', 'artists'],
    queryFn: () => chartsService.getChart('streams', 'artist', 5),
  })
  const { data: topArtists } = useQuery({
    queryKey: ['home-artist-details', artistChart],
    queryFn: async () => {
      if (!artistChart || artistChart.length === 0) return []
      const results = await Promise.all(
        artistChart.map((entry) =>
          subsonic.artists.getOne(entry.content_id).catch(() => null),
        ),
      )
      return results.filter(Boolean)
    },
    enabled: !!artistChart && artistChart.length > 0,
  })

  const { data: albumChart } = useQuery({
    queryKey: ['home-charts', 'albums'],
    queryFn: () => chartsService.getChart('streams', 'album', 5),
  })
  const { data: topAlbums } = useQuery({
    queryKey: ['home-album-details', albumChart],
    queryFn: async () => {
      if (!albumChart || albumChart.length === 0) return []
      const results = await Promise.all(
        albumChart.map((entry) =>
          subsonic.albums.getOne(entry.content_id).catch(() => null),
        ),
      )
      return results.filter(Boolean)
    },
    enabled: !!albumChart && albumChart.length > 0,
  })

  // Chart State & Actions
  const [chartTab, setChartTab] = useState<'songs' | 'artists' | 'comps'>(
    'songs',
  )
  const { setSongList, playSong } = usePlayerStore((state) => state.actions)

  const handleChartPlay = (item: any, type: 'song' | 'album') => {
    // Basic play logic, could be improved to fetch full object if needed
    // Here we assume item has structure enough to play or we fetch it
    if (type === 'song') {
      // In a real app we might need to fetch the full song object if 'item' is partial
      // But randomSongs returns full ISong usually.
      setSongList([item], 0)
    } else {
      // For albums, navigate or play context
      window.location.hash = `/album/${item.id}`
    }
  }

  const renderChartContent = () => {
    switch (chartTab) {
      case 'songs':
        return topSongs?.slice(0, 5).map((song, i) => (
          <div
            key={song?.id || i}
            onClick={() => song && handleChartPlay(song, 'song')}
            className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors group cursor-pointer border border-transparent hover:border-white/5"
          >
            <span className="text-xl font-bold text-white/20 group-hover:text-primary transition-colors w-6 flex-shrink-0 text-center">
              {i + 1}
            </span>
            <img
              src={getCoverArtUrl(song?.coverArt, 'song', 'thumbnail')}
              alt={song?.title}
              className="w-12 h-12 rounded-md shadow-lg object-cover"
            />
            <div className="overflow-hidden min-w-0 flex-1">
              <p className="font-semibold text-sm truncate text-white/90 group-hover:text-primary transition-colors">
                {song?.title}
              </p>
              <p className="text-xs text-white/50 truncate hover:underline">
                {song?.artist}
              </p>
            </div>
          </div>
        ))
      case 'artists':
        return topArtists?.slice(0, 5).map((artist, i) => (
          <div
            key={artist?.id || i}
            onClick={() =>
              artist && (window.location.hash = `/artist/${artist.id}`)
            }
            className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors group cursor-pointer border border-transparent hover:border-white/5"
          >
            <span className="text-xl font-bold text-white/20 group-hover:text-primary transition-colors w-6 flex-shrink-0 text-center">
              {i + 1}
            </span>
            {artist?.coverArt ? (
              <img
                src={getCoverArtUrl(artist.coverArt, 'artist', 'thumbnail')}
                alt={artist.name}
                className="w-12 h-12 rounded-full shadow-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/50">
                {artist?.name?.substring(0, 2)}
              </div>
            )}
            <div className="overflow-hidden min-w-0 flex-1">
              <p className="font-semibold text-sm truncate text-white/90 group-hover:text-primary transition-colors">
                {artist?.name}
              </p>
              <p className="text-xs text-white/50 truncate">
                {artist?.albumCount} Releases
              </p>
            </div>
          </div>
        ))
      case 'comps':
        return topAlbums?.slice(0, 5).map((album, i) => (
          <div
            key={album?.id || i}
            onClick={() =>
              album && (window.location.hash = `/album/${album.id}`)
            }
            className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors group cursor-pointer border border-transparent hover:border-white/5"
          >
            <span className="text-xl font-bold text-white/20 group-hover:text-primary transition-colors w-6 flex-shrink-0 text-center">
              {i + 1}
            </span>
            <img
              src={getCoverArtUrl(album?.coverArt, 'album', 'thumbnail')}
              alt={album?.name}
              className="w-12 h-12 rounded-md shadow-lg object-cover"
            />
            <div className="overflow-hidden min-w-0 flex-1">
              <p className="font-semibold text-sm truncate text-white/90 group-hover:text-primary transition-colors">
                {album?.name}
              </p>
              <p className="text-xs text-white/50 truncate">{album?.artist}</p>
            </div>
          </div>
        ))
      default:
        return null
    }
  }

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-background">
      {/* Dynamic Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-background/30 z-10 transition-colors duration-1000" />

        {currentCover && (
          <div
            key={currentCover}
            className="absolute inset-[-10%] z-0 animate-in fade-in zoom-in-50 duration-1000"
            style={{
              backgroundImage: `url(${getCoverArtUrl(currentCover, 'song', 'original')})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(90px) saturate(220%) brightness(1.1) contrast(1.1)',
              transform: 'scale(1.1)',
              opacity: 0.7,
            }}
          />
        )}

        <div className="absolute inset-0 z-10 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-background to-transparent z-10" />
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background/70 to-transparent z-10" />
      </div>

      <div className="relative z-10 px-8 py-6 w-full">
        {isFetching || isLoading ? (
          <HeaderFallback />
        ) : (
          <div className="animate-in fade-in slide-in-from-top-4 duration-700">
            <HomeHeader
              songs={randomSongs || []}
              onSlideChange={(index) => {
                if (randomSongs && randomSongs[index]) {
                  setCurrentCover(randomSongs[index].id)
                }
              }}
            />
          </div>
        )}

        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <AnnouncementsBanner />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-12">
          {/* Main Feed */}
          <div className="xl:col-span-2 space-y-12 pb-24">
            {/* Unified Featured Carousel with Dynamic Title */}
            {featuredSection.data?.list &&
              featuredSection.data.list.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-8 fill-mode-both">
                  <PreviewList
                    title={featuredSection.title}
                    moreRoute=""
                    list={featuredSection.data.list}
                    onSlideChange={handleFeaturedSlideChange}
                  />
                </div>
              )}

            {mainSections.map((section, index) => {
              if (section.loader) {
                return <PreviewListFallback key={section.title} />
              }
              if (!section.data || !section.data?.list) return null
              return (
                <div
                  key={section.title}
                  className="animate-in fade-in slide-in-from-bottom-8 fill-mode-both"
                  style={{ animationDelay: `${200 + index * 100}ms` }}
                >
                  <PreviewList
                    title={section.title}
                    moreRoute={section.route}
                    list={section.data.list}
                  />
                </div>
              )
            })}
          </div>

          {/* Right Sidebar: Charts & Community */}
          <div className="xl:col-span-1 hidden xl:block">
            <div className="sticky top-24 space-y-8 animate-in fade-in slide-in-from-right-8 duration-1000 delay-300 h-[calc(100vh-120px)] flex flex-col">
              {/* Charts Widget */}
              <div className="bg-white/5 backdrop-blur-3xl rounded-3xl p-6 border border-white/10 shadow-2xl flex-shrink-0">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    Top Charts
                  </h2>
                  <Link
                    to="/charts"
                    className="text-xs font-semibold text-muted-foreground hover:text-white transition-colors uppercase tracking-wider"
                  >
                    Show All
                  </Link>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 mb-4 p-1 bg-black/20 rounded-xl">
                  <button
                    onClick={() => setChartTab('songs')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${chartTab === 'songs' ? 'bg-white/10 text-white shadow-sm' : 'text-muted-foreground hover:text-white/80'}`}
                  >
                    Songs
                  </button>
                  <button
                    onClick={() => setChartTab('artists')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${chartTab === 'artists' ? 'bg-white/10 text-white shadow-sm' : 'text-muted-foreground hover:text-white/80'}`}
                  >
                    Artists
                  </button>
                  <button
                    onClick={() => setChartTab('comps')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${chartTab === 'comps' ? 'bg-white/10 text-white shadow-sm' : 'text-muted-foreground hover:text-white/80'}`}
                  >
                    Comps
                  </button>
                </div>

                <div className="space-y-1 min-h-[300px]">
                  {renderChartContent()}
                </div>
              </div>

              {/* Community Widget - Fills remaining height */}
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="flex items-center justify-between px-2 mb-4 shrink-0">
                  <h2 className="text-lg font-bold">Community</h2>
                  <div className="flex items-center gap-2">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider">
                      Live
                    </span>
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex-1 relative group">
                  <div className="absolute inset-0 overflow-y-auto scrollbar-hide p-6">
                    <PostsFeed limit={10} showComposer={true} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
