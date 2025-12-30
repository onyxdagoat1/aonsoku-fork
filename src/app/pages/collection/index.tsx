import { Disc3, Music, Share2, User } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getCoverArtUrl } from '@/api/httpClient'
import { PlaylistFallback } from '@/app/components/fallbacks/playlist-fallbacks'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { getEraColor, getEraLabel } from '@/config/eras'
import { ROUTES } from '@/routes/routesList'
import {
  type Collection,
  type CollectionItem,
  collectionService,
} from '@/service/collectionService'
import { eraService } from '@/service/eraService'
import { subsonic } from '@/service/subsonic'
import { type Yeditor, yeditorService } from '@/service/yeditorService'
import { usePlayerActions } from '@/store/player.store'
import { ISong } from '@/types/responses/song'

interface ResolvedItem {
  id: string
  content_id: string
  type: string
  name: string
  artist: string
  coverArt?: string
  era?: string
}

export default function CollectionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [items, setItems] = useState<ResolvedItem[]>([])
  const [creator, setCreator] = useState<Yeditor | null>(null)
  const [loading, setLoading] = useState(true)
  const { setSongList } = usePlayerActions()

  const resolveItems = useCallback(
    async (collectionItems: CollectionItem[]) => {
      const resolved: ResolvedItem[] = []

      for (const item of collectionItems) {
        try {
          if (
            item.content_type === 'album' ||
            item.content_type === 'compilation' ||
            item.content_type === 'single'
          ) {
            const album = await subsonic.albums.getOne(item.content_id)
            if (album) {
              const era = await eraService.getEra(item.content_id, 'album')
              resolved.push({
                id: item.id,
                content_id: item.content_id,
                type: item.content_type,
                name: album.name,
                artist: album.artist,
                coverArt: album.coverArt,
                era: era || undefined,
              })
            }
          } else if (item.content_type === 'song') {
            const song = await subsonic.songs.getSong(item.content_id)
            if (song) {
              const era = await eraService.getEra(item.content_id, 'song')
              resolved.push({
                id: item.id,
                content_id: item.content_id,
                type: 'song',
                name: song.title,
                artist: song.artist,
                coverArt: song.coverArt,
                era: era || undefined,
              })
            }
          }
        } catch (error) {
          console.error(`Error resolving item ${item.content_id}:`, error)
        }
      }

      setItems(resolved)
    },
    [],
  )

  const loadCollectionData = useCallback(async () => {
    if (!id) return
    setLoading(true)

    try {
      const data = await collectionService.getCollectionWithItems(id)
      if (data) {
        setCollection(data.collection)

        // Load creator details (Yeditor connected to the user)
        if (data.collection.created_by) {
          const yeditor = await yeditorService.getYeditorByUserId(
            data.collection.created_by,
          )
          setCreator(yeditor)
        }

        // Resolve items
        await resolveItems(data.items)
      }
    } catch (error) {
      console.error('Error loading collection:', error)
      toast.error('Failed to load collection')
    } finally {
      setLoading(false)
    }
  }, [id, resolveItems])

  useEffect(() => {
    loadCollectionData()
  }, [loadCollectionData])

  const handlePlayAll = async () => {
    if (items.length === 0) return

    setLoading(true)
    const songs: ISong[] = []

    try {
      for (const item of items) {
        if (item.type === 'song') {
          const song = await subsonic.songs.getSong(item.content_id)
          if (song) songs.push(song)
        } else {
          const album = await subsonic.albums.getOne(item.content_id)
          if (album && album.song) {
            songs.push(...album.song)
          }
        }
      }

      if (songs.length > 0) {
        setSongList(songs, 0)
        toast.info(`Playing collection: ${collection?.title}`)
      }
    } catch (error) {
      console.error('Error playing collection:', error)
      toast.error('Failed to play collection')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Collection link copied to clipboard!')
  }

  if (loading) return <PlaylistFallback />

  if (!collection) {
    return (
      <div className="w-full p-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Collection Not Found</h2>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Hero Header */}
      <div className="relative p-8 md:p-12 transition-all overflow-hidden mb-8">
        {/* Background Blur */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-20 blur-3xl scale-110"
          style={{
            backgroundImage: collection.cover_image_url
              ? `url(${collection.cover_image_url})`
              : 'none',
          }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent to-background" />

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-end">
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-2xl shadow-2xl overflow-hidden bg-muted shrink-0 group">
            {collection.cover_image_url ? (
              <img
                src={collection.cover_image_url}
                alt={collection.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                <Disc3 className="w-24 h-24 text-primary/40" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              Collection
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-shadow-lg">
              {collection.title}
            </h1>
            {collection.description && (
              <p className="text-lg text-muted-foreground max-w-2xl text-balance">
                {collection.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-6 pt-2 text-sm">
              {creator && (
                <Link
                  to={ROUTES.YEDITOR.PAGE(creator.id)}
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-muted">
                    {creator.avatar_url ? (
                      <img
                        src={creator.avatar_url}
                        alt={creator.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 m-1" />
                    )}
                  </div>
                  <span className="font-bold">Curated by {creator.name}</span>
                </Link>
              )}
              <span className="text-muted-foreground">
                {items.length} items • Created{' '}
                {new Date(collection.created_at).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button
                size="lg"
                className="rounded-full px-8 shadow-xl hover:scale-105 active:scale-95 transition-all"
                onClick={handlePlayAll}
              >
                Play All
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="px-8 md:px-12 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {items.map((item, index) => (
            <ItemCard key={item.id} item={item} index={index} />
          ))}
          {items.length === 0 && (
            <div className="col-span-full py-20 text-center text-muted-foreground">
              <Music className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>This collection is empty.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ItemCard({ item, index }: { item: ResolvedItem; index: number }) {
  const isSong = item.type === 'song'
  const link = isSong ? `#` : ROUTES.ALBUM.PAGE(item.content_id)

  return (
    <div
      className="group relative flex flex-col bg-card/40 backdrop-blur-sm border rounded-2xl overflow-hidden hover:bg-card/60 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <Link to={link} className="aspect-square relative overflow-hidden">
        {item.coverArt ? (
          <img
            src={getCoverArtUrl(
              item.coverArt,
              isSong ? 'song' : 'album',
              '400',
            )}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            {isSong ? (
              <Music className="w-12 h-12 text-muted-foreground" />
            ) : (
              <Disc3 className="w-12 h-12 text-muted-foreground" />
            )}
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full shadow-lg"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </Link>

      <div className="p-4 flex-1 flex flex-col min-w-0">
        <h4 className="font-bold truncate leading-tight mb-1 group-hover:text-primary transition-colors">
          {item.name}
        </h4>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs text-muted-foreground truncate">
            {item.artist}
          </p>
        </div>

        <div className="mt-auto pt-2 flex items-center justify-between">
          {item.era && (
            <Badge
              variant="secondary"
              className="text-[9px] uppercase font-black text-white px-2 py-0"
              style={{ backgroundColor: getEraColor(item.era) }}
            >
              {getEraLabel(item.era)}
            </Badge>
          )}
          <Badge
            variant="outline"
            className="text-[9px] uppercase tracking-tighter opacity-50"
          >
            {item.type}
          </Badge>
        </div>
      </div>
    </div>
  )
}
