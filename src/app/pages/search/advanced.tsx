import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Loader2, Palette, Play, Search, Users, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getCoverArtUrl } from '@/api/httpClient'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { Slider } from '@/app/components/ui/slider'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs'
import { ERAS, getEraColor, getEraLabel } from '@/config/eras'
import { cn } from '@/lib/utils'
import { getAlbumList } from '@/queries/albums'
import { ROUTES } from '@/routes/routesList'
import { eraService } from '@/service/eraService'
import { subsonic } from '@/service/subsonic'
import { AITag, EditType, tagService } from '@/service/tagService'
import { yeditorService } from '@/service/yeditorService'
import { usePlayerActions } from '@/store/player.store'
import { Albums } from '@/types/responses/album'
import { AlbumsFilters } from '@/utils/albumsFilter'
import { queryKeys } from '@/utils/queryKeys'

type SortType = 'recent' | 'name' | 'artist' | 'year' | 'streams'
type AIFilterType = 'all' | 'human' | 'ai'
type EditTypeFilter =
  | 'all'
  | 'highlight'
  | 'unique'
  | 'vanilla'
  | 'overhaul'
  | 'renovation'
  | 'extension'
  | 'remix'

// Edit type options for filtering and tagging
const EDIT_TYPES = [
  { id: 'highlight', label: 'Highlight', color: '#f59e0b' },
  { id: 'unique', label: 'Unique', color: '#8b5cf6' },
  { id: 'vanilla', label: 'Vanilla', color: '#6b7280' },
  { id: 'overhaul', label: 'Overhaul', color: '#ef4444' },
  { id: 'renovation', label: 'Renovation', color: '#3b82f6' },
  { id: 'extension', label: 'Extension', color: '#10b981' },
  { id: 'remix', label: 'Remix', color: '#ec4899' },
] as const

// Color palettes for cover color search
const COLOR_PALETTES = [
  { id: 'red', color: '#ef4444', label: 'Red' },
  { id: 'orange', color: '#f97316', label: 'Orange' },
  { id: 'yellow', color: '#eab308', label: 'Yellow' },
  { id: 'green', color: '#22c55e', label: 'Green' },
  { id: 'blue', color: '#3b82f6', label: 'Blue' },
  { id: 'purple', color: '#a855f7', label: 'Purple' },
  { id: 'pink', color: '#ec4899', label: 'Pink' },
  { id: 'black', color: '#1a1a1a', label: 'Black' },
  { id: 'white', color: '#f5f5f5', label: 'White' },
]

// Map colors to eras (for color-based filtering)
const COLOR_ERA_MAP: Record<string, string[]> = {
  red: ['before-tcd'],
  orange: ['tcd', 'late-registration'],
  yellow: ['graduation', 'wtt'],
  green: ['ye', '2023'],
  blue: ['jik', 'donda'],
  purple: ['yandhi', 'turbo'],
  pink: ['swish', 'love-everyone'],
  black: ['donda-2', 'shmg'],
  white: ['cruel-summer', '808s'],
}

export default function AdvancedSearch() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedEra, setSelectedEra] = useState('all')
  const [selectedArtist, setSelectedArtist] = useState('all')
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [selectedColor, setSelectedColor] = useState('all')
  const [selectedType, setSelectedType] = useState<'all' | 'comp' | 'single'>(
    'all',
  )
  const [selectedAIFilter, setSelectedAIFilter] = useState<AIFilterType>('all')
  const [selectedEditType, setSelectedEditType] =
    useState<EditTypeFilter>('all')
  const [sortType, setSortType] = useState<SortType>('recent')
  const [activeTab, setActiveTab] = useState('comps')
  const [yearRange, setYearRange] = useState<number[]>([
    1970,
    new Date().getFullYear(),
  ])

  // Era data loaded separately
  const [albumEras, setAlbumEras] = useState<Record<string, string>>({})

  // Tag data (AI and Edit Type)
  const [albumTags, setAlbumTags] = useState<
    Record<string, { aiTag: AITag | null; editType: EditType | null }>
  >({})

  // Hover background state
  const [hoveredCover, setHoveredCover] = useState<string | null>(null)

  // Player actions for album playback
  const { setSongList } = usePlayerActions()

  // --- DATA FETCHING ---

  // Fetch ALL albums using infinite query
  const defaultOffset = 200
  const { data, fetchNextPage, hasNextPage, isFetching, isLoading } =
    useInfiniteQuery({
      queryKey: [queryKeys.album.all, 'advanced-search'],
      queryFn: async ({ pageParam = 0 }) => {
        return getAlbumList({
          type: AlbumsFilters.RecentlyAdded,
          size: defaultOffset,
          offset: pageParam,
          fromYear: '0001',
          toYear: new Date().getFullYear().toString(),
          genre: '',
        })
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage.nextOffset,
    })

  // Flatten albums from pages
  const allAlbums = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap((page) => page.albums)
  }, [data])

  // Fetch eras for albums
  useEffect(() => {
    if (allAlbums.length > 0) {
      const ids = allAlbums.map((a) => a.id)
      eraService.getErasForContent(ids, 'album').then((eras) => {
        setAlbumEras((prev) => ({ ...prev, ...eras }))
      })
      // Also fetch tags
      tagService.getTagsForContent(ids, 'album').then((tags) => {
        setAlbumTags((prev) => ({ ...prev, ...tags }))
      })
    }
  }, [allAlbums])

  // Merge era and tag data into albums
  const albumsWithEras = useMemo(() => {
    return allAlbums.map((a) => ({
      ...a,
      era: albumEras[a.id],
      aiTag: albumTags[a.id]?.aiTag || null,
      editType: albumTags[a.id]?.editType || null,
    }))
  }, [allAlbums, albumEras, albumTags])

  // Yeditor Search Query
  const { data: yeditorResults } = useQuery({
    queryKey: ['adv-search-yeditors', searchQuery],
    queryFn: async () => {
      if (!searchQuery) return []
      return yeditorService.searchYeditors(searchQuery)
    },
    enabled: !!searchQuery && activeTab === 'yeditors',
  })

  // --- DERIVED DATA ---

  // Extract unique artists
  const artists = useMemo(() => {
    const artistMap = new Map<string, string>()
    albumsWithEras.forEach((album) => {
      if (album.artistId && album.artist) {
        artistMap.set(album.artistId, album.artist)
      }
    })
    return Array.from(artistMap, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    )
  }, [albumsWithEras])

  // Extract genres ONLY from albums that have an era tagged
  const genres = useMemo(() => {
    const genreSet = new Set<string>()
    albumsWithEras.forEach((album) => {
      if (album.era && album.genre) {
        genreSet.add(album.genre)
      }
    })
    return Array.from(genreSet).sort()
  }, [albumsWithEras])

  // Get year range from data
  const yearBounds = useMemo(() => {
    let min = new Date().getFullYear()
    let max = 1970
    albumsWithEras.forEach((a) => {
      if (a.year) {
        if (a.year < min) min = a.year
        if (a.year > max) max = a.year
      }
    })
    return { min: Math.max(1970, min), max }
  }, [albumsWithEras])

  // --- FILTERING ---

  const filteredAlbums = useMemo(() => {
    let filtered = albumsWithEras.filter((album) => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matches =
          album.name?.toLowerCase().includes(query) ||
          album.artist?.toLowerCase().includes(query)
        if (!matches) return false
      }

      // Era filter
      if (selectedEra !== 'all' && album.era !== selectedEra) {
        return false
      }

      // Color filter (mapped to eras)
      if (selectedColor !== 'all') {
        const colorEras = COLOR_ERA_MAP[selectedColor] || []
        if (!album.era || !colorEras.includes(album.era)) {
          return false
        }
      }

      // Artist filter
      if (selectedArtist !== 'all' && album.artistId !== selectedArtist) {
        return false
      }

      // Genre filter
      if (selectedGenre !== 'all' && album.genre !== selectedGenre) {
        return false
      }

      // Year filter
      if (
        album.year &&
        (album.year < yearRange[0] || album.year > yearRange[1])
      ) {
        return false
      }

      // Type filter (comp vs single)
      if (selectedType !== 'all') {
        const isSingle =
          (album.songCount || 0) <= 4 ||
          album.name?.toLowerCase().includes('ep')
        if (selectedType === 'single' && !isSingle) return false
        if (selectedType === 'comp' && isSingle) return false
      }

      // AI filter
      if (selectedAIFilter !== 'all') {
        if (selectedAIFilter === 'ai' && album.aiTag !== 'ai') return false
        if (selectedAIFilter === 'human' && album.aiTag !== 'human')
          return false
      }

      // Edit Type filter
      if (selectedEditType !== 'all') {
        if (album.editType !== selectedEditType) return false
      }

      return true
    })

    // Sorting
    if (sortType === 'name') {
      filtered = filtered.sort((a, b) =>
        (a.name || '').localeCompare(b.name || ''),
      )
    } else if (sortType === 'artist') {
      filtered = filtered.sort((a, b) =>
        (a.artist || '').localeCompare(b.artist || ''),
      )
    } else if (sortType === 'year') {
      filtered = filtered.sort((a, b) => (b.year || 0) - (a.year || 0))
    }

    return filtered
  }, [
    albumsWithEras,
    searchQuery,
    selectedEra,
    selectedColor,
    selectedArtist,
    selectedGenre,
    yearRange,
    selectedType,
    sortType,
  ])

  // Split into Comps and Singles
  const comps = useMemo(
    () =>
      filteredAlbums.filter(
        (a) => (a.songCount || 0) > 4 && !a.name?.toLowerCase().includes('ep'),
      ),
    [filteredAlbums],
  )
  const singles = useMemo(
    () =>
      filteredAlbums.filter(
        (a) => (a.songCount || 0) <= 4 || a.name?.toLowerCase().includes('ep'),
      ),
    [filteredAlbums],
  )

  // Counts
  const counts = {
    comps: comps.length,
    singles: singles.length,
    yeditors: yeditorResults?.length || 0,
  }

  // --- HANDLERS ---

  const handleClearFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedEra('all')
    setSelectedArtist('all')
    setSelectedGenre('all')
    setSelectedColor('all')
    setSelectedType('all')
    setSelectedAIFilter('all')
    setSelectedEditType('all')
    setSortType('recent')
    setYearRange([yearBounds.min, yearBounds.max])
    setSearchParams({})
  }, [setSearchParams, yearBounds])

  // Handle album playback
  const handlePlayAlbum = useCallback(
    async (albumId: string) => {
      try {
        const album = await subsonic.albums.getOne(albumId)
        if (album?.song && album.song.length > 0) {
          setSongList(album.song, 0, false)
        }
      } catch (err) {
        console.error('Failed to play album:', err)
      }
    },
    [setSongList],
  )

  const hasActiveFilters =
    searchQuery ||
    selectedEra !== 'all' ||
    selectedArtist !== 'all' ||
    selectedGenre !== 'all' ||
    selectedColor !== 'all' ||
    selectedType !== 'all' ||
    selectedAIFilter !== 'all' ||
    selectedEditType !== 'all' ||
    yearRange[0] !== yearBounds.min ||
    yearRange[1] !== yearBounds.max

  // Load more on scroll
  useEffect(() => {
    if (hasNextPage && !isFetching) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetching, fetchNextPage])

  const currentYear = new Date().getFullYear()

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-background pb-32">
      {/* Dynamic Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {hoveredCover ? (
          <div
            key={hoveredCover}
            className="absolute inset-[-20%] z-0 animate-in fade-in zoom-in-50 duration-700"
            style={{
              backgroundImage: `url(${getCoverArtUrl(hoveredCover, 'album', 'original')})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(80px) saturate(300%) brightness(0.6) contrast(1.2)',
              transform: 'scale(1.3)',
              opacity: 0.7,
            }}
          />
        ) : (
          <>
            <div className="absolute top-[-20%] right-[-20%] w-[70%] h-[70%] bg-purple-900/30 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-20%] left-[-20%] w-[70%] h-[70%] bg-emerald-900/30 rounded-full blur-[120px] animate-pulse animation-delay-2000" />
          </>
        )}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-background via-background/60 to-background/30" />
      </div>

      <div className="relative z-10 w-full px-6 md:px-12 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/50 mb-2">
              Advanced Search
            </h1>
            <p className="text-lg text-muted-foreground/80 font-light">
              {filteredAlbums.length} results • {allAlbums.length} total in
              library
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full md:w-auto inline-flex h-12 items-center justify-center rounded-2xl bg-white/5 p-1 text-muted-foreground backdrop-blur-md border border-white/10 mb-6">
            <TabsTrigger
              value="comps"
              className="rounded-xl px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              Comps{' '}
              <Badge variant="secondary" className="ml-2">
                {counts.comps}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="singles"
              className="rounded-xl px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              Singles{' '}
              <Badge variant="secondary" className="ml-2">
                {counts.singles}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="yeditors"
              className="rounded-xl px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              Yeditors{' '}
              <Badge variant="secondary" className="ml-2">
                {counts.yeditors}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Filters Bar - Row 1 */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 space-y-4 mb-8">
            <div className="flex flex-wrap gap-4 items-end">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block pl-1">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by name or artist..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary/50"
                  />
                </div>
              </div>

              {/* Era */}
              <div className="flex-1 min-w-[150px]">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block pl-1">
                  Era
                </label>
                <Select value={selectedEra} onValueChange={setSelectedEra}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
                    <SelectValue placeholder="All Eras" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-white/10 text-white">
                    <SelectItem value="all">All Eras</SelectItem>
                    {ERAS.map((era) => (
                      <SelectItem key={era.id} value={era.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: era.color }}
                          />
                          {era.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Artist */}
              <div className="flex-1 min-w-[150px]">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block pl-1">
                  Artist
                </label>
                <Select
                  value={selectedArtist}
                  onValueChange={setSelectedArtist}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
                    <SelectValue placeholder="All Artists" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-white/10 text-white max-h-[300px]">
                    <SelectItem value="all">All Artists</SelectItem>
                    {artists.map((artist) => (
                      <SelectItem key={artist.id} value={artist.id}>
                        {artist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Genre */}
              <div className="flex-1 min-w-[150px]">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block pl-1">
                  Genre
                </label>
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
                    <SelectValue placeholder="All Genres" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-white/10 text-white max-h-[300px]">
                    <SelectItem value="all">All Genres</SelectItem>
                    {genres.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type */}
              <div className="flex-1 min-w-[120px]">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block pl-1">
                  Type
                </label>
                <Select
                  value={selectedType}
                  onValueChange={(v) =>
                    setSelectedType(v as 'all' | 'comp' | 'single')
                  }
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-white/10 text-white">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="comp">Comps Only</SelectItem>
                    <SelectItem value="single">Singles Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div className="flex-1 min-w-[120px]">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block pl-1">
                  Sort By
                </label>
                <Select
                  value={sortType}
                  onValueChange={(v) => setSortType(v as SortType)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-white/10 text-white">
                    <SelectItem value="recent">Recently Added</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="artist">Artist</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                    <SelectItem value="streams">Streams</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* AI Filter */}
              <div className="flex-1 min-w-[100px]">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block pl-1">
                  AI
                </label>
                <Select
                  value={selectedAIFilter}
                  onValueChange={(v) => setSelectedAIFilter(v as AIFilterType)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-white/10 text-white">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="human">Human</SelectItem>
                    <SelectItem value="ai">AI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Edit Type Filter */}
              <div className="flex-1 min-w-[140px]">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block pl-1">
                  Edit Type
                </label>
                <Select
                  value={selectedEditType}
                  onValueChange={(v) =>
                    setSelectedEditType(v as EditTypeFilter)
                  }
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-white/10 text-white">
                    <SelectItem value="all">All Edit Types</SelectItem>
                    {EDIT_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: type.color }}
                          />
                          {type.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filters Row 2: Year Range + Color */}
            <div className="flex flex-wrap gap-4 items-end pt-2 border-t border-white/5">
              {/* Year Range */}
              <div className="flex-1 min-w-[250px]">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">
                    Year
                  </label>
                  <span className="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded">
                    {yearRange[0]} - {yearRange[1]}
                  </span>
                </div>
                <Slider
                  defaultValue={[yearBounds.min, yearBounds.max]}
                  max={currentYear}
                  min={1970}
                  step={1}
                  value={yearRange}
                  onValueChange={setYearRange}
                  className="py-2"
                />
              </div>

              {/* Color Filter */}
              <div className="min-w-[200px]">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block pl-1 flex items-center gap-1">
                  <Palette className="w-3 h-3" /> Cover Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTES.map((palette) => (
                    <button
                      key={palette.id}
                      onClick={() =>
                        setSelectedColor(
                          selectedColor === palette.id ? 'all' : palette.id,
                        )
                      }
                      className={cn(
                        'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                        selectedColor === palette.id
                          ? 'border-white scale-110 ring-2 ring-white/30'
                          : 'border-white/20',
                      )}
                      style={{ backgroundColor: palette.color }}
                      title={palette.label}
                    />
                  ))}
                  {selectedColor !== 'all' && (
                    <button
                      onClick={() => setSelectedColor('all')}
                      className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center bg-white/5 hover:bg-white/10"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  onClick={handleClearFilters}
                  className="hover:bg-red-500/10 hover:text-red-400"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse">
                Loading library...
              </p>
            </div>
          )}

          {/* Content */}
          {!isLoading && (
            <>
              {/* COMPS */}
              <TabsContent
                value="comps"
                className="mt-0 animate-in fade-in duration-500"
              >
                {comps.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                    {comps.map((album) => (
                      <AlbumCard
                        key={album.id}
                        album={album}
                        navigate={navigate}
                        onHover={setHoveredCover}
                        onPlay={handlePlayAlbum}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No compilations found. Try adjusting your filters." />
                )}
              </TabsContent>

              {/* SINGLES */}
              <TabsContent
                value="singles"
                className="mt-0 animate-in fade-in duration-500"
              >
                {singles.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                    {singles.map((album) => (
                      <AlbumCard
                        key={album.id}
                        album={album}
                        navigate={navigate}
                        onHover={setHoveredCover}
                        onPlay={handlePlayAlbum}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No singles found. Try adjusting your filters." />
                )}
              </TabsContent>

              {/* YEDITORS */}
              <TabsContent
                value="yeditors"
                className="mt-0 animate-in fade-in duration-500"
              >
                {yeditorResults && yeditorResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {yeditorResults.map((editor) => (
                      <div
                        key={editor.id}
                        className="bg-white/5 p-6 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-colors cursor-pointer group border border-white/5 hover:border-primary/30"
                        onClick={() => navigate(`/yeditor/${editor.id}`)}
                      >
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
                          {editor.avatar_url ? (
                            <img
                              src={editor.avatar_url}
                              className="w-full h-full object-cover"
                              alt={editor.name}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white/30">
                              {editor.name[0]}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg truncate">
                              {editor.name}
                            </h3>
                            {editor.is_verified && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1 h-5"
                              >
                                <Users className="w-3 h-3" />
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-white/50 truncate">
                            {editor.bio || 'No bio available'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    message={
                      searchQuery
                        ? 'No Yeditors found for that search.'
                        : 'Enter a search query to find Yeditors.'
                    }
                  />
                )}
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* Load More Indicator */}
        {isFetching && !isLoading && (
          <div className="text-center py-4 text-muted-foreground">
            Loading more...
          </div>
        )}
      </div>
    </div>
  )
}

// --- COMPONENTS ---

interface AlbumCardProps {
  album: Albums & {
    era?: string
    aiTag?: AITag | null
    editType?: EditType | null
  }
  navigate: ReturnType<typeof useNavigate>
  onHover: (coverArt: string | null) => void
  onPlay: (albumId: string) => void
}

function AlbumCard({ album, navigate, onHover, onPlay }: AlbumCardProps) {
  const eraColor = album.era ? getEraColor(album.era) : null
  const eraLabel = album.era ? getEraLabel(album.era) : null

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    onPlay(album.id)
  }

  return (
    <div
      className="group relative rounded-xl overflow-hidden bg-white/5 hover:bg-white/10 transition-all cursor-pointer border border-white/5 hover:border-white/20 hover:scale-[1.02]"
      onClick={() => navigate(ROUTES.ALBUM.PAGE(album.id))}
      onMouseEnter={() => onHover(album.coverArt)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Cover Image */}
      <div className="aspect-square relative overflow-hidden">
        <img
          src={getCoverArtUrl(album.coverArt, 'album', 'medium')}
          alt={album.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* Era Tag Overlay */}
        {eraLabel && (
          <div
            className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-lg"
            style={{
              backgroundColor: eraColor || '#333',
              color: '#fff',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            {eraLabel}
          </div>
        )}
        {/* AI Badge */}
        {album.aiTag === 'ai' && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-lg bg-violet-600 text-white">
            AI
          </div>
        )}
        {/* Hover Overlay with Play Button */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={handlePlay}
            className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-all duration-200 hover:bg-white hover:scale-110"
          >
            <Play className="w-6 h-6 text-background fill-background ml-0.5" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        <h3 className="font-bold text-sm truncate text-white group-hover:text-primary transition-colors">
          {album.name}
        </h3>
        <p className="text-xs text-muted-foreground truncate">{album.artist}</p>
        {album.year && (
          <p className="text-[10px] text-muted-foreground/60">{album.year}</p>
        )}
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center bg-white/5 rounded-2xl border border-white/10 border-dashed">
      <Search className="w-16 h-16 text-white/10 mb-4" />
      <p className="text-muted-foreground font-medium max-w-md">{message}</p>
    </div>
  )
}
