import { useQuery } from '@tanstack/react-query'
import { Calendar, CalendarClock, Disc, Filter, Music } from 'lucide-react'
import { useState } from 'react'
import { ReleaseCard } from '@/app/components/releases/ReleaseCard'
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { releasesService } from '@/service/releases.service'

export default function ReleasesPage() {
  const [filter, setFilter] = useState<'all' | 'album' | 'single' | 'event'>(
    'all',
  )
  const { data: releases, isLoading } = useQuery({
    queryKey: ['upcoming-releases'],
    queryFn: releasesService.getUpcomingReleases,
  })

  const filteredReleases =
    releases?.filter((release) => {
      if (filter === 'all') return true
      return release.release_type === filter
    }) || []

  return (
    <div className="container py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            <CalendarClock className="w-10 h-10 text-primary" />
            Upcoming Releases
          </h1>
          <p className="text-muted-foreground text-lg">
            Count down to the latest drops, edits, and compilations.
          </p>
        </div>

        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as any)}
          className="w-full md:w-auto"
        >
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="album" className="gap-2">
              <Disc className="w-4 h-4" /> Albums
            </TabsTrigger>
            <TabsTrigger value="single" className="gap-2">
              <Music className="w-4 h-4" /> Singles
            </TabsTrigger>
            <TabsTrigger value="event" className="gap-2">
              <Calendar className="w-4 h-4" /> Events
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 rounded-xl bg-muted/50 animate-pulse"
            />
          ))}
        </div>
      ) : !filteredReleases || filteredReleases.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-muted-foreground/20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
            <Filter className="w-10 h-10 text-muted-foreground opacity-50" />
          </div>
          <h2 className="text-2xl font-bold mb-3">No releases found</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {filter === 'all'
              ? 'Check back later for new scheduled content.'
              : `No upcoming ${filter}s found. Try switching filters or check back later.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReleases.map((release) => (
            <ReleaseCard key={release.id} release={release} />
          ))}
        </div>
      )}
    </div>
  )
}
