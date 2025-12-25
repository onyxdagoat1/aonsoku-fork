import { getCoverArtUrl } from '@/api/httpClient'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import { Link } from 'react-router-dom'
import { Button } from '@/app/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { ROUTES } from '@/routes/routesList'
import { getAlbumList } from '@/queries/albums'
import { IAlbum } from '@/types/responses/album'
import { Disc, Disc3, User, Calendar, Download, Info, TrendingDown, Heart, Grid3x3, Grid2x2 } from 'lucide-react'
import { useInfiniteQuery } from '@tanstack/react-query'
import debounce from 'lodash/debounce'
import { queryKeys } from '@/utils/queryKeys'
import { AlbumsFilters } from '@/utils/albumsFilter'
import { getMainScrollElement } from '@/utils/scrollPageToTop'
import { UploadArtworkDialog } from '@/app/components/art/upload-artwork-dialog'
import { useArtworkStore, CustomArtwork, ArtworkType } from '@/store/artwork.store'
import { ArtworkDetailModal } from '@/app/components/art/artwork-detail-modal'
import { AlbumInfoModal } from '@/app/components/art/album-info-modal'
import { useToast } from '@/hooks/use-toast'
import { useFavorites } from '@/hooks/use-favorites'
import { cn } from '@/lib/utils'

type ArtType = 'all' | 'album' | 'single'
type SortType = 'recent' | 'popular'
type GridSize = 'small' | 'medium' | 'large'

const typeLabels: Record<ArtworkType, string> = {
  [ArtworkType.SingleCover]: 'Single Cover',
  [ArtworkType.Artwork]: 'Artwork',
  [ArtworkType.AlbumCover]: 'Comp Cover',
}

const gridSizeClasses: Record<GridSize, string> = {
  small: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12',
  medium: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8',
  large: 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
}

export default function ArtGallery() {
  const { t } = useTranslation()
  const [selectedArtist, setSelectedArtist] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<ArtType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomType, setSelectedCustomType] = useState<string>('all')
  const [selectedArtwork, setSelectedArtwork] = useState<CustomArtwork | null>(null)
  const [selectedAlbum, setSelectedAlbum] = useState<IAlbum | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showAlbumModal, setShowAlbumModal] = useState(false)
  const [sortType, setSortType] = useState<SortType>('recent')
  const [albumSortType, setAlbumSortType] = useState<SortType>('recent')
  const [gridSize, setGridSize] = useState<GridSize>('medium')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const scrollDivRef = useRef<HTMLDivElement | null>(null)

  const { artworks, loadArtworks, incrementDownload, incrementAlbumDownload, getAlbumDownloads } = useArtworkStore()
  const { toggleFavorite, isFavorite, count: favoritesCount } = useFavorites()

  useEffect(() => {
    loadArtworks()
  }, [])

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

  // Get unique artists from albums
  const albumArtists = useMemo(() => {
    const artistMap = new Map<string, string>()
    albums.forEach((album) => {
      if (album.artistId && album.artist) {
        artistMap.set(album.artistId, album.artist)
      }
    })
    return Array.from(artistMap, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    )
  }, [albums])

  // Get unique artists from custom artwork
  const customArtists = useMemo(() => {
    const artistSet = new Set(artworks.map((art) => art.artistName))
    return Array.from(artistSet).sort()
  }, [artworks])

  // Filter and sort albums
  const filteredAlbums = useMemo(() => {
    let filtered = albums.filter((album) => {
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

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          album.name?.toLowerCase().includes(query) ||
          album.artist?.toLowerCase().includes(query)
        )
      }

      return true
    })

    // Sort by popularity (downloads) or recent
    if (albumSortType === 'popular') {
      filtered = filtered.sort((a, b) => getAlbumDownloads(b.id) - getAlbumDownloads(a.id))
    }

    return filtered
  }, [albums, selectedArtist, selectedType, searchQuery, albumSortType, getAlbumDownloads, showFavoritesOnly, isFavorite])

  // Filter and sort custom artworks
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

    // Sort by popularity (downloads) or recent
    if (sortType === 'popular') {
      filtered = filtered.sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
    } else {
      filtered = filtered.sort((a, b) => b.uploadedAt - a.uploadedAt)
    }

    return filtered
  }, [artworks, selectedArtist, selectedCustomType, searchQuery, sortType, showFavoritesOnly, isFavorite])

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
    <div className="w-full p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Art Gallery</h1>
          <p className="text-muted-foreground">
            Explore artwork created by the community. {favoritesCount > 0 && `${favoritesCount} favorites`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Grid Size Toggle */}
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant={gridSize === 'small' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setGridSize('small')}
              className="h-8 w-8 p-0"
              title="Small grid"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={gridSize === 'medium' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setGridSize('medium')}
              className="h-8 w-8 p-0"
              title="Medium grid"
            >
              <Grid2x2 className="h-4 w-4" />
            </Button>
            <Button
              variant={gridSize === 'large' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setGridSize('large')}
              className="h-8 w-8 p-0"
              title="Large grid"
            >
              <Grid2x2 className="h-3 w-3" />
            </Button>
          </div>
          <UploadArtworkDialog />
        </div>
      </div>

      <Tabs defaultValue="albums" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="albums">Comp Covers</TabsTrigger>
          <TabsTrigger value="custom">
            Custom Artwork ({artworks.length})
          </TabsTrigger>
        </TabsList>

        {/* Comp Covers Tab */}
        <TabsContent value="albums" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Artist</label>
              <Select value={selectedArtist} onValueChange={setSelectedArtist}>
                <SelectTrigger>
                  <SelectValue placeholder="All Artists" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Artists</SelectItem>
                  {albumArtists.map((artist) => (
                    <SelectItem key={artist.id} value={artist.id}>
                      {artist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select
                value={selectedType}
                onValueChange={(v) => setSelectedType(v as ArtType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="album">Comps Only</SelectItem>
                  <SelectItem value="single">Singles Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Sort By</label>
              <Select
                value={albumSortType}
                onValueChange={(v) => setAlbumSortType(v as SortType)}
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
                placeholder="Search by name..."
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
              <Heart className={cn('h-4 w-4', showFavoritesOnly && 'fill-current')} />
              Favorites
            </Button>

            {(selectedArtist !== 'all' ||
              selectedType !== 'all' ||
              searchQuery ||
              albumSortType !== 'recent' ||
              showFavoritesOnly) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedArtist('all')
                  setSelectedType('all')
                  setSearchQuery('')
                  setAlbumSortType('recent')
                  setShowFavoritesOnly(false)
                }}
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
                isFavorite={isFavorite(album.id, 'album')}
                onToggleFavorite={() => toggleFavorite(album.id, 'album')}
                onInfoClick={(album) => {
                  setSelectedAlbum(album)
                  setShowAlbumModal(true)
                }}
                onDownload={() => incrementAlbumDownload(album.id)}
              />
            ))}
          </div>

          {/* Loading indicator */}
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
              <Select value={selectedArtist} onValueChange={setSelectedArtist}>
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
              <label className="text-sm font-medium mb-2 block">Sort By</label>
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
              <Heart className={cn('h-4 w-4', showFavoritesOnly && 'fill-current')} />
              Favorites
            </Button>

            {(selectedArtist !== 'all' ||
              selectedCustomType !== 'all' ||
              searchQuery ||
              sortType !== 'recent' ||
              showFavoritesOnly) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedArtist('all')
                  setSelectedCustomType('all')
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
                  isFavorite={isFavorite(artwork.id, 'custom')}
                  onToggleFavorite={() => toggleFavorite(artwork.id, 'custom')}
                  onClick={() => {
                    setSelectedArtwork(artwork)
                    setShowDetailModal(true)
                  }}
                  onDownload={() => incrementDownload(artwork.id)}
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
  )
}

function AlbumArtCard({
  album,
  downloads,
  isFavorite,
  onToggleFavorite,
  onInfoClick,
  onDownload,
}: {
  album: IAlbum
  downloads: number
  isFavorite: boolean
  onToggleFavorite: () => void
  onInfoClick: (album: IAlbum) => void
  onDownload: () => void
}) {
  const isSingle = album.songCount === 1
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

  return (
    <Link
      to={ROUTES.ALBUM.PAGE(album.id)}
      className="group relative aspect-square rounded-lg overflow-hidden bg-muted hover:ring-2 hover:ring-primary transition-all"
    >
      <LazyLoadImage
        src={getCoverArtUrl(album.coverArt, 'album', '400')}
        alt={`${album.name} by ${album.artist}`}
        className="w-full h-full object-cover"
        effect="opacity"
      />

      {/* Favorite icon (always visible) */}
      <button
        onClick={handleFavoriteClick}
        className="absolute top-2 left-2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart className={cn('w-4 h-4', isFavorite && 'fill-red-500 text-red-500')} />
      </button>

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            onClick={handleInfoClick}
            className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            title="Info"
          >
            <Info className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-center gap-1 mb-1">
            <TrendingDown className="w-3 h-3 text-white/80" />
            <span className="text-xs text-white/80">
              {downloads} {downloads === 1 ? 'download' : 'downloads'}
            </span>
          </div>
          <div className="flex items-center gap-1 mb-1">
            {isSingle ? (
              <Disc className="w-3 h-3 text-white/80" />
            ) : (
              <Disc3 className="w-3 h-3 text-white/80" />
            )}
            <span className="text-xs text-white/80">
              {isSingle ? 'Single' : 'Comp'}
            </span>
          </div>
          <p className="text-sm font-medium text-white line-clamp-1">
            {album.name}
          </p>
          <p className="text-xs text-white/80 line-clamp-1">{album.artist}</p>
        </div>
      </div>
    </Link>
  )
}

function CustomArtCard({
  artwork,
  isFavorite,
  onToggleFavorite,
  onClick,
  onDownload,
}: {
  artwork: CustomArtwork
  isFavorite: boolean
  onToggleFavorite: () => void
  onClick: () => void
  onDownload: () => void
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
      onDownload() // Increment download counter
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

  return (
    <button
      onClick={onClick}
      className="group relative aspect-square rounded-lg overflow-hidden bg-muted hover:ring-2 hover:ring-primary transition-all text-left"
    >
      <img
        src={artwork.imageData}
        alt={artwork.artworkName}
        className="w-full h-full object-cover"
      />

      {/* Favorite icon (always visible) */}
      <button
        onClick={handleFavoriteClick}
        className="absolute top-2 left-2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart className={cn('w-4 h-4', isFavorite && 'fill-red-500 text-red-500')} />
      </button>

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleDownload}
          className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </button>
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
              {artwork.downloads || 0} downloads
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-white/80" />
            <span className="text-xs text-white/80">{artwork.compEra}</span>
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
