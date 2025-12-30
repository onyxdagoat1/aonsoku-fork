import {
  Disc3,
  Edit2,
  Info,
  MoreVertical,
  Music,
  Plus,
  Save,
  User,
  Users,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getCoverArtUrl } from '@/api/httpClient'
import { AddToCollectionDialog } from '@/app/components/collections/add-to-collection-dialog'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent } from '@/app/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import { Input } from '@/app/components/ui/input'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs'
import { Textarea } from '@/app/components/ui/textarea'
import { FollowButton } from '@/app/components/yeditor/FollowButton'
import { getEraColor, getEraLabel } from '@/config/eras'
import { useAuth } from '@/contexts/AuthContext'
import { type Collection, collectionService } from '@/service/collectionService'
import { eraService } from '@/service/eraService'
import { followService } from '@/service/followService'
import { subsonic } from '@/service/subsonic'
import {
  type ContentYeditor,
  type Yeditor,
  type YeditorStats,
  yeditorService,
} from '@/service/yeditorService'

interface ContentItem {
  id: string
  type: 'song' | 'album' | 'single' | 'compilation'
  name?: string
  artist?: string
  coverArt?: string
  era?: string
}

function ContentCard({ item }: { item: ContentItem }) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  return (
    <div className="group block relative">
      <a href={`/library/albums/${item.id}`}>
        <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-2 relative">
          {item.coverArt ? (
            <img
              src={getCoverArtUrl(item.coverArt, 'album', '300')}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Disc3 className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
        </div>
      </a>

      <div className="absolute top-2 left-2 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add to Collection
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AddToCollectionDialog
        contentId={item.id}
        contentType={item.type}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />

      <h4 className="font-medium truncate group-hover:text-primary transition-colors">
        {item.name}
      </h4>
      <p className="text-sm text-muted-foreground truncate">{item.artist}</p>
      {item.era && (
        <Badge
          variant="secondary"
          className="mt-1 text-xs text-white"
          style={{ backgroundColor: getEraColor(item.era) }}
        >
          {getEraLabel(item.era)}
        </Badge>
      )}
    </div>
  )
}

function SongRow({ item }: { item: ContentItem }) {
  const [showAddDialog, setShowAddDialog] = useState(false)

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card border hover:bg-muted/50 transition-all group relative">
      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
        {item.coverArt ? (
          <img
            src={getCoverArtUrl(item.coverArt, 'song', '100')}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Music className="w-6 h-6 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate group-hover:text-primary transition-colors">
          {item.name}
        </h4>
        <p className="text-sm text-muted-foreground truncate">{item.artist}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {item.era && (
          <Badge
            variant="secondary"
            className="text-[10px] uppercase font-bold text-white px-2 py-0.5"
            style={{ backgroundColor: getEraColor(item.era) }}
          >
            {getEraLabel(item.era)}
          </Badge>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add to Collection
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AddToCollectionDialog
        contentId={item.id}
        contentType="song"
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </div>
  )
}

function CollectionCard({ collection }: { collection: Collection }) {
  return (
    <a href={`/collection/${collection.id}`} className="group block">
      <div className="aspect-square rounded-xl overflow-hidden bg-muted mb-2 relative">
        {collection.cover_image_url ? (
          <img
            src={collection.cover_image_url}
            alt={collection.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
            <Disc3 className="w-12 h-12 text-primary/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Badge
            variant="secondary"
            className="backdrop-blur-md bg-white/20 text-white"
          >
            View Collection
          </Badge>
        </div>
      </div>
      <h4 className="font-medium truncate group-hover:text-primary transition-colors">
        {collection.title}
      </h4>
      <p className="text-sm text-muted-foreground truncate">
        {collection.item_count} items
      </p>
    </a>
  )
}

export default function YeditorProfile() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [yeditor, setYeditor] = useState<Yeditor | null>(null)
  const [stats, setStats] = useState<YeditorStats | null>(null)
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [followerCount, setFollowerCount] = useState(0)
  const [collections, setCollections] = useState<Collection[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editedBio, setEditedBio] = useState('')
  const [editedAvatar, setEditedAvatar] = useState('')

  const loadContentDetails = useCallback(
    async (workItems: ContentYeditor[]) => {
      const items: ContentItem[] = []

      for (const workItem of workItems) {
        try {
          if (
            workItem.content_type === 'album' ||
            workItem.content_type === 'compilation' ||
            workItem.content_type === 'single'
          ) {
            const album = await subsonic.albums.getOne(workItem.content_id)
            if (album) {
              const era = await eraService.getEra(workItem.content_id, 'album')
              items.push({
                id: workItem.content_id,
                type: workItem.content_type,
                name: album.name,
                artist: album.artist,
                coverArt: album.coverArt,
                era: era || undefined,
              })
            }
          } else if (workItem.content_type === 'song') {
            const song = await subsonic.songs.getSong(workItem.content_id)
            if (song) {
              const era = await eraService.getEra(workItem.content_id, 'song')
              items.push({
                id: workItem.content_id,
                type: 'song',
                name: song.title,
                artist: song.artist,
                coverArt: song.coverArt,
                era: era || undefined,
              })
            }
          }
        } catch (error) {
          console.error('Error loading content details:', error)
        }
      }

      setContentItems(items)
    },
    [],
  )

  const loadYeditorData = useCallback(async () => {
    if (!id) return

    setLoading(true)
    try {
      const yeditorData = await yeditorService.getYeditor(id)
      setYeditor(yeditorData)

      if (yeditorData) {
        setEditedBio(yeditorData.bio || '')
        setEditedAvatar(yeditorData.avatar_url || '')

        // Load stats
        const statsData = await yeditorService.getYeditorStats(id)
        setStats(statsData)

        // Load work
        const workData = await yeditorService.getYeditorWork(id)

        // Load follower count
        const followers = await followService.getFollowerCount('yeditor', id)
        setFollowerCount(followers)

        // Load collections
        const collectionData = await collectionService.getCollectionsByUser(id)
        setCollections(collectionData)

        // Load content details
        await loadContentDetails(workData)
      }
    } catch (error) {
      console.error('Error loading yeditor data:', error)
    } finally {
      setLoading(false)
    }
  }, [id, loadContentDetails])

  useEffect(() => {
    if (id) {
      loadYeditorData()
    }
  }, [id, loadYeditorData])

  const handleFollowChange = (isFollowing: boolean) => {
    setFollowerCount((prev) => (isFollowing ? prev + 1 : prev - 1))
  }

  const handleUpdateProfile = async () => {
    if (!yeditor || !id) return

    try {
      const updated = await yeditorService.updateYeditor(id, {
        bio: editedBio,
        avatar_url: editedAvatar,
      })

      if (updated) {
        setYeditor(updated)
        setIsEditing(false)
        toast.success('Profile updated successfully')
      } else {
        toast.error('Failed to update profile')
      }
    } catch {
      toast.error('An error occurred during update')
    }
  }

  if (loading) {
    return (
      <div className="w-full p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground font-mono uppercase tracking-widest">
          Loading Curator Profile...
        </div>
      </div>
    )
  }

  if (!yeditor) {
    return (
      <div className="w-full p-6">
        <div className="text-center py-20 bg-card/50 rounded-3xl border border-dashed">
          <User className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-20" />
          <h2 className="text-2xl font-bold mb-2">Curator Not Found</h2>
          <p className="text-muted-foreground">
            This curator profile doesn't exist or has been removed.
          </p>
        </div>
      </div>
    )
  }

  const compilations = contentItems.filter(
    (i) => i.type === 'album' || i.type === 'compilation',
  )
  const singles = contentItems.filter((i) => i.type === 'single')
  const songs = contentItems.filter((i) => i.type === 'song')

  return (
    <div className="w-full pb-20">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="h-64 bg-primary/5 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
        </div>

        <div className="px-6 -mt-32 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
            <div className="w-48 h-48 rounded-full bg-muted flex items-center justify-center overflow-hidden border-[8px] border-background shadow-2xl relative group">
              {yeditor.avatar_url ? (
                <img
                  src={yeditor.avatar_url}
                  alt={yeditor.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                />
              ) : (
                <User className="w-24 h-24 text-muted-foreground/30" />
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                <h1 className="text-5xl font-black tracking-tighter">
                  {yeditor.name}
                </h1>
                {yeditor.is_verified && (
                  <Badge className="bg-blue-500 hover:bg-blue-600 text-[10px] uppercase font-black px-2 py-0 border-none shadow-lg shadow-blue-500/20">
                    Verified
                  </Badge>
                )}
                {user?.id === yeditor.user_id && !isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-10 w-10 bg-accent/50 hover:bg-accent"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4 max-w-2xl bg-card/80 backdrop-blur-xl p-6 rounded-3xl border shadow-2xl animate-in fade-in slide-in-from-bottom-4">
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">
                      Avatar URL
                    </label>
                    <Input
                      value={editedAvatar}
                      onChange={(e) => setEditedAvatar(e.target.value)}
                      placeholder="https://..."
                      className="bg-accent/40 border-none h-12 rounded-xl focus-visible:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">
                      Curator Bio
                    </label>
                    <Textarea
                      value={editedBio}
                      onChange={(e) => setEditedBio(e.target.value)}
                      placeholder="Tell the community about your curation style..."
                      className="bg-accent/40 border-none min-h-[120px] rounded-xl focus-visible:ring-primary/30 resize-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="secondary"
                      className="flex-1 rounded-xl h-12"
                      onClick={() => setIsEditing(false)}
                    >
                      <X className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                    <Button
                      className="flex-1 rounded-xl h-12 shadow-xl shadow-primary/20"
                      onClick={handleUpdateProfile}
                    >
                      <Save className="w-4 h-4 mr-2" /> Update Profile
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mb-6">
                  {yeditor.bio || 'Professional curato.'}
                </p>
              )}

              <div className="flex items-center justify-center md:justify-start gap-12 text-sm">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-primary tracking-tighter">
                    {followerCount}
                  </span>
                  <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                    Followers
                  </span>
                </div>
                <div className="flex flex-col border-l pl-12 border-white/10">
                  <span className="text-2xl font-black text-primary tracking-tighter">
                    {stats?.total_works || 0}
                  </span>
                  <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                    Creations
                  </span>
                </div>
                {!isEditing && (
                  <div className="flex items-center pl-6">
                    <FollowButton
                      type="yeditor"
                      id={yeditor.id}
                      name={yeditor.name}
                      onFollowChange={handleFollowChange}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="px-6 mt-16 text-center md:text-left">
        <Tabs defaultValue="compilations" className="w-full">
          <TabsList className="mb-12 inline-flex bg-accent/50 p-1.5 rounded-2xl border">
            <TabsTrigger
              value="compilations"
              className="rounded-xl px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-lg font-bold"
            >
              Compilations
            </TabsTrigger>
            <TabsTrigger
              value="singles"
              className="rounded-xl px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-lg font-bold"
            >
              Singles
            </TabsTrigger>
            <TabsTrigger
              value="songs"
              className="rounded-xl px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-lg font-bold"
            >
              Songs
            </TabsTrigger>
            <TabsTrigger
              value="collections"
              className="rounded-xl px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-lg font-bold"
            >
              Collections
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="compilations"
            className="animate-in fade-in duration-500 slide-in-from-bottom-2"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {compilations.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
              {compilations.length === 0 && (
                <div className="col-span-full py-20 bg-accent/20 rounded-3xl border border-dashed flex flex-col items-center">
                  <Disc3 className="w-12 h-12 text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground font-medium text-center">
                    No curated comps found
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent
            value="singles"
            className="animate-in fade-in duration-500 slide-in-from-bottom-2"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {singles.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
              {singles.length === 0 && (
                <div className="col-span-full py-20 bg-accent/20 rounded-3xl border border-dashed flex flex-col items-center">
                  <Info className="w-12 h-12 text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground font-medium text-center">
                    No curated singles found
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent
            value="songs"
            className="animate-in fade-in duration-500 slide-in-from-bottom-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {songs.map((item) => (
                <SongRow key={item.id} item={item} />
              ))}
              {songs.length === 0 && (
                <div className="col-span-full py-20 bg-accent/20 rounded-3xl border border-dashed flex flex-col items-center">
                  <Music className="w-12 h-12 text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground font-medium text-center">
                    No individually curated songs found
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent
            value="collections"
            className="animate-in fade-in duration-500 slide-in-from-bottom-2"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {collections.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
              ))}
              {collections.length === 0 && (
                <div className="col-span-full py-20 bg-accent/20 rounded-3xl border border-dashed flex flex-col items-center">
                  <Disc3 className="w-12 h-12 text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground font-medium text-center">
                    No curated collections created yet
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
