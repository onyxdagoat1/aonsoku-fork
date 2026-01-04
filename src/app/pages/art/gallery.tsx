import { useInfiniteQuery } from '@tanstack/react-query'
import debounce from 'lodash/debounce'
import {
  Calendar,
  Disc,
  Disc3,
  Download,
  Download as DownloadIcon,
  Grid2x2,
  Grid3x3,
  Heart,
  Info,
  Link as LinkIcon,
  TrendingDown,
  User,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import { Link } from 'react-router-dom'
import { getCoverArtUrl } from '@/api/httpClient'
import { AlbumInfoModal } from '@/app/components/art/album-info-modal'
import { ArtworkDetailModal } from '@/app/components/art/artwork-detail-modal'
import { UploadArtworkDialog } from '@/app/components/art/upload-artwork-dialog'
import { Button } from '@/app/components/ui/button'
import { Progress } from '@/app/components/ui/progress'
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
import { YeditorInline } from '@/app/components/yeditor/YeditorBadge'
import { useContentTags } from '@/app/hooks/use-content-tags'
import { useGetYeditorForContent } from '@/app/hooks/use-yeditor'
import { ERAS, getEraColor, getEraLabel } from '@/config/eras'
import { useBulkDownload } from '@/hooks/use-bulk-download'
import { useDownloadHistory } from '@/hooks/use-download-history'
import { useFavorites } from '@/hooks/use-favorites'
import { useToast } from '@/hooks/use-toast'
import { useViewHistory } from '@/hooks/use-view-history'
import { cn } from '@/lib/utils'
import { getAlbumList } from '@/queries/albums'
import { ROUTES } from '@/routes/routesList'
import { eraService } from '@/service/eraService'
import {
  ArtworkType,
  CustomArtwork,
  useArtworkStore,
} from '@/store/artwork.store'
import { Albums } from '@/types/responses/album'
import { AlbumsFilters } from '@/utils/albumsFilter'
import { queryKeys } from '@/utils/queryKeys'
import { getMainScrollElement } from '@/utils/scrollPageToTop'

type ArtType = 'all' | 'album' | 'single'
type SortType = 'recent' | 'popular'
type GridSize = 'small' | 'medium' | 'large'

const typeLabels: Record<ArtworkType, string> = {
  [ArtworkType.SingleCover]: 'Single Cover',
  [ArtworkType.Artwork]: 'Artwork',
  [ArtworkType.AlbumCover]: 'Comp Cover',
}

const gridSizeClasses: Record<GridSize, string> = {
  small:
    'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8',
  medium:
    'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
  large:
    'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5',
}

export default function ArtGallery() {
  useTranslation()
  const [selectedArtist, setSelectedArtist] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<ArtType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomType, setSelectedCustomType] = useState<string>('all')
  const [selectedEra, setSelectedEra] = useState<string>('all')
  const [selectedArtwork, setSelectedArtwork] = useState<CustomArtwork | null>(
    null,
  )
  const [selectedAlbum, setSelectedAlbum] = useState<Albums | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showAlbumModal, setShowAlbumModal] = useState(false)
  const [sortType, setSortType] = useState<SortType>('recent')
  const [albumSortType, setAlbumSortType] = useState<SortType>('recent')
  const [gridSize, setGridSize] = useState<GridSize>('medium')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [selectionMode, setSelectionMode] = useState(false)
  const [albumEras, setAlbumEras] = useState<Record<string, string>>({})
  const [hoveredCover, setHoveredCover] = useState<string | null>(null)
  const scrollDivRef = useRef<HTMLDivElement | null>(null)
  const { success } = useToast()

  const {
    artworks,
    loadArtworks,
    incrementDownload,
    incrementAlbumDownload,
    getAlbumDownloads,
  } = useArtworkStore()
  const { toggleFavorite, isFavorite, count: favoritesCount } = useFavorites()
  const { addToHistory, count: historyCount } = useViewHistory()
  const { recordDownload, getDownloadCount, getTotalDownloads } =
    useDownloadHistory()
  const { progress, downloadAlbums, downloadCustomArtworks, isDownloading } =
    useBulkDownload()

  useEffect(() => {
    loadArtworks()
  }, [loadArtworks])

  const defaultOffset = 128
  const oldestYear = '0001'
  const currentYear = new Date().getFullYear().toString()

  useEffect(() => {
    scrollDivRef.current = getMainScrollElement()
  }, [])

  const fetchAlbums = async ({ pageParam = 0 }) => {
    return getAlbumList({
      type: AlbumsFilters.RecentlyAdded,
      size: defaultOffset,
      offset: pageParam,
      fromYear: oldestYear,
      toYear: currentYear,
      genre: '',
    })
  }

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: [queryKeys.album.all, 'art-gallery'],
      queryFn: fetchAlbums,
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage.nextOffset,
    })

  const albums = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap((page) => page.albums)
  }, [data])

  const { data: albumTags } = useContentTags(
    useMemo(() => albums.map((a) => a.id), [albums]),
    'album',
  )

  useEffect(() => {
    if (albums.length > 0) {
      const ids = albums.map((a) => a.id)
      eraService.getErasForContent(ids, 'album').then((eras) => {
        setAlbumEras((prev) => ({ ...prev, ...eras }))
      })
    }
  }, [albums])

  const albumsWithEras = useMemo(() => {
    return albums.map((a) => ({
      ...a,
      era: albumEras[a.id],
    }))
  }, [albums, albumEras])

  const albumArtists = useMemo(() => {
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

  const customArtists = useMemo(() => {
    const artistSet = new Set(artworks.map((art) => art.artistName))
    return Array.from(artistSet).sort()
  }, [artworks])

  const filteredAlbums = useMemo(() => {
    let filtered = albumsWithEras.filter((album) => {
      if (showFavoritesOnly && !isFavorite(album.id, 'album')) {
        return false
      }

      if (selectedArtist !== 'all' && album.artistId !== selectedArtist) {
        return false
      }

      if (selectedType !== 'all') {
        const isSingle = album.songCount === 1
        if (selectedType === 'single' && !isSingle) return false
        if (selectedType === 'album' && isSingle) return false
      }

      if (selectedEra !== 'all' && album.era !== selectedEra) {
        return false
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          album.name?.toLowerCase().includes(query) ||
          album.artist?.toLowerCase().includes(query)
        )
      }

      return true
    })

    if (albumSortType === 'popular') {
      filtered = filtered.sort(
        (a, b) => getAlbumDownloads(b.id) - getAlbumDownloads(a.id),
      )
    }

    return filtered
  }, [
    albumsWithEras,
    selectedArtist,
    selectedType,
    selectedEra,
    searchQuery,
    albumSortType,
    getAlbumDownloads,
    showFavoritesOnly,
    isFavorite,
  ])

  const filteredCustomArtworks = useMemo(() => {
    let filtered = artworks.filter((artwork) => {
      if (showFavoritesOnly && !isFavorite(artwork.id, 'custom')) {
        return false
      }

      if (selectedArtist !== 'all' && artwork.artistName !== selectedArtist) {
        return false
      }

      if (selectedCustomType !== 'all' && artwork.type !== selectedCustomType) {
        return false
      }

      if (selectedEra !== 'all' && artwork.compEra !== selectedEra) {
        return false
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          artwork.artworkName.toLowerCase().includes(query) ||
          artwork.artistName.toLowerCase().includes(query) ||
          artwork.compEra.toLowerCase().includes(query)
        )
      }

      return true
    })

    if (sortType === 'popular') {
      filtered = filtered.sort(
        (a, b) => (b.downloads || 0) - (a.downloads || 0),
      )
    } else {
      filtered = filtered.sort((a, b) => b.uploadedAt - a.uploadedAt)
    }

    return filtered
  }, [
    artworks,
    selectedArtist,
    selectedCustomType,
    searchQuery,
    sortType,
    showFavoritesOnly,
    isFavorite,
    selectedEra,
  ])

  const handleBulkDownload = useCallback(async () => {
    const selectedAlbums = filteredAlbums.filter((album) =>
      selectedItems.has(`album-${album.id}`),
    )
    const selectedCustom = filteredCustomArtworks.filter((art) =>
      selectedItems.has(`custom-${art.id}`),
    )

    if (selectedAlbums.length > 0) {
      await downloadAlbums(selectedAlbums)
      selectedAlbums.forEach((album) => {
        recordDownload(album.id, 'album', album.name, album.artist)
        incrementAlbumDownload(album.id)
      })
    }

    if (selectedCustom.length > 0) {
      await downloadCustomArtworks(selectedCustom)
      selectedCustom.forEach((art) => {
        recordDownload(art.id, 'custom', art.artworkName, art.artistName)
        incrementDownload(art.id)
      })
    }

    setSelectedItems(new Set())
    setSelectionMode(false)
    success(
      'Download complete',
      `Downloaded ${selectedAlbums.length + selectedCustom.length} items`,
    )
  }, [
    selectedItems,
    filteredAlbums,
    filteredCustomArtworks,
    downloadAlbums,
    downloadCustomArtworks,
    recordDownload,
    incrementAlbumDownload,
    incrementDownload,
    success,
  ])

  const handleBulkFavorite = useCallback(() => {
    let favoriteCount = 0
    let unfavoriteCount = 0

    selectedItems.forEach((key) => {
      const [type, id] = key.split('-')
      const itemType = type as 'album' | 'custom'
      const currentlyFavorited = isFavorite(id, itemType)

      if (!currentlyFavorited) {
        favoriteCount++
      } else {
        unfavoriteCount++
      }

      toggleFavorite(id, itemType)
    })

    setSelectedItems(new Set())
    setSelectionMode(false)

    if (favoriteCount > 0 && unfavoriteCount > 0) {
      success(
        'Updated favorites',
        `Added ${favoriteCount}, removed ${unfavoriteCount} items`,
      )
    } else if (favoriteCount > 0) {
      success(
        'Added to favorites',
        `${favoriteCount} item${favoriteCount !== 1 ? 's' : ''} added`,
      )
    } else {
      success(
        'Removed from favorites',
        `${unfavoriteCount} item${unfavoriteCount !== 1 ? 's' : ''} removed`,
      )
    }
  }, [selectedItems, isFavorite, toggleFavorite, success])

  useEffect(() => {
    const scrollElement = scrollDivRef.current
    if (!scrollElement) return

    const handleScroll = debounce(() => {
      const { scrollTop, clientHeight, scrollHeight } = scrollElement

      const isNearBottom =
        scrollTop + clientHeight >= scrollHeight - scrollHeight / 4

      if (isNearBottom) {
        if (hasNextPage) fetchNextPage()
      }
    }, 200)

    scrollElement.addEventListener('scroll', handleScroll)
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll)
    }
  }, [fetchNextPage, hasNextPage])

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-background pb-32">
      {/* Dynamic Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-background/30 z-10 transition-colors duration-1000" />
        {hoveredCover ? (
          <div
            key={hoveredCover}
            className="absolute inset-[-10%] z-0 animate-in fade-in zoom-in-50 duration-500"
            style={{
              backgroundImage: `url(${getCoverArtUrl(hoveredCover, 'album', 'original')})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(90px) saturate(220%) brightness(0.5) contrast(1.1)',
              transform: 'scale(1.1)',
              opacity: 0.5,
            }}
          />
        ) : (
          <>
            <div className="absolute top-[-20%] right-[-20%] w-[70%] h-[70%] bg-emerald-900/20 rounded-full blur-[120px] animate-blob" />
            <div className="absolute bottom-[-20%] left-[-20%] w-[70%] h-[70%] bg-blue-900/20 rounded-full blur-[120px] animate-blob animation-delay-2000" />
          </>
        )}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="relative z-10 w-full px-8 py-8 md:px-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h1 className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/50 mb-4">
              Art Gallery
            </h1>
            <p className="text-lg text-muted-foreground/80 font-light flex items-center gap-2">
              {favoritesCount > 0 && <span>{favoritesCount} favorites •</span>}
              {historyCount > 0 && <span>{historyCount} viewed •</span>}
              <span>{getTotalDownloads()} total downloads</span>
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md rounded-2xl p-2 border border-white/10">
            {/* Selection mode controls */}
            {selectionMode && (
              <>
                <span className="text-sm font-medium px-2">
                  {selectedItems.size} selected
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedItems(new Set())
                    setSelectionMode(false)
                  }}
                  className="hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleBulkFavorite}
                  disabled={selectedItems.size === 0}
                  className="hover:bg-white/10"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Favorite
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleBulkDownload}
                  disabled={selectedItems.size === 0 || isDownloading}
                >
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <div className="w-px h-6 bg-white/10 mx-1" />
              </>
            )}
            {!selectionMode && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectionMode(true)}
                className="hover:bg-white/10"
              >
                Select Multiple
              </Button>
            )}

            {/* Grid Size Toggle */}
            <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1">
              <Button
                variant={gridSize === 'small' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setGridSize('small')}
                className="h-8 w-8 p-0"
                title="Small grid"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={gridSize === 'medium' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setGridSize('medium')}
                className="h-8 w-8 p-0"
                title="Medium grid"
              >
                <Grid2x2 className="h-4 w-4" />
              </Button>
              <Button
                variant={gridSize === 'large' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setGridSize('large')}
                className="h-8 w-8 p-0"
                title="Large grid"
              >
                <Grid2x2 className="h-3 w-3" />
              </Button>
            </div>

            <div className="w-px h-6 bg-white/10 mx-1" />
            <UploadArtworkDialog />
          </div>
        </div>

        {/* Bulk download progress */}
        {isDownloading && (
          <div className="mb-4 p-4 border rounded-lg bg-muted">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {progress.status === 'downloading' &&
                  `Downloading ${progress.current}/${progress.total}...`}
                {progress.status === 'zipping' && 'Creating ZIP file...'}
                {progress.status === 'complete' && 'Complete!'}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round((progress.current / progress.total) * 100)}%
              </span>
            </div>
            <Progress value={(progress.current / progress.total) * 100} />
          </div>
        )}

        <Tabs defaultValue="albums" className="w-full">
          <TabsList className="w-full md:w-auto inline-flex h-12 items-center justify-center rounded-2xl bg-white/5 p-1 text-muted-foreground backdrop-blur-md border border-white/10 mb-8">
            <TabsTrigger
              value="albums"
              className="rounded-xl px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              Comp Covers
            </TabsTrigger>
            <TabsTrigger
              value="custom"
              className="rounded-xl px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              Custom Artwork ({artworks.length})
            </TabsTrigger>
          </TabsList>

          {/* Comp Covers Tab */}
          <TabsContent value="albums" className="space-y-6">
            {/* Filters */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[180px]">
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
                  <SelectContent className="bg-neutral-900 border-white/10 text-white">
                    <SelectItem value="all">All Artists</SelectItem>
                    {albumArtists.map((artist) => (
                      <SelectItem key={artist.id} value={artist.id}>
                        {artist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[180px]">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block pl-1">
                  Type
                </label>
                <Select
                  value={selectedType}
                  onValueChange={(v) => setSelectedType(v as ArtType)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-white/10 text-white">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="album">Comps Only</SelectItem>
                    <SelectItem value="single">Singles Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[180px]">
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
                        {era.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[180px]">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block pl-1">
                  Sort By
                </label>
                <Select
                  value={albumSortType}
                  onValueChange={(v) => setAlbumSortType(v as SortType)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-white/10 text-white">
                    <SelectItem value="recent">Recently Added</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block pl-1">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-white/10 rounded-md bg-white/5 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                />
              </div>

              <Button
                variant={showFavoritesOnly ? 'secondary' : 'ghost'}
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className="flex items-center gap-2 hover:bg-white/10"
              >
                <Heart
                  className={cn(
                    'h-4 w-4',
                    showFavoritesOnly && 'fill-current text-red-500',
                  )}
                />
                Favorites
              </Button>

              {(selectedArtist !== 'all' ||
                selectedType !== 'all' ||
                selectedEra !== 'all' ||
                searchQuery ||
                albumSortType !== 'recent' ||
                showFavoritesOnly) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedArtist('all')
                    setSelectedType('all')
                    setSelectedEra('all')
                    setSearchQuery('')
                    setAlbumSortType('recent')
                    setShowFavoritesOnly(false)
                  }}
                  className="hover:bg-red-500/10 hover:text-red-400"
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Results count */}
            <div className="text-sm text-muted-foreground">
              Showing {filteredAlbums.length} artwork
              {filteredAlbums.length !== 1 ? 's' : ''}
            </div>

            {/* Art Grid */}
            <div className={cn('grid gap-4', gridSizeClasses[gridSize])}>
              {filteredAlbums.map((album) => (
                <AlbumArtCard
                  key={album.id}
                  album={album}
                  downloads={getAlbumDownloads(album.id)}
                  personalDownloads={getDownloadCount(album.id, 'album')}
                  isFavorite={isFavorite(album.id, 'album')}
                  isSelected={selectedItems.has(`album-${album.id}`)}
                  selectionMode={selectionMode}
                  onToggleSelection={() => {
                    const key = `album-${album.id}`
                    setSelectedItems((prev) => {
                      const next = new Set(prev)
                      if (next.has(key)) next.delete(key)
                      else next.add(key)
                      return next
                    })
                  }}
                  onToggleFavorite={() => toggleFavorite(album.id, 'album')}
                  onInfoClick={(album) => {
                    setSelectedAlbum(album)
                    setShowAlbumModal(true)
                    addToHistory({
                      id: album.id,
                      type: 'album',
                      name: album.name,
                      artist: album.artist,
                    })
                  }}
                  onDownload={() => {
                    incrementAlbumDownload(album.id)
                    recordDownload(album.id, 'album', album.name, album.artist)
                  }}
                  onCopyUrl={(url) => {
                    navigator.clipboard.writeText(url)
                    success('Copied!', 'Cover URL copied to clipboard')
                  }}
                  onHover={setHoveredCover}
                  tags={albumTags?.[album.id]}
                />
              ))}
            </div>

            {isFetchingNextPage && (
              <div className="text-center py-8 text-muted-foreground">
                Loading more...
              </div>
            )}
          </TabsContent>

          {/* Custom Artwork Tab */}
          <TabsContent value="custom" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Artist</label>
                <Select
                  value={selectedArtist}
                  onValueChange={setSelectedArtist}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Artists" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Artists</SelectItem>
                    {customArtists.map((artist) => (
                      <SelectItem key={artist} value={artist}>
                        {artist}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select
                  value={selectedCustomType}
                  onValueChange={setSelectedCustomType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value={ArtworkType.SingleCover}>
                      Single Cover
                    </SelectItem>
                    <SelectItem value={ArtworkType.Artwork}>Artwork</SelectItem>
                    <SelectItem value={ArtworkType.AlbumCover}>
                      Comp Cover
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Era</label>
                <Select value={selectedEra} onValueChange={setSelectedEra}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Eras" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Eras</SelectItem>
                    {ERAS.map((era) => (
                      <SelectItem key={era.id} value={era.id}>
                        {era.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">
                  Sort By
                </label>
                <Select
                  value={sortType}
                  onValueChange={(v) => setSortType(v as SortType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recently Added</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Search</label>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>

              <Button
                variant={showFavoritesOnly ? 'default' : 'outline'}
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className="flex items-center gap-2"
              >
                <Heart
                  className={cn('h-4 w-4', showFavoritesOnly && 'fill-current')}
                />
                Favorites
              </Button>

              {(selectedArtist !== 'all' ||
                selectedCustomType !== 'all' ||
                selectedEra !== 'all' ||
                searchQuery ||
                sortType !== 'recent' ||
                showFavoritesOnly) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedArtist('all')
                    setSelectedCustomType('all')
                    setSelectedEra('all')
                    setSearchQuery('')
                    setSortType('recent')
                    setShowFavoritesOnly(false)
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Results count */}
            <div className="text-sm text-muted-foreground">
              Showing {filteredCustomArtworks.length} artwork
              {filteredCustomArtworks.length !== 1 ? 's' : ''}
            </div>

            {/* Custom Art Grid */}
            {filteredCustomArtworks.length > 0 ? (
              <div className={cn('grid gap-4', gridSizeClasses[gridSize])}>
                {filteredCustomArtworks.map((artwork) => (
                  <CustomArtCard
                    key={artwork.id}
                    artwork={artwork}
                    personalDownloads={getDownloadCount(artwork.id, 'custom')}
                    isFavorite={isFavorite(artwork.id, 'custom')}
                    isSelected={selectedItems.has(`custom-${artwork.id}`)}
                    selectionMode={selectionMode}
                    onToggleSelection={() => {
                      const key = `custom-${artwork.id}`
                      setSelectedItems((prev) => {
                        const next = new Set(prev)
                        if (next.has(key)) next.delete(key)
                        else next.add(key)
                        return next
                      })
                    }}
                    onToggleFavorite={() =>
                      toggleFavorite(artwork.id, 'custom')
                    }
                    onClick={() => {
                      setSelectedArtwork(artwork)
                      setShowDetailModal(true)
                      addToHistory({
                        id: artwork.id,
                        type: 'custom',
                        name: artwork.artworkName,
                        artist: artwork.artistName,
                        imageUrl: artwork.imageData,
                      })
                    }}
                    onDownload={() => {
                      incrementDownload(artwork.id)
                      recordDownload(
                        artwork.id,
                        'custom',
                        artwork.artworkName,
                        artwork.artistName,
                      )
                    }}
                    onCopyUrl={(url) => {
                      navigator.clipboard.writeText(url)
                      success('Copied!', 'Artwork URL copied to clipboard')
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No custom artwork yet. Upload your first piece!
                </p>
                <UploadArtworkDialog />
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Artwork Detail Modal */}
        <ArtworkDetailModal
          artwork={selectedArtwork}
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
        />

        {/* Comp Info Modal */}
        <AlbumInfoModal
          album={selectedAlbum}
          open={showAlbumModal}
          onOpenChange={setShowAlbumModal}
        />
      </div>
    </div>
  )
}

function AlbumArtCard({
  album,
  downloads,
  personalDownloads,
  isFavorite,
  isSelected,
  selectionMode,
  onToggleSelection,
  onToggleFavorite,
  onInfoClick,
  onDownload,
  onCopyUrl,
  onHover,
  tags,
}: {
  album: Albums & { era?: string }
  downloads: number
  personalDownloads: number
  isFavorite: boolean
  isSelected: boolean
  selectionMode: boolean
  onToggleSelection: () => void
  onToggleFavorite: () => void
  onInfoClick: (album: Albums & { era?: string }) => void
  onDownload: () => void
  onCopyUrl: (url: string) => void
  onHover: (coverArt: string | null) => void
  tags?: { aiTag: 'human' | 'ai' | null; editType: string | null }
}) {
  const isSingle = album.songCount === 1
  const contentType = isSingle
    ? 'single'
    : album.isCompilation
      ? 'compilation'
      : 'album'
  const { data: yeditor } = useGetYeditorForContent(album.id, contentType)
  const { success, error } = useToast()

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const coverUrl = getCoverArtUrl(album.coverArt, 'album', '800')
      const response = await fetch(coverUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${album.name} - ${album.artist}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      onDownload()
      success('Downloaded', `${album.name} saved to downloads`)
    } catch (err) {
      error('Download failed', 'Failed to download cover')
      console.error(err)
    }
  }

  const handleInfoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onInfoClick(album)
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggleFavorite()
  }

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const url = getCoverArtUrl(album.coverArt, 'album', '800')
    onCopyUrl(url)
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (selectionMode) {
      e.preventDefault()
      onToggleSelection()
    }
  }

  return (
    <Link
      to={ROUTES.ALBUM.PAGE(album.id)}
      onClick={handleClick}
      onMouseEnter={() => onHover(album.coverArt)}
      onMouseLeave={() => onHover(null)}
      className={cn(
        'group relative aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10 hover:ring-2 hover:ring-primary transition-all',
        isSelected && 'ring-2 ring-primary',
      )}
    >
      <LazyLoadImage
        src={getCoverArtUrl(album.coverArt, 'album', '400')}
        alt={`${album.name} by ${album.artist}`}
        className="w-full h-full object-cover"
        effect="opacity"
      />

      {/* Selection checkbox */}
      {selectionMode && (
        <div className="absolute top-2 left-2 z-20">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelection}
            className="h-5 w-5 rounded border-2 border-white"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Favorite icon */}
      {!selectionMode && (
        <button
          onClick={handleFavoriteClick}
          className="absolute top-2 left-2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={cn('w-4 h-4', isFavorite && 'fill-red-500 text-red-500')}
          />
        </button>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
        <div className="absolute top-3 right-3 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-75">
          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full text-xs font-medium text-white mr-auto">
            <Download className="w-3 h-3" />
            {downloads}
          </div>
          <button
            onClick={handleCopyUrl}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
            title="Copy Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleInfoClick}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
            title="Info"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {tags?.aiTag && (
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider shadow-sm',
                  tags.aiTag === 'ai' ? 'bg-purple-500/80' : 'bg-green-500/80',
                )}
              >
                {tags.aiTag === 'ai' ? 'AI' : 'HUMAN'}
              </span>
            )}
            {tags?.editType && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/80 text-white uppercase tracking-wider shadow-sm">
                {tags.editType}
              </span>
            )}
            {album.era && (
              <span
                className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider shadow-sm"
                style={{ backgroundColor: getEraColor(album.era) }}
              >
                {getEraLabel(album.era)}
              </span>
            )}
            <span className="text-[10px] font-medium text-white/70 uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded">
              {isSingle ? 'Single' : 'Comp'}
            </span>
          </div>

          <p className="text-base font-bold text-white line-clamp-1 leading-tight">
            {album.name}
          </p>
          <p className="text-sm text-white/80 line-clamp-1 font-medium">
            {album.artist}
          </p>
        </div>
      </div>
    </Link>
  )
}

function CustomArtCard({
  artwork,
  personalDownloads,
  isFavorite,
  isSelected,
  selectionMode,
  onToggleSelection,
  onToggleFavorite,
  onClick,
  onDownload,
  onCopyUrl,
}: {
  artwork: CustomArtwork
  personalDownloads: number
  isFavorite: boolean
  isSelected: boolean
  selectionMode: boolean
  onToggleSelection: () => void
  onToggleFavorite: () => void
  onClick: () => void
  onDownload: () => void
  onCopyUrl: (url: string) => void
}) {
  const { success, error } = useToast()

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const link = document.createElement('a')
      link.href = artwork.imageData
      link.download = `${artwork.artworkName} - ${artwork.artistName}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      onDownload()
      success('Downloaded', `${artwork.artworkName} saved to downloads`)
    } catch (err) {
      error('Download failed', 'Failed to download artwork')
      console.error(err)
    }
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleFavorite()
  }

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation()
    onCopyUrl(artwork.imageData)
  }

  const handleClick = () => {
    if (selectionMode) {
      onToggleSelection()
    } else {
      onClick()
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'group relative aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10 hover:ring-2 hover:ring-primary transition-all text-left',
        isSelected && 'ring-2 ring-primary',
      )}
    >
      <img
        src={artwork.imageData}
        alt={artwork.artworkName}
        className="w-full h-full object-cover"
      />

      {/* Selection checkbox */}
      {selectionMode && (
        <div className="absolute top-2 left-2 z-20">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelection}
            className="h-5 w-5 rounded border-2 border-white"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Favorite icon */}
      {!selectionMode && (
        <button
          onClick={handleFavoriteClick}
          className="absolute top-2 left-2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={cn('w-4 h-4', isFavorite && 'fill-red-500 text-red-500')}
          />
        </button>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            onClick={handleCopyUrl}
            className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            title="Copy URL"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3 text-white/80" />
            <span className="text-xs text-white/80">
              {artwork.editor || artwork.artistName}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-white/80" />
            <span className="text-xs text-white/80">
              {artwork.downloads || 0} community • {personalDownloads} you
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-white/80" />
            <span
              className="text-xs text-white px-2 py-0.5 rounded-full"
              style={{ backgroundColor: getEraColor(artwork.compEra) }}
            >
              {getEraLabel(artwork.compEra) || artwork.compEra}
            </span>
          </div>
          <p className="text-sm font-medium text-white line-clamp-1">
            {artwork.artworkName}
          </p>
          <p className="text-xs text-white/60">{typeLabels[artwork.type]}</p>
        </div>
      </div>
    </button>
  )
}
