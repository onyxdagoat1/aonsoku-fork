import {
  AlertCircle,
  Grid3x3,
  Heart,
  List,
  Search,
  Youtube,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Button } from '@/app/components/ui/button'
import { Card, CardContent } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs'
import { YouTubeChannelHeader } from '@/app/pages/youtube/components/ChannelHeader'
import { YouTubeFilters } from '@/app/pages/youtube/components/Filters'
import { YouTubePlaylistCard } from '@/app/pages/youtube/components/PlaylistCard'
import { PlaylistImport } from '@/app/pages/youtube/components/PlaylistImport'
import { YouTubeStats } from '@/app/pages/youtube/components/Stats'
import { YouTubeVideoCard } from '@/app/pages/youtube/components/VideoCard'
import { YouTubeVideoView } from '@/app/pages/youtube/components/VideoView'

import { useAuth } from '@/contexts/AuthContext'
import { youtubeService } from '@/service/youtube'
import { useYouTubeAuthStore } from '@/store/youtubeAuth.store'
import { useYouTubePlayerStore } from '@/store/youtubePlayer.store'
import {
  YouTubeChannelInfo,
  YouTubePlaylist,
  YouTubeVideo,
} from '@/types/youtube'

type SortOption = 'date' | 'views' | 'likes' | 'title' | 'duration' | 'comments'
type FilterOption = 'all' | 'recent' | 'popular' | 'thisMonth' | 'thisYear'
type DurationFilter = 'all' | 'short' | 'medium' | 'long'
type ViewMode = 'grid' | 'list'

export default function YouTubePage() {
  const { isAuthenticated: youtubeAuthenticated } = useYouTubeAuthStore()
  const { user, profile, isConfigured } = useAuth()
  const isSupabaseAuthenticated = isConfigured && user && profile
  const [channelInfo, setChannelInfo] = useState<YouTubeChannelInfo | null>(
    null,
  )
  const [videos, setVideos] = useState<YouTubeVideo[]>([])
  const [playlists, setPlaylists] = useState<YouTubePlaylist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('videos')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('date')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const { activeVideo, playVideo, minimize, closeVideo } =
    useYouTubePlayerStore()

  const loadChannelData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const cached = localStorage.getItem('youtube_cache')
      const cacheTime = localStorage.getItem('youtube_cache_time')
      const now = Date.now()

      if (cached && cacheTime && now - parseInt(cacheTime) < 3600000) {
        const data = JSON.parse(cached)
        setChannelInfo(data.channelInfo)
        setVideos(data.videos)
        setPlaylists(data.playlists)
        setLoading(false)
        return
      }

      const [channelData, videosData, playlistsData] = await Promise.all([
        youtubeService.getChannelInfo(),
        youtubeService.getChannelVideos(50),
        youtubeService.getChannelPlaylists(50),
      ])

      localStorage.setItem(
        'youtube_cache',
        JSON.stringify({
          channelInfo: channelData,
          videos: videosData,
          playlists: playlistsData,
        }),
      )
      localStorage.setItem('youtube_cache_time', now.toString())

      setChannelInfo(channelData)
      setVideos(videosData)
      setPlaylists(playlistsData)
    } catch (err) {
      console.error('Error loading YouTube data:', err)
      setError(
        'Failed to load YouTube data. Please check your API key and try again.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadChannelData()
  }, [loadChannelData])

  const clearCache = useCallback(() => {
    localStorage.removeItem('youtube_cache')
    localStorage.removeItem('youtube_cache_time')
    loadChannelData()
  }, [loadChannelData])

  const parseDuration = useCallback((duration: string): number => {
    const parts = duration.split(':')
    if (parts.length === 2) return parseInt(parts[0]) * 60 + parseInt(parts[1])
    if (parts.length === 3)
      return (
        parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2])
      )
    return 0
  }, [])

  const filteredAndSortedVideos = useMemo(() => {
    let filtered = videos

    if (searchQuery) {
      filtered = filtered.filter(
        (video) =>
          video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          video.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    const now = Date.now()
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000
    const yearAgo = now - 365 * 24 * 60 * 60 * 1000

    if (filterBy === 'recent') {
      filtered = filtered.filter(
        (video) => new Date(video.publishedAt).getTime() > weekAgo,
      )
    } else if (filterBy === 'popular') {
      filtered = filtered.filter((video) => parseInt(video.viewCount) > 10000)
    } else if (filterBy === 'thisMonth') {
      filtered = filtered.filter(
        (video) => new Date(video.publishedAt).getTime() > monthAgo,
      )
    } else if (filterBy === 'thisYear') {
      filtered = filtered.filter(
        (video) => new Date(video.publishedAt).getTime() > yearAgo,
      )
    }

    if (durationFilter !== 'all') {
      filtered = filtered.filter((video) => {
        const seconds = parseDuration(video.duration)
        if (durationFilter === 'short') return seconds < 240 // < 4 min
        if (durationFilter === 'medium') return seconds >= 240 && seconds < 1200 // 4-20 min
        if (durationFilter === 'long') return seconds >= 1200 // > 20 min
        return true
      })
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return (
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
          )
        case 'views':
          return parseInt(b.viewCount) - parseInt(a.viewCount)
        case 'likes':
          return parseInt(b.likeCount) - parseInt(a.likeCount)
        case 'comments':
          return parseInt(b.commentCount) - parseInt(a.commentCount)
        case 'duration':
          return parseDuration(b.duration) - parseDuration(a.duration)
        case 'title':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

    return sorted
  }, [videos, searchQuery, sortBy, filterBy, durationFilter, parseDuration])

  const [currentBackground, setCurrentBackground] = useState<string | null>(
    null,
  )

  // ... (keep existing effects and loadChannelData)

  const handleVideoHover = (thumbnail: string | null) => {
    setCurrentBackground(thumbnail)
  }

  const dynamicBackground = currentBackground || activeVideo?.thumbnail

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-background">
      {/* Dynamic Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-background/30 z-10 transition-colors duration-1000" />

        {dynamicBackground && (
          <div
            key={dynamicBackground}
            className="absolute inset-[-10%] z-0 animate-in fade-in zoom-in-50 duration-1000"
            style={{
              backgroundImage: `url(${dynamicBackground})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(80px) saturate(280%) brightness(1.2) contrast(1.1)',
              transform: 'scale(1.1)',
              opacity: 1,
            }}
          />
        )}

        <div className="absolute inset-0 z-10 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-background to-transparent z-10" />
      </div>

      <div className="relative z-10 h-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-screen gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
            <p className="text-muted-foreground">Loading YouTube content...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-screen gap-6">
            <div className="p-6 bg-destructive/10 rounded-full ring-1 ring-destructive/20">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <div className="text-center max-w-md px-4">
              <h3 className="text-lg font-bold text-white mb-2">
                Failed to load YouTube content
              </h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button
                onClick={clearCache}
                variant="outline"
                className="border-white/10 hover:bg-white/5"
              >
                Retry Connection
              </Button>
            </div>
          </div>
        ) : activeVideo ? (
          <div className="h-screen overflow-hidden">
            <YouTubeVideoView
              video={activeVideo}
              onClose={closeVideo}
              onVideoChange={playVideo}
              onVideoHover={handleVideoHover}
              onMinimize={minimize}
            />
          </div>
        ) : (
          <div className="relative z-10 px-8 py-6 w-full space-y-8">
            {channelInfo && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-700">
                <YouTubeChannelHeader channel={channelInfo} />
              </div>
            )}

            <div className="w-full">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
                <YouTubeStats
                  videos={videos}
                  playlists={playlists}
                  onRefresh={clearCache}
                />
              </div>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <div className="flex items-center justify-between flex-wrap gap-4 bg-white/5 backdrop-blur-md p-2 rounded-xl border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                <TabsList className="bg-transparent">
                  <TabsTrigger
                    value="videos"
                    className="data-[state=active]:bg-white/10 data-[state=active]:text-white"
                  >
                    Videos ({filteredAndSortedVideos.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="playlists"
                    className="data-[state=active]:bg-white/10 data-[state=active]:text-white"
                  >
                    Playlists ({playlists.length})
                  </TabsTrigger>
                </TabsList>

                <div className="flex gap-2">
                  {isSupabaseAuthenticated &&
                    youtubeAuthenticated &&
                    activeTab === 'playlists' && (
                      <PlaylistImport
                        onImportComplete={(ids) =>
                          console.log('Imported:', ids)
                        }
                      />
                    )}
                  <div className="flex bg-black/20 rounded-lg p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={`h-8 w-8 p-0 rounded-md ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white'}`}
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={`h-8 w-8 p-0 rounded-md ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white'}`}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <TabsContent
                value="videos"
                className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300"
              >
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search videos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-12 bg-white/5 border-white/10 rounded-xl focus:bg-white/10 transition-all text-white placeholder:text-white/40"
                    />
                  </div>
                  <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-1">
                    <YouTubeFilters
                      sortBy={sortBy}
                      setSortBy={setSortBy}
                      filterBy={filterBy}
                      setFilterBy={setFilterBy}
                      durationFilter={durationFilter}
                      setDurationFilter={setDurationFilter}
                    />
                  </div>
                </div>

                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6'
                      : 'flex flex-col gap-4'
                  }
                >
                  {filteredAndSortedVideos.map((video) => (
                    <div
                      key={video.id}
                      onMouseEnter={() => handleVideoHover(video.thumbnail)}
                      onMouseLeave={() => handleVideoHover(null)}
                    >
                      <YouTubeVideoCard
                        video={video}
                        viewMode={viewMode}
                        onClick={() => playVideo(video)}
                      />
                    </div>
                  ))}
                </div>

                {filteredAndSortedVideos.length === 0 && (
                  <div className="text-center py-24 bg-white/5 backdrop-blur-md rounded-3xl border border-white/5">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
                      <Search className="w-8 h-8 text-white/20" />
                    </div>
                    <p className="text-muted-foreground font-medium">
                      {searchQuery
                        ? `No videos match "${searchQuery}"`
                        : 'No videos found'}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent
                value="playlists"
                className="mt-0 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {playlists.map((playlist) => (
                    <div
                      key={playlist.id}
                      onMouseEnter={() => handleVideoHover(playlist.thumbnail)}
                      onMouseLeave={() => handleVideoHover(null)}
                    >
                      <YouTubePlaylistCard
                        playlist={playlist}
                        onVideoSelect={playVideo}
                      />
                    </div>
                  ))}
                </div>
                {playlists.length === 0 && (
                  <div className="text-center py-24 bg-white/5 backdrop-blur-md rounded-3xl border border-white/5 text-muted-foreground">
                    No playlists found.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}
