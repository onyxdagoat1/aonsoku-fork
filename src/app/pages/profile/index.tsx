import { Disc3, Info, Lock, Music } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  RiCameraFill,
  RiEdit2Fill,
  RiLoader4Fill,
  RiSave3Fill,
  RiUser3Fill,
} from 'react-icons/ri'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getCoverArtUrl } from '@/api/httpClient'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs'
import { getEraColor, getEraLabel } from '@/config/eras'
import { useAuth } from '@/contexts/AuthContext'
import type { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
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

type Profile = Database['public']['Tables']['profiles']['Row']

interface ContentItem {
  id: string
  type: 'song' | 'album' | 'single' | 'compilation'
  name?: string
  artist?: string
  coverArt?: string
  era?: string
}

function ContentCard({ item }: { item: ContentItem }) {
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
      </div>
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

export const ProfilePage = () => {
  const { id: profileId } = useParams<{ id: string }>()
  const {
    profile: myProfile,
    user: myUser,
    updateProfile,
    signOut,
    isAuthenticated,
  } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [targetId, setTargetId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Yeditor integration state
  const [yeditor, setYeditor] = useState<Yeditor | null>(null)
  const [stats, setStats] = useState<YeditorStats | null>(null)
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [followerCount, setFollowerCount] = useState(0)

  const isOwnProfile = !profileId || profileId === myUser?.id
  const fullName = myUser?.user_metadata?.full_name || ''

  useEffect(() => {
    if (!isAuthenticated && !profileId) {
      navigate('/login')
    }
  }, [isAuthenticated, profileId, navigate])

  const loadProfile = useCallback(async () => {
    const effectiveId = profileId || myUser?.id
    if (!effectiveId) return

    setLoading(true)
    try {
      // If it's my profile, use the one from context
      if (isOwnProfile && myProfile) {
        setProfile(myProfile as Profile)
        setDisplayName(myProfile.display_name || fullName || '')
        setBio(myProfile.bio || '')
      } else {
        // Fetch external profile
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', effectiveId)
          .single()

        if (error) throw error
        setProfile(data as Profile)
        setDisplayName(data.display_name || data.username || '')
        setBio(data.bio || '')
      }
      setTargetId(effectiveId)
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [profileId, myUser?.id, isOwnProfile, myProfile, fullName])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

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
        } catch (_error) {
          // Silently skip failed items
        }
      }
      setContentItems(items)
    },
    [],
  )

  const loadYeditorData = useCallback(async () => {
    if (!targetId) return
    try {
      const yeditorData = await yeditorService.getYeditorByUserId(targetId)
      if (yeditorData) {
        setYeditor(yeditorData)
        // Load additional data for verified yeditors
        const [statsData, workData, followers, collectionData] =
          await Promise.all([
            yeditorService.getYeditorStats(yeditorData.id),
            yeditorService.getYeditorWork(yeditorData.id),
            followService.getFollowerCount('yeditor', yeditorData.id),
            collectionService.getCollectionsByUser(yeditorData.id),
          ])

        setStats(statsData)
        setFollowerCount(followers)
        setCollections(collectionData)
        await loadContentDetails(workData)
      } else {
        setYeditor(null)
        setStats(null)
        setContentItems([])
        setCollections([])
      }
    } catch (error) {
      console.error('Error loading yeditor data:', error)
    }
  }, [targetId, loadContentDetails])

  useEffect(() => {
    if (targetId) {
      loadYeditorData()
    }
  }, [targetId, loadYeditorData])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const { error } = await updateProfile({
        display_name: displayName,
        bio: bio,
      })
      if (error) throw error
      setIsEditing(false)
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarClick = () => {
    if (isEditing && isOwnProfile) {
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file || !profile || !isOwnProfile) return

    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath)

      await updateProfile({ avatar_url: publicUrl })
      toast.success('Avatar updated!')
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      toast.error(error.message || 'Error uploading avatar')
    } finally {
      setIsUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <RiLoader4Fill className="text-3xl animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-foreground">
        Profile not found
      </div>
    )
  }

  const compilations = contentItems.filter(
    (i) => i.type === 'album' || i.type === 'compilation',
  )
  const singles = contentItems.filter((i) => i.type === 'single')
  const songs = contentItems.filter((i) => i.type === 'song')

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 relative overflow-hidden text-left">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-900/20 via-background/50 to-background z-0 pointer-events-none" />
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Banner */}
      <div className="h-64 w-full relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 opacity-60" />
        <img
          src="https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2070&auto=format&fit=crop"
          alt="Cover"
          className="w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />

        {isOwnProfile && (
          <div className="absolute top-4 right-4 z-20">
            <Button
              onClick={signOut}
              variant="ghost"
              className="bg-background/20 hover:bg-background/40 backdrop-blur-md border border-white/10 rounded-full h-10 px-6"
            >
              Sign Out
            </Button>
          </div>
        )}
      </div>

      <div className="container mx-auto px-6 relative z-10 -mt-32">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />

        <div className="flex flex-col md:flex-row gap-8 items-end md:items-end mb-8">
          {/* Avatar */}
          <div
            onClick={handleAvatarClick}
            className={`w-48 h-48 rounded-full border-[8px] border-background shadow-2xl relative group overflow-hidden bg-muted ${isEditing && isOwnProfile ? 'cursor-pointer' : ''}`}
          >
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username || 'Avatar'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-6xl font-black text-white uppercase">
                  {profile.username?.[0] || 'U'}
                </span>
              </div>
            )}

            {/* Upload Overlay */}
            {isEditing && isOwnProfile && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-sm">
                {isUploading ? (
                  <RiLoader4Fill className="text-white text-3xl animate-spin" />
                ) : (
                  <RiCameraFill className="text-white text-3xl" />
                )}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  {isEditing ? (
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="text-5xl font-black tracking-tighter bg-transparent border-b-2 border-primary/20 focus:border-primary focus:outline-none w-full max-w-md text-foreground"
                      placeholder="Display Name"
                    />
                  ) : (
                    <h1 className="text-5xl font-black tracking-tighter text-foreground">
                      {displayName}
                    </h1>
                  )}
                  {yeditor?.is_verified && (
                    <Badge className="bg-blue-500 hover:bg-blue-600 text-[10px] uppercase font-black px-2 py-0 border-none shadow-lg shadow-blue-500/20 translate-y-1">
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-xl text-muted-foreground font-medium flex items-center gap-2">
                  @{profile.username}
                  {yeditor && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase font-bold tracking-widest text-[10px]">
                      Curator
                    </span>
                  )}
                </p>
              </div>

              {isOwnProfile && (
                <div className="flex items-center gap-3">
                  <Button
                    onClick={isEditing ? handleSave : () => setIsEditing(true)}
                    disabled={isLoading}
                    className={`rounded-full h-11 px-8 font-bold shadow-xl transition-all ${
                      isEditing
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20'
                        : 'bg-white/10 hover:bg-white/20 text-foreground border border-white/10 backdrop-blur-md'
                    }`}
                  >
                    {isLoading ? (
                      <RiLoader4Fill className="animate-spin text-xl mr-2" />
                    ) : isEditing ? (
                      <>
                        <RiSave3Fill className="text-xl mr-2" /> Save Changes
                      </>
                    ) : (
                      <>
                        <RiEdit2Fill className="text-xl mr-2" /> Edit Profile
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Layout: Sidebar + Main */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="space-y-6">
            {/* About Card */}
            <div className="bg-card/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-4 flex items-center gap-2">
                <RiUser3Fill className="text-primary w-3 h-3" />
                About
              </h2>
              {isEditing ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full h-32 bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-foreground focus:border-primary focus:outline-none resize-none transition-colors"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-foreground/80 leading-relaxed text-sm whitespace-pre-wrap font-medium">
                  {bio || 'No bio yet.'}
                </p>
              )}
            </div>

            {/* Stats Card */}
            <div className="bg-card/30 border border-white/5 rounded-3xl p-6 grid grid-cols-2 gap-4 shadow-lg text-left">
              <div className="flex flex-col">
                <span className="text-2xl font-black text-primary tracking-tighter">
                  {yeditor ? followerCount : '0'}
                </span>
                <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">
                  Followers
                </span>
              </div>
              <div className="flex flex-col border-l border-white/10 pl-4">
                <span className="text-2xl font-black text-primary tracking-tighter">
                  {yeditor ? stats?.total_works || 0 : '0'}
                </span>
                <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">
                  Creations
                </span>
              </div>
              <div className="flex flex-col pt-2 pointer-events-none opacity-50">
                <span className="text-2xl font-black text-foreground tracking-tighter">
                  0
                </span>
                <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">
                  Following
                </span>
              </div>
              <div className="flex flex-col border-l border-white/10 pl-4 pt-2 pointer-events-none opacity-50">
                <span className="text-2xl font-black text-foreground tracking-tighter">
                  0
                </span>
                <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">
                  Likes
                </span>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {yeditor && yeditor.is_verified ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 text-left">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-black tracking-tighter uppercase italic">
                    {isOwnProfile ? 'Your Creations' : 'Creations'}
                  </h2>
                </div>

                <Tabs defaultValue="compilations" className="w-full">
                  <TabsList className="mb-8 bg-accent/40 p-1 rounded-2xl border w-full md:w-auto h-12">
                    <TabsTrigger
                      value="compilations"
                      className="rounded-xl px-6 h-full data-[state=active]:bg-background data-[state=active]:shadow-lg font-bold text-xs"
                    >
                      Comps
                    </TabsTrigger>
                    <TabsTrigger
                      value="singles"
                      className="rounded-xl px-6 h-full data-[state=active]:bg-background data-[state=active]:shadow-lg font-bold text-xs"
                    >
                      Singles
                    </TabsTrigger>
                    <TabsTrigger
                      value="collections"
                      className="rounded-xl px-6 h-full data-[state=active]:bg-background data-[state=active]:shadow-lg font-bold text-xs"
                    >
                      Collabs
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="compilations"
                    className="animate-in fade-in duration-500 mt-0"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                      {compilations.map((item) => (
                        <ContentCard key={item.id} item={item} />
                      ))}
                      {compilations.length === 0 && (
                        <div className="col-span-full py-16 bg-accent/10 rounded-3xl border border-dashed flex flex-col items-center">
                          <Disc3 className="w-10 h-10 text-muted-foreground/20 mb-4" />
                          <p className="text-muted-foreground text-sm font-medium">
                            No comps yet
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="singles"
                    className="animate-in fade-in duration-500 mt-0"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                      {singles.map((item) => (
                        <ContentCard key={item.id} item={item} />
                      ))}
                      {singles.length === 0 && (
                        <div className="col-span-full py-16 bg-accent/10 rounded-3xl border border-dashed flex flex-col items-center">
                          <Info className="w-10 h-10 text-muted-foreground/20 mb-4" />
                          <p className="text-muted-foreground text-sm font-medium">
                            No singles yet
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="songs"
                    className="animate-in fade-in duration-500 mt-0"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {songs.map((item) => (
                        <SongRow key={item.id} item={item} />
                      ))}
                      {songs.length === 0 && (
                        <div className="col-span-full py-16 bg-accent/10 rounded-3xl border border-dashed flex flex-col items-center">
                          <Music className="w-10 h-10 text-muted-foreground/20 mb-4" />
                          <p className="text-muted-foreground text-sm font-medium">
                            No songs curated yet
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="collections"
                    className="animate-in fade-in duration-500 mt-0"
                  >
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {collections.map((collection) => (
                        <CollectionCard
                          key={collection.id}
                          collection={collection}
                        />
                      ))}
                      {collections.length === 0 && (
                        <div className="col-span-full py-16 bg-accent/10 rounded-3xl border border-dashed flex flex-col items-center">
                          <Disc3 className="w-10 h-10 text-muted-foreground/20 mb-4" />
                          <p className="text-muted-foreground text-sm font-medium">
                            No collabs yet
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="bg-card/30 border border-white/5 rounded-3xl p-12 text-center shadow-xl animate-in fade-in duration-1000">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Lock className="w-8 h-8 text-primary/40" />
                </div>
                <h3 className="text-2xl font-black tracking-tighter mb-2">
                  Private Creations
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto text-sm">
                  {yeditor
                    ? 'Verify curator status to showcase curated works and playlists on this profile.'
                    : 'Become a curator to start sharing music selections with the community.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
