import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, formatDistanceToNow } from 'date-fns'
import {
  BarChart2,
  Crown,
  Disc,
  Loader2,
  TrendingUp,
  Trophy,
  User,
  Vote,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getCoverArtUrl } from '@/api/httpClient'
import { AlbumChartEntry } from '@/app/components/charts/AlbumChartEntry'
import { ArtistChartEntry } from '@/app/components/charts/ArtistChartEntry'
import { ChartEntry } from '@/app/components/charts/ChartEntry'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent } from '@/app/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'
import { ROUTES } from '@/routes/routesList'
import { chartsService } from '@/service/charts.service'
import {
  EOTWNominee,
  EOTWWeekWithResults,
  eotwService,
} from '@/service/eotwService'
import { songs } from '@/service/songs'
import { subsonic } from '@/service/subsonic'
import { usePlayerStore } from '@/store/player.store'
import { ISong } from '@/types/responses/song'

type ChartPeriod = 'today' | 'week' | 'month' | 'all_time'

export default function ChartsPage() {
  const [period, setPeriod] = useState<ChartPeriod>('week')
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const playSong = usePlayerStore((state) => state.actions.playSong)
  const setSongList = usePlayerStore((state) => state.actions.setSongList)

  // --- STREAMS CHART ---
  const { data: streamChart, isLoading: isStreamChartLoading } = useQuery({
    queryKey: ['charts', 'streams', period],
    queryFn: () => chartsService.getTopStreamedTracks(period, 50),
  })

  // Fetch Song Details for Streams
  const { data: songDetails, isLoading: isSongsLoading } = useQuery({
    queryKey: ['songs-details', streamChart],
    queryFn: async () => {
      if (!streamChart || streamChart.length === 0) return []
      const results = await Promise.all(
        streamChart.map((entry) =>
          songs.getSong(entry.track_id).catch(() => null),
        ),
      )
      return results
    },
    enabled: !!streamChart && streamChart.length > 0,
    staleTime: 1000 * 60 * 5,
  })

  // --- ARTISTS CHART ---
  const { data: artistChart, isLoading: isArtistChartLoading } = useQuery({
    queryKey: ['charts', 'follows', 'artist'],
    queryFn: () => chartsService.getChart('streams', 'artist', 50),
  })

  // Fetch Artist Details
  const { data: artistDetails, isLoading: isArtistDetailsLoading } = useQuery({
    queryKey: ['artist-details', artistChart],
    queryFn: async () => {
      if (!artistChart || artistChart.length === 0) return []
      const results = await Promise.all(
        artistChart.map((entry) =>
          subsonic.artists.getOne(entry.content_id).catch(() => null),
        ),
      )
      return results
    },
    enabled: !!artistChart && artistChart.length > 0,
    staleTime: 1000 * 60 * 30,
  })

  // --- ALBUMS CHART ---
  const { data: albumChart, isLoading: isAlbumChartLoading } = useQuery({
    queryKey: ['charts', 'streams', 'album'],
    queryFn: () => chartsService.getChart('streams', 'album', 50),
  })

  // Fetch Album Details
  const { data: albumDetails, isLoading: isAlbumDetailsLoading } = useQuery({
    queryKey: ['album-details', albumChart],
    queryFn: async () => {
      if (!albumChart || albumChart.length === 0) return []
      const results = await Promise.all(
        albumChart.map((entry) =>
          subsonic.albums.getOne(entry.content_id).catch(() => null),
        ),
      )
      return results
    },
    enabled: !!albumChart && albumChart.length > 0,
    staleTime: 1000 * 60 * 30,
  })

  const handlePlay = (index: number) => {
    if (!songDetails) return
    const validSongs = songDetails.filter((s): s is ISong => !!s)
    if (validSongs.length === 0) return

    // Play the song at the specific index relative to the valid list
    // If the index from the chart doesn't match the valid songs list (e.g. if one failed to load),
    // we should find the song by ID or just play the valid one at that index.
    // For simplicity, we assume robust fetching, but here we restart the queue from this song.

    if (validSongs[index]) {
      setSongList(validSongs, index)
    }
  }

  // Handle Album Play
  const handleAlbumPlay = async (albumId: string) => {
    try {
      const album = await subsonic.albums.getOne(albumId)
      if (album && album.song) {
        setSongList(album.song, 0)
      }
    } catch (e) {
      console.error('Failed to play album', e)
    }
  }

  // Handle Artist Play
  const handleArtistPlay = async (artist: any) => {
    try {
      // Fetch top songs for artist
      const topSongs = await songs.getTopSongs(artist.name)
      if (topSongs && topSongs.length > 0) {
        setSongList(topSongs, 0)
      }
    } catch (e) {
      console.error('Failed to play artist', e)
    }
  }

  const isStreamsLoading = isStreamChartLoading || isSongsLoading
  const isArtistsLoading = isArtistChartLoading || isArtistDetailsLoading
  const isAlbumsLoading = isAlbumChartLoading || isAlbumDetailsLoading

  // --- EOTW DATA ---
  const { data: currentWeek } = useQuery({
    queryKey: ['eotw', 'current'],
    queryFn: () => eotwService.getCurrentWeek(),
  })

  const { data: nominees } = useQuery({
    queryKey: ['eotw', 'nominees', currentWeek?.id],
    queryFn: () => (currentWeek ? eotwService.getNominees(currentWeek.id) : []),
    enabled: !!currentWeek,
  })

  const { data: userVote } = useQuery({
    queryKey: ['eotw', 'user-vote', currentWeek?.id],
    queryFn: () =>
      currentWeek ? eotwService.getUserVote(currentWeek.id) : null,
    enabled: !!currentWeek && !!user,
  })

  const { data: pastWeeks } = useQuery({
    queryKey: ['eotw', 'past'],
    queryFn: () => eotwService.getPastWeeks(5),
  })

  const voteMutation = useMutation({
    mutationFn: (nomineeId: string) => eotwService.vote(nomineeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eotw'] })
      toast.success('Vote submitted! 🗳️')
    },
    onError: () => toast.error('Failed to vote'),
  })

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 animate-pulse"
        >
          <div className="w-8 h-8 rounded bg-white/10" />
          <div className="w-12 h-12 rounded bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 bg-white/10 rounded" />
            <div className="h-3 w-1/4 bg-white/10 rounded" />
          </div>
        </div>
      ))}
    </div>
  )

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-24 flex flex-col items-center justify-center text-muted-foreground animate-in fade-in zoom-in-95 duration-500 bg-white/5 rounded-3xl border border-white/10">
      <TrendingUp className="w-16 h-16 mb-6 opacity-20" />
      <p className="text-lg font-medium">{message}</p>
    </div>
  )

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-background pb-32">
      {/* Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] bg-purple-900/20 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] bg-blue-900/20 rounded-full blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute inset-0 bg-background/40 backdrop-blur-3xl" />
      </div>

      <div className="relative z-10 w-full px-8 py-8 md:px-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h1 className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/50 mb-4">
              Charts
            </h1>
            <p className="text-lg text-muted-foreground/80 max-w-2xl font-light">
              Global rankings based on community activity. Discover what's
              trending right now.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white/5 backdrop-blur-md rounded-2xl p-1 border border-white/10">
              <Select
                value={period}
                onValueChange={(v) => setPeriod(v as ChartPeriod)}
              >
                <SelectTrigger className="w-[160px] border-none bg-transparent hover:bg-white/5 focus:ring-0 text-white font-medium transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-white/10 text-white">
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="all_time">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Content */}
        <Tabs defaultValue="streams" className="w-full">
          <TabsList className="w-full md:w-auto inline-flex h-12 items-center justify-center rounded-2xl bg-white/5 p-1 text-muted-foreground backdrop-blur-md border border-white/10 mb-8">
            <TabsTrigger
              value="streams"
              className="rounded-xl px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <BarChart2 className="w-4 h-4 mr-2" /> Streams
            </TabsTrigger>
            <TabsTrigger
              value="artists"
              className="rounded-xl px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <User className="w-4 h-4 mr-2" /> Artists
            </TabsTrigger>
            <TabsTrigger
              value="albums"
              className="rounded-xl px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <Disc className="w-4 h-4 mr-2" /> Albums
            </TabsTrigger>
            <TabsTrigger
              value="eotw"
              className="rounded-xl px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <Trophy className="w-4 h-4 mr-2" /> Edit of the Week
            </TabsTrigger>
          </TabsList>

          <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl min-h-[500px]">
            {/* Streams Tab */}
            <TabsContent
              value="streams"
              className="m-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              {isStreamsLoading ? (
                <LoadingSkeleton />
              ) : !streamChart || streamChart.length === 0 ? (
                <EmptyState message="No stream data available." />
              ) : (
                <div className="space-y-2">
                  {streamChart.map((entry, i) => {
                    const song = songDetails?.[i]
                    if (!song) return null
                    return (
                      <div
                        key={entry.track_id}
                        className="hover:scale-[1.01] transition-transform duration-200"
                      >
                        <ChartEntry
                          rank={i + 1}
                          song={song}
                          score={entry.stream_count}
                          onPlay={() => handlePlay(i)}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            {/* Artists Tab */}
            <TabsContent
              value="artists"
              className="m-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              {isArtistsLoading ? (
                <LoadingSkeleton />
              ) : !artistChart || artistChart.length === 0 ? (
                <EmptyState message="No artist data available." />
              ) : (
                <div className="space-y-2">
                  {artistChart.map((entry, i) => {
                    const artist = artistDetails?.[i]
                    if (!artist) return null
                    return (
                      <div
                        key={entry.content_id}
                        className="hover:scale-[1.01] transition-transform duration-200"
                      >
                        <ArtistChartEntry
                          artist={artist}
                          rank={i + 1}
                          score={entry.score}
                          onPlay={() => handleArtistPlay(artist)}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            {/* Albums Tab */}
            <TabsContent
              value="albums"
              className="m-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              {isAlbumsLoading ? (
                <LoadingSkeleton />
              ) : !albumChart || albumChart.length === 0 ? (
                <EmptyState message="No album data available." />
              ) : (
                <div className="space-y-2">
                  {albumChart.map((entry, i) => {
                    const album = albumDetails?.[i]
                    if (!album) return null
                    return (
                      <div
                        key={entry.content_id}
                        className="hover:scale-[1.01] transition-transform duration-200"
                      >
                        <AlbumChartEntry
                          album={album}
                          rank={i + 1}
                          score={entry.score}
                          onPlay={() => handleAlbumPlay(album.id)}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            {/* EOTW Tab */}
            <TabsContent
              value="eotw"
              className="m-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              <div className="space-y-8">
                {/* Current Week Voting */}
                {currentWeek && currentWeek.status === 'voting' && (
                  <div>
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <Vote className="w-6 h-6 text-green-400" />
                        <h2 className="text-2xl font-bold">Vote Now!</h2>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Voting ends{' '}
                        {formatDistanceToNow(
                          new Date(currentWeek.voting_ends_at),
                          {
                            addSuffix: true,
                          },
                        )}
                      </p>
                      {currentWeek.description && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          "{currentWeek.description}"
                        </p>
                      )}
                      {currentWeek.credits && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Curated by {currentWeek.credits}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {nominees?.map((nominee) => (
                        <div
                          key={nominee.id}
                          className={`group p-4 rounded-xl border transition-all ${
                            userVote === nominee.id
                              ? 'bg-primary/10 border-primary shadow-lg shadow-primary/20'
                              : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <Link to={ROUTES.ALBUM.PAGE(nominee.content_id)}>
                              <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0 ring-2 ring-white/10">
                                {nominee.content_cover && (
                                  <img
                                    src={getCoverArtUrl(
                                      nominee.content_cover,
                                      'album',
                                      '200',
                                    )}
                                    alt={nominee.content_name || ''}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                            </Link>
                            <div className="flex-1 min-w-0">
                              <Link
                                to={ROUTES.ALBUM.PAGE(nominee.content_id)}
                                className="font-bold text-lg hover:underline truncate block"
                              >
                                {nominee.content_name || nominee.content_id}
                              </Link>
                              <p className="text-sm text-muted-foreground truncate">
                                {nominee.content_artist}
                              </p>
                              {nominee.description && (
                                <p className="text-xs text-muted-foreground italic mt-1 line-clamp-2">
                                  {nominee.description}
                                </p>
                              )}
                              {nominee.credits && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Edit by {nominee.credits}
                                </p>
                              )}
                              <p className="text-sm text-primary font-semibold mt-2">
                                {nominee.vote_count || 0} votes
                              </p>
                            </div>
                            <Button
                              onClick={() => voteMutation.mutate(nominee.id)}
                              disabled={
                                !user || !!userVote || voteMutation.isPending
                              }
                              variant={
                                userVote === nominee.id ? 'default' : 'outline'
                              }
                              className="flex-shrink-0"
                            >
                              {userVote === nominee.id ? '✓ Voted' : 'Vote'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {!user && (
                      <p className="text-center text-muted-foreground mt-6 text-sm">
                        <Link
                          to={ROUTES.AUTH.LOGIN}
                          className="text-primary underline hover:text-primary/80"
                        >
                          Sign in
                        </Link>{' '}
                        to vote!
                      </p>
                    )}
                  </div>
                )}

                {/* No Active Week */}
                {!currentWeek && (
                  <EmptyState message="No active voting this week. Check back later!" />
                )}

                {/* Past Winners */}
                {pastWeeks && pastWeeks.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <Crown className="w-6 h-6 text-amber-400" />
                      <h2 className="text-2xl font-bold">Past Winners</h2>
                    </div>

                    <div className="space-y-6">
                      {pastWeeks.map((week) => {
                        const { winner, runnerUps = [] } = week
                        if (!winner) return null

                        return (
                          <div
                            key={week.id}
                            className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
                          >
                            <div className="text-center mb-6">
                              <p className="text-sm text-muted-foreground">
                                Week of{' '}
                                {format(
                                  new Date(week.week_start),
                                  'MMMM d, yyyy',
                                )}
                              </p>
                              {week.description && (
                                <p className="text-sm text-muted-foreground italic mt-1">
                                  "{week.description}"
                                </p>
                              )}
                              {week.credits && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Curated by {week.credits}
                                </p>
                              )}
                            </div>

                            {/* Podium */}
                            <div className="flex items-end justify-center gap-4">
                              {/* 2nd Place */}
                              {runnerUps[0] && (
                                <div className="text-center flex-1 max-w-[140px]">
                                  <Link
                                    to={ROUTES.ALBUM.PAGE(
                                      runnerUps[0].content_id,
                                    )}
                                  >
                                    <div className="w-24 h-24 mx-auto rounded-lg overflow-hidden border-2 border-zinc-400 bg-muted">
                                      {runnerUps[0].content_cover && (
                                        <img
                                          src={getCoverArtUrl(
                                            runnerUps[0].content_cover,
                                            'album',
                                            '200',
                                          )}
                                          alt={runnerUps[0].content_name || ''}
                                          className="w-full h-full object-cover"
                                        />
                                      )}
                                    </div>
                                  </Link>
                                  <div className="mt-2 bg-zinc-400 text-white text-xs font-bold py-1 rounded">
                                    2nd
                                  </div>
                                  <p className="text-xs font-medium mt-2 truncate">
                                    {runnerUps[0].content_name}
                                  </p>
                                </div>
                              )}

                              {/* 1st Place (Winner) */}
                              <div className="text-center flex-1 max-w-[180px]">
                                <Link to={ROUTES.ALBUM.PAGE(winner.content_id)}>
                                  <div className="relative">
                                    <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 w-8 h-8 text-amber-400 z-10" />
                                    <div className="w-32 h-32 mx-auto rounded-xl overflow-hidden border-4 border-amber-400 bg-muted shadow-lg shadow-amber-400/20">
                                      {winner.content_cover && (
                                        <img
                                          src={getCoverArtUrl(
                                            winner.content_cover,
                                            'album',
                                            '300',
                                          )}
                                          alt={winner.content_name || ''}
                                          className="w-full h-full object-cover"
                                        />
                                      )}
                                    </div>
                                  </div>
                                </Link>
                                <div className="mt-2 bg-amber-400 text-black text-sm font-bold py-1.5 rounded">
                                  🏆 1st Place
                                </div>
                                <p className="font-bold mt-2 truncate">
                                  {winner.content_name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {winner.content_artist}
                                </p>
                              </div>

                              {/* 3rd Place */}
                              {runnerUps[1] && (
                                <div className="text-center flex-1 max-w-[140px]">
                                  <Link
                                    to={ROUTES.ALBUM.PAGE(
                                      runnerUps[1].content_id,
                                    )}
                                  >
                                    <div className="w-20 h-20 mx-auto rounded-lg overflow-hidden border-2 border-amber-700 bg-muted">
                                      {runnerUps[1].content_cover && (
                                        <img
                                          src={getCoverArtUrl(
                                            runnerUps[1].content_cover,
                                            'album',
                                            '200',
                                          )}
                                          alt={runnerUps[1].content_name || ''}
                                          className="w-full h-full object-cover"
                                        />
                                      )}
                                    </div>
                                  </Link>
                                  <div className="mt-2 bg-amber-700 text-white text-xs font-bold py-1 rounded">
                                    3rd
                                  </div>
                                  <p className="text-xs font-medium mt-2 truncate">
                                    {runnerUps[1].content_name}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
