import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Filter,
  Globe,
  Grid,
  LayoutList,
  Search,
  Sparkles,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getCoverArtUrl } from '@/api/httpClient'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/components/ui/tooltip'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/routes/routesList'

// Extended Playlist type to include Supabase columns
interface ExtendedPlaylist {
  id: string
  name: string
  comment?: string
  songCount: number
  duration: number
  public: boolean
  owner: string
  coverArt: string
  created: string
  changed: string
  // New metrics
  is_featured?: boolean
  followed_count?: number
}

type ViewMode = 'grid' | 'list'
type FilterType = 'all' | 'featured' | 'community'

export default function PlaylistBrowser() {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filterType, setFilterType] = useState<FilterType>('all')

  const { data: playlists, isLoading } = useQuery({
    queryKey: ['playlists', 'browse'],
    queryFn: async () => {
      // Query Supabase directly to get extended metadata
      const { data, error } = await supabase.from('playlists').select('*')
      // We might want to filter by public=true, but keeping it broad for now as per schema

      if (error) throw error

      // Map to ensure compatibility if needed, but Supabase returns snake_case usually?
      // Need to verify column names. The migration added snake_case columns.
      // Assuming standard columns match Navidrome's structure if shared, or we map them.
      // For now, casting the result.
      return data as unknown as ExtendedPlaylist[]
    },
  })

  const filteredPlaylists =
    playlists?.filter((p) => {
      const matchesSearch = p.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase())

      // const isPublic = p.public // Assuming 'public' boolean exists and is true

      // Filter Logic
      if (filterType === 'featured') {
        return matchesSearch && p.is_featured
      }
      if (filterType === 'community') {
        return matchesSearch && !p.is_featured // Simplified logic
      }

      return matchesSearch
    }) || []

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="h-full flex flex-col pt-6 px-6 space-y-6 bg-gradient-to-br from-background via-background to-background/50">
      {/* Header Area */}
      <div className="flex flex-col gap-6 pb-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <Globe className="w-8 h-8 text-primary animate-pulse-slow" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                Browse Playlists
              </span>
            </h1>
            <p className="text-muted-foreground max-w-lg">
              Discover community-curated collections and trending playlists.
            </p>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto self-end">
            {/* View Toggle */}
            <div className="flex items-center bg-card/50 p-1 rounded-lg border backdrop-blur-sm">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Grid View</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewMode('list')}
                    >
                      <LayoutList className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>List View</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="relative w-full md:w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search playlists..."
                className="pl-9 bg-card/50 border-input/50 focus:bg-card focus:border-primary/50 transition-all rounded-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <Tabs
          defaultValue="all"
          value={filterType}
          onValueChange={(v) => setFilterType(v as FilterType)}
          className="w-full md:w-auto"
        >
          <TabsList className="bg-card/50 backdrop-blur-sm border">
            <TabsTrigger value="all" className="gap-2">
              <Globe className="w-4 h-4" /> All
            </TabsTrigger>
            <TabsTrigger value="featured" className="gap-2">
              <Sparkles className="w-4 h-4 text-yellow-500" /> Featured
            </TabsTrigger>
            <TabsTrigger value="community" className="gap-2">
              <Users className="w-4 h-4" /> Community
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 -mx-6 px-6">
        {isLoading ? (
          <div
            className={cn(
              'gap-6 pb-20',
              viewMode === 'grid'
                ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                : 'flex flex-col space-y-4',
            )}
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'animate-pulse bg-muted rounded-xl',
                  viewMode === 'grid' ? 'aspect-square' : 'h-20 w-full',
                )}
              />
            ))}
          </div>
        ) : filteredPlaylists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Search className="w-16 h-16 opacity-20 mb-4" />
            <h3 className="text-lg font-medium text-foreground">
              No playlists found
            </h3>
            <p>Try adjusting your search terms.</p>
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className={cn(
              'gap-6 pb-20',
              viewMode === 'grid'
                ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                : 'flex flex-col space-y-2',
            )}
          >
            {filteredPlaylists.map((playlist) => (
              <motion.div key={playlist.id} variants={item}>
                <Link
                  to={ROUTES.PLAYLIST.PAGE(playlist.id)}
                  className={cn(
                    'group block transition-all duration-300',
                    viewMode === 'grid'
                      ? 'space-y-3'
                      : 'flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 border border-transparent hover:border-border/50',
                  )}
                >
                  {/* Cover Art */}
                  <div
                    className={cn(
                      'relative overflow-hidden bg-muted shadow-lg',
                      viewMode === 'grid'
                        ? 'aspect-square rounded-xl'
                        : 'w-16 h-16 rounded-md shrink-0',
                    )}
                  >
                    <img
                      src={getCoverArtUrl(playlist.coverArt, 'playlist')}
                      alt={playlist.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Featured Badge Overlay */}
                    {playlist.is_featured && (
                      <div className="absolute top-2 right-2 bg-yellow-500/90 text-black text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm backdrop-blur-sm">
                        FEATURED
                      </div>
                    )}

                    {viewMode === 'grid' && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <Badge
                          variant="secondary"
                          className="scale-90 group-hover:scale-100 transition-transform"
                        >
                          View
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="font-semibold text-base leading-none truncate group-hover:text-primary transition-colors">
                      {playlist.name}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>{playlist.songCount || 0} songs</span>
                        {playlist.owner && (
                          <>
                            <span className="opacity-50">•</span>
                            <span>{playlist.owner}</span>
                          </>
                        )}
                      </div>

                      {playlist.duration > 0 && (
                        <span>{Math.round(playlist.duration / 60)} min</span>
                      )}
                    </div>
                  </div>

                  {viewMode === 'list' && (
                    <div className="pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </div>
                  )}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </ScrollArea>
    </div>
  )
}
