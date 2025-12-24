import { getCoverArtUrl } from '@/api/httpClient'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { ROUTES } from '@/routes/routesList'
import { useAlbumsInfinite } from '@/app/api/album'
import { IAlbum } from '@/types/responses/album'
import { Disc, Disc3 } from 'lucide-react'

type ArtType = 'all' | 'album' | 'single'

export default function ArtGallery() {
  const { t } = useTranslation()
  const [selectedArtist, setSelectedArtist] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<ArtType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useAlbumsInfinite()

  const albums = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap((page) => page.album.album)
  }, [data])

  // Get unique artists
  const artists = useMemo(() => {
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

  // Filter albums
  const filteredAlbums = useMemo(() => {
    return albums.filter((album) => {
      // Filter by artist
      if (selectedArtist !== 'all' && album.artistId !== selectedArtist) {
        return false
      }

      // Filter by type (album vs single)
      if (selectedType !== 'all') {
        const isSingle = album.songCount === 1
        if (selectedType === 'single' && !isSingle) return false
        if (selectedType === 'album' && isSingle) return false
      }

      // Filter by search query
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

  const handleScroll = useCallback(() => {
    const scrollArea = document.getElementById('main-scroll-area')
    if (!scrollArea || !hasNextPage || isFetchingNextPage) return

    const { scrollTop, scrollHeight, clientHeight } = scrollArea
    if (scrollTop + clientHeight >= scrollHeight - 500) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  useEffect(() => {
    const scrollArea = document.getElementById('main-scroll-area')
    if (!scrollArea) return

    scrollArea.addEventListener('scroll', handleScroll)
    return () => scrollArea.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return (
    <div className="w-full p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Art Gallery</h1>
        <p className="text-muted-foreground">
          Explore album artwork from your music library
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">Artist</label>
          <Select value={selectedArtist} onValueChange={setSelectedArtist}>
            <SelectTrigger>
              <SelectValue placeholder="All Artists" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Artists</SelectItem>
              {artists.map((artist) => (
                <SelectItem key={artist.id} value={artist.id}>
                  {artist.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">Type</label>
          <Select value={selectedType} onValueChange={(v) => setSelectedType(v as ArtType)}>
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

        {(selectedArtist !== 'all' || selectedType !== 'all' || searchQuery) && (
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
      <div className="mb-4 text-sm text-muted-foreground">
        Showing {filteredAlbums.length} artwork{filteredAlbums.length !== 1 ? 's' : ''}
      </div>

      {/* Art Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
        {filteredAlbums.map((album) => (
          <ArtCard key={album.id} album={album} />
        ))}
      </div>

      {/* Loading indicator */}
      {isFetchingNextPage && (
        <div className="text-center py-8 text-muted-foreground">Loading more...</div>
      )}
    </div>
  )
}

function ArtCard({ album }: { album: IAlbum }) {
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
      
      {/* Overlay with info */}
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
