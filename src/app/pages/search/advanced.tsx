import { useQuery } from '@tanstack/react-query'
import { Calendar, Loader2, Music, Search, Tag, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getCoverArtUrl } from '@/api/httpClient'
import { AlbumGridCard } from '@/app/components/albums/album-grid-card'
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
import { ERAS, getEraColor, getEraLabel } from '@/config/eras'
import { subsonic } from '@/service/subsonic'
import { Albums } from '@/types/responses/album'

export default function AdvancedSearch() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // State for filters
  const [query, setQuery] = useState(searchParams.get('query') || '')
  const [selectedGenre, setSelectedGenre] = useState(
    searchParams.get('genre') || 'all',
  )
  const [selectedEra, setSelectedEra] = useState(
    searchParams.get('era') || 'all',
  )
  const [selectedArtist, setSelectedArtist] = useState(
    searchParams.get('artist') || '',
  )
  const [yearRange, setYearRange] = useState<number[]>([
    parseInt(searchParams.get('yearFrom') || '1970'),
    parseInt(searchParams.get('yearTo') || new Date().getFullYear().toString()),
  ])
  const [releaseType, setReleaseType] = useState(
    searchParams.get('type') || 'all',
  )

  // Set initial values from URL params
  useEffect(() => {
    const year = searchParams.get('year')
    if (year) {
      const yearNum = parseInt(year)
      setYearRange([yearNum, yearNum])
    }
  }, [searchParams])

  // Fetch genres
  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: async () => {
      const result = await subsonic.genres.getGenres()
      return result || []
    },
  })

  // Perform search
  const {
    data: searchResults,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      'advanced-search',
      query,
      selectedGenre,
      selectedEra,
      selectedArtist,
      yearRange,
      releaseType,
    ],
    queryFn: async () => {
      // Start with search query if provided
      let albums: Albums[] = []

      if (query) {
        const results = await subsonic.search.search3(query)
        albums = results?.album || []
      } else {
        // Get all albums
        const allAlbums = await subsonic.albums.getAlbums(
          'alphabeticalByName',
          500,
        )
        albums = allAlbums || []
      }

      // Apply filters
      let filtered = albums

      // Genre filter
      if (selectedGenre && selectedGenre !== 'all') {
        filtered = filtered.filter((album) => album.genre === selectedGenre)
      }

      // Year range filter
      filtered = filtered.filter((album) => {
        if (!album.year) return false
        return album.year >= yearRange[0] && album.year <= yearRange[1]
      })

      // Release type filter
      if (releaseType && releaseType !== 'all') {
        // Filter based on album type or number of tracks
        if (releaseType === 'album') {
          filtered = filtered.filter(
            (album) =>
              !album.name?.toLowerCase().includes('ep') &&
              (album.songCount || 0) > 4,
          )
        } else if (releaseType === 'ep') {
          filtered = filtered.filter(
            (album) =>
              album.name?.toLowerCase().includes('ep') ||
              ((album.songCount || 0) <= 4 && (album.songCount || 0) > 1),
          )
        } else if (releaseType === 'single') {
          filtered = filtered.filter((album) => (album.songCount || 0) === 1)
        }
      }

      // Artist filter
      if (selectedArtist) {
        filtered = filtered.filter((album) =>
          album.artist?.toLowerCase().includes(selectedArtist.toLowerCase()),
        )
      }

      return filtered
    },
    enabled: true,
  })

  const handleSearch = () => {
    refetch()
  }

  const handleClearFilters = () => {
    setQuery('')
    setSelectedGenre('all')
    setSelectedEra('all')
    setSelectedArtist('')
    setYearRange([1970, new Date().getFullYear()])
    setReleaseType('all')
    navigate('/library/advanced-search')
  }

  const currentYear = new Date().getFullYear()

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent sm:text-5xl">
          Advanced Search
        </h1>
        <p className="text-lg text-muted-foreground">
          Find music by genre, year, artist, or era
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        {/* Filters Sidebar */}
        <div className="space-y-6 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-sm h-fit sticky top-4">
          <div className="flex items-center justify-between pb-4 border-b border-border/50">
            <div className="flex items-center gap-2 font-bold text-xl">
              <Search className="w-5 h-5 text-primary" />
              Filters
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs"
            >
              Clear All
            </Button>
          </div>

          {/* Search Query */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Music className="w-4 h-4 text-muted-foreground" />
              Search
            </label>
            <Input
              placeholder="Album or artist name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-background/50"
            />
          </div>

          {/* Genre Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Music className="w-4 h-4 text-muted-foreground" />
              Genre
            </label>
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger>
                <SelectValue placeholder="All Genres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                {genres?.map((genre) => (
                  <SelectItem key={genre.value} value={genre.value}>
                    {genre.value} ({genre.albumCount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year Range Filter */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Release Year
              </label>
              <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                {yearRange[0]} - {yearRange[1]}
              </span>
            </div>
            <Slider
              defaultValue={[1970, currentYear]}
              max={currentYear}
              min={1970}
              step={1}
              value={yearRange}
              onValueChange={setYearRange}
              className="py-4"
            />
          </div>

          {/* Release Type Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              Release Type
            </label>
            <Select value={releaseType} onValueChange={setReleaseType}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="album">Albums</SelectItem>
                <SelectItem value="ep">EPs</SelectItem>
                <SelectItem value="single">Singles</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Artist Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              Artist
            </label>
            <Input
              placeholder="Filter by artist..."
              value={selectedArtist}
              onChange={(e) => setSelectedArtist(e.target.value)}
              className="bg-background/50"
            />
          </div>

          {/* Era Filter */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              Era Tags
            </label>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedEra === 'all' ? 'default' : 'secondary'}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedEra('all')}
              >
                All Eras
              </Badge>
              {Object.keys(ERAS).map((era) => (
                <Badge
                  key={era}
                  variant={selectedEra === era ? 'default' : 'secondary'}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor:
                      selectedEra === era ? getEraColor(era) : undefined,
                  }}
                  onClick={() => setSelectedEra(era)}
                >
                  {getEraLabel(era)}
                </Badge>
              ))}
            </div>
          </div>

          <Button onClick={handleSearch} className="w-full" size="lg">
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>

        {/* Results Area */}
        <div className="space-y-6">
          {/* Results Header */}
          {!isLoading && searchResults && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Found {searchResults.length} result
                {searchResults.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Results Grid */}
          {!isLoading && searchResults && searchResults.length > 0 && (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {searchResults.map((album) => (
                <AlbumGridCard key={album.id} album={album} />
              ))}
            </div>
          )}

          {/* No Results */}
          {!isLoading && searchResults && searchResults.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Music className="w-16 h-16 text-muted-foreground/20 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Try adjusting your filters or search query
              </p>
              <Button variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
