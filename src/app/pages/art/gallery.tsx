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
import { Disc, Disc3, User, Calendar, Download } from 'lucide-react'
import { useInfiniteQuery } from '@tanstack/react-query'
import debounce from 'lodash/debounce'
import { queryKeys } from '@/utils/queryKeys'
import { AlbumsFilters } from '@/utils/albumsFilter'
import { getMainScrollElement } from '@/utils/scrollPageToTop'
import { UploadArtworkDialog } from '@/app/components/art/upload-artwork-dialog'
import { useArtworkStore, CustomArtwork, ArtworkType } from '@/store/artwork.store'
import { ArtworkDetailModal } from '@/app/components/art/artwork-detail-modal'
import { useToast } from '@/hooks/use-toast'

type ArtType = 'all' | 'album' | 'single'

const typeLabels: Record<ArtworkType, string> = {
  [ArtworkType.SingleCover]: 'Single Cover',
  [ArtworkType.Artwork]: 'Artwork',
  [ArtworkType.AlbumCover]: 'Comp/Album Cover',
}

export default function ArtGallery() {
  const { t } = useTranslation()
  const [selectedArtist, setSelectedArtist] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<ArtType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomType, setSelectedCustomType] = useState<string>('all')
  const [selectedArtwork, setSelectedArtwork] = useState<CustomArtwork | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const scrollDivRef = useRef<HTMLDivElement | null>(null)

  const { artworks, loadArtworks } = useArtworkStore()

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

  // Filter albums
  const filteredAlbums = useMemo(() => {
    return albums.filter((album) => {
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
  }, [albums, selectedArtist, selectedType, searchQuery])

  // Filter custom artworks
  const filteredCustomArtworks = useMemo(() => {
    return artworks.filter((artwork) => {
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
  }, [artworks, selectedArtist, selectedCustomType, searchQuery])

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
            Explore album artwork and custom designs from your music library
          </p>
        </div>
        <UploadArtworkDialog />
      </div>

      <Tabs defaultValue="albums" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="albums">Album Covers</TabsTrigger>
          <TabsTrigger value="custom">
            Custom Artwork ({artworks.length})
          </TabsTrigger>
        </TabsList>

        {/* Album Covers Tab */}
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
                  <SelectItem value="album">Albums Only</SelectItem>
                  <SelectItem value="single">Singles Only</SelectItem>
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

            {(selectedArtist !== 'all' ||
              selectedType !== 'all' ||
              searchQuery) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedArtist('all')
                  setSelectedType('all')
                  setSearchQuery('')
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            {filteredAlbums.map((album) => (
              <AlbumArtCard key={album.id} album={album} />
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
                    Comp/Album Cover
                  </SelectItem>
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

            {(selectedArtist !== 'all' ||
              selectedCustomType !== 'all' ||
              searchQuery) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedArtist('all')
                  setSelectedCustomType('all')
                  setSearchQuery('')
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
              {filteredCustomArtworks.map((artwork) => (
                <CustomArtCard
                  key={artwork.id}
                  artwork={artwork}
                  onClick={() => {
                    setSelectedArtwork(artwork)
                    setShowDetailModal(true)
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
    </div>
  )
}

function AlbumArtCard({ album }: { album: IAlbum }) {
  const isSingle = album.songCount === 1

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

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-center gap-1 mb-1">
            {isSingle ? (
              <Disc className="w-3 h-3 text-white/80" />
            ) : (
              <Disc3 className="w-3 h-3 text-white/80" />
            )}
            <span className="text-xs text-white/80">
              {isSingle ? 'Single' : 'Album'}
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
  onClick,
}: {
  artwork: CustomArtwork
  onClick: () => void
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
      success('Downloaded', `${artwork.artworkName} saved to downloads`)
    } catch (err) {
      error('Download failed', 'Failed to download artwork')
      console.error(err)
    }
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
